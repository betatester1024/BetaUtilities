"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var accessControl_exports = {};
__export(accessControl_exports, {
  DBGarbageCollect: () => DBGarbageCollect,
  validate: () => validate
});
module.exports = __toCommonJS(accessControl_exports);
var import_initialiser = require("./initialiser");
var import_updateuser = require("./updateuser");
var import_misc = require("./misc");
var import_database = require("./database");
var bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const DB = import_database.database.collection("SystemAUTH");
const DB2 = import_database.database.collection("SupportMessaging");
function validate(user, pwd, action, access, callback, token = "") {
  if (action != "refresh" && action != "refresh_log")
    (0, import_misc.systemLog)("Validating as " + user + " with action " + action + " (token " + token + ")");
  if (!token || !token.match("[0-9]+") || (!user || user && action != "CMD" && action != "sendMsg" && !user.match("^[a-zA-Z0-9_]+$")) || (!pwd || action != "CMD" && pwd.length <= 0)) {
    if (action != "checkAccess" && action != "checkAccess_A" && action != "logout" && action != "refresh" && action != "refresh_log" && action != "userReq" && action != "bMsg") {
      (0, import_misc.systemLog)("Unknown error");
      callback.end(JSON.stringify("ERROR"));
      return;
    }
  }
  if (action == "bMsg") {
    DB2.insertOne({
      fieldName: "MSG",
      sender: "BetaOS_System",
      data: user,
      permLevel: 3,
      expiry: Date.now() + 1e3 * 60 * 60 * 24
    });
    return;
  }
  if (action == "logout") {
    (0, import_misc.systemLog)("Logging out " + token);
    DB.deleteOne({ fieldName: "TOKEN", token });
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }
  if (action == "add" || action == "CMD" || action == "checkAccess" || action == "sendMsg" || action == "refresh" || action == "checkAccess_A" || action == "refresh_log" || action == "userReq") {
    DB.findOne({ fieldName: "TOKEN", token }).then(
      (obj) => {
        if (action == "userReq") {
          if (!obj)
            callback.end(JSON.stringify("NOACTIVE"));
          else
            callback.end(JSON.stringify(obj.associatedUser));
          return;
        }
        if (obj == null) {
          (0, import_misc.systemLog)("No active session");
          if (action == "checkAccess" || action == "checkAccess_A") {
            callback.sendFile(path.join(__dirname, "../frontend", "403.html"));
          } else
            callback.end(JSON.stringify("NOACTIVE"));
          return;
        }
        let expiryTime = obj.expiry;
        let tokenUser = obj.associatedUser;
        if (action != "refresh")
          (0, import_misc.systemLog)("Logged in as " + tokenUser + " | Expiring in: " + (expiryTime - Date.now()) + " ms");
        if (expiryTime < Date.now()) {
          (0, import_misc.systemLog)("Token expired. Logged out user.");
          DB.deleteOne({ fieldName: "TOKEN", token });
          if (action == "checkAccess" || action == "checkAccess_A")
            callback.sendFile(path.join(__dirname, "../frontend", "403.html"));
          else
            callback.end(JSON.stringify("EXPIRE"));
          return;
        }
        DB.findOne({ fieldName: "UserData", user: obj.associatedUser }).then(
          (obj2) => {
            let perms = obj2.permLevel;
            if (action == "add") {
              if (Number(perms) < 2) {
                if (user == tokenUser && access == "1") {
                  (0, import_misc.systemLog)("Updating password");
                  (0, import_updateuser.updateUser)(user, pwd);
                  callback.end(JSON.stringify("SUCCESS"));
                  return;
                }
                (0, import_misc.systemLog)("Permissions insufficient.");
                callback.end(JSON.stringify("ACCESS"));
                return;
              } else if (Number(access) < 3) {
                (0, import_misc.systemLog)("Access granted; Token not expired. Adding " + user + " with permissions" + access);
                (0, import_updateuser.updateUser)(user, pwd, Number(access));
                callback.end(JSON.stringify("SUCCESS"));
                return;
              } else {
                (0, import_misc.systemLog)("Invalid access-level granting:");
                callback.end(JSON.stringify("ACCESS"));
                return;
              }
            } else if (action == "CMD" && perms == 3) {
              (0, import_misc.systemLog)("Evaluating " + user);
              try {
                (0, import_misc.systemLog)(eval(user));
              } catch (e) {
                (0, import_misc.systemLog)(e);
              }
              ;
              callback.end(JSON.stringify("SUCCESS"));
            } else if (action == "checkAccess") {
              (0, import_misc.systemLog)("Support access granted!");
              callback.sendFile(path.join(__dirname, "../frontend", "support.html"));
              return;
            } else if (action == "checkAccess_A" && perms >= 2) {
              (0, import_misc.systemLog)("SysLog access granted!");
              callback.sendFile(path.join(__dirname, "../frontend", "sysLog.html"));
              return;
            } else if (action == "sendMsg" && perms >= 1) {
              (0, import_misc.systemLog)("adding message: " + user);
              DB2.insertOne({
                fieldName: "MSG",
                sender: obj.associatedUser,
                data: user,
                permLevel: perms,
                expiry: Date.now() + 1e3 * 60 * 60 * 24
              });
              callback.end(JSON.stringify("SUCCESS"));
              import_initialiser.currHandler.onMessage(user, obj.associatedUser);
              return;
            } else if (action == "refresh" && perms >= 1) {
              DB2.find({ fieldName: "MSG" }).toArray().then((objs) => {
                let out = "";
                for (let i = Math.max(0, objs.length - 100); i < objs.length; i++) {
                  let cls_n = "", extraText = "";
                  switch (objs[i].permLevel) {
                    case 2:
                      cls_n = "admin";
                      extraText = " [ADMIN]";
                      break;
                    case 3:
                      cls_n = "beta";
                      extraText = " [SYSTEM]";
                      break;
                  }
                  let data = objs[i].data;
                  data = data.replaceAll("&", "&amp;");
                  data = data.replaceAll("<", "&gt;");
                  data = data.replaceAll(">", "&lt;");
                  data = data.replaceAll("\\n", "<br>");
                  data = data.replaceAll(":one:", "<span class='material-symbols-outlined'>counter_1</span>");
                  data = data.replaceAll(":two:", "<span class='material-symbols-outlined'>counter_2</span>");
                  data = data.replaceAll(":three:", "<span class='material-symbols-outlined'>counter_3</span>");
                  data = data.replaceAll(":four:", "<span class='material-symbols-outlined'>counter_4</span>");
                  data = data.replaceAll(":five:", "<span class='material-symbols-outlined'>counter_5</span>");
                  data = data.replaceAll(":six:", "<span class='material-symbols-outlined'>counter_6</span>");
                  data = data.replaceAll(":seven:", "<span class='material-symbols-outlined'>counter_7</span>");
                  data = data.replaceAll(":eight:", "<span class='material-symbols-outlined'>counter_8</span>");
                  data = data.replaceAll(":nine:", "<span class='material-symbols-outlined'>counter_9</span>");
                  data = data.replaceAll(":zero:", "<span class='material-symbols-outlined'>counter_0</span>");
                  data = data.replaceAll(":white_check_mark:", "<span class='material-symbols-outlined'>check_circle</span>");
                  let cls_w = "";
                  if (data.match("^/me")) {
                    cls_w += " slashMe";
                    data = data.replace("/me", "");
                  }
                  if (objs[i].sender == "betaos") {
                    cls_n += " beta";
                    extraText = " [SYSTEM]";
                  }
                  cls_w += " " + cls_n;
                  out += `<p class="${cls_w}""><b class='${cls_n}'>
              ${objs[i].sender}${extraText}:</b> ${data} </p><br>`;
                }
                callback.end(JSON.stringify(out));
              });
              return;
            } else if (action == "refresh_log" && perms >= 2) {
              let msg = fs.readFileSync("./systemLog.txt").toString();
              msg = msg.replaceAll("\n", "<br>");
              callback.end(JSON.stringify(msg));
            } else if (action == "refresh_log" || action == "refresh" || action == "checkAccess_A") {
              callback.sendFile(path.join(__dirname, "../frontend", "403.html"));
            } else {
              (0, import_misc.systemLog)("No perms!");
              callback.end(JSON.stringify("ACCESS"));
              return;
            }
          }
        );
      }
    );
    return;
  }
  if (action == "signup") {
    DB.findOne({ fieldName: "UserData", user }).then((obj3) => {
      if (obj3 != null) {
        (0, import_misc.systemLog)(user + " was already registered");
        callback.end(JSON.stringify("TAKEN"));
        return;
      } else {
        (0, import_misc.systemLog)("Registered user " + user + "with pass: " + pwd);
        (0, import_updateuser.updateUser)(user, pwd, 1);
        validate(user, pwd, "login", "", callback, token);
        return;
      }
    });
    return;
  }
  DB.findOne({ fieldName: "UserData", user }).then(
    (obj3) => {
      if (obj3 && bcrypt.compareSync(pwd, obj3.passHash)) {
        let perm = obj3.permLevel;
        (0, import_misc.systemLog)("Password OK for user " + user + " | Perms: " + perm);
        callback.end(JSON.stringify(perm));
        let exp = perm < 3 ? Date.now() + 1e3 * 60 * 60 : Date.now() + 1e3 * 60;
        (0, import_misc.systemLog)("Logging user " + user + " with expiry " + exp + " (in " + (exp - Date.now()) + " ms)");
        DB.updateOne(
          { fieldName: "TOKEN", token },
          {
            $set: {
              associatedUser: user,
              expiry: exp
            },
            $currentDate: { lastModified: true }
          },
          { upsert: true }
        );
      } else {
        (0, import_misc.systemLog)("Invalid credentials.");
        let response = 0;
        callback.end(JSON.stringify(response));
      }
      ;
    }
  );
}
async function DBGarbageCollect() {
  DB2.find({ fieldName: "MSG" }).toArray().then(
    (objs) => {
      for (let i = 0; i < objs.length; i++) {
        if (Date.now() > objs[i].expiry || objs[i].expiry == null)
          DB2.deleteOne({ fieldName: "MSG", expiry: objs[i].expiry });
      }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DBGarbageCollect,
  validate
});
//# sourceMappingURL=accessControl.js.map
