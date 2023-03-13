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
var import_wsHandler = require("./wsHandler");
var import_initialiser = require("./initialiser");
var import_updateuser = require("./updateuser");
var import_misc = require("./misc");
var import_replacements = require("./replacements");
var import_server = require("./server");
var import_database = require("./database");
var import_webHandler = require("./webHandler");
var escape = require("escape-html");
var bcrypt = require("bcrypt");
const linkifyHtml = require("linkify-html");
const path = require("path");
const fs = require("fs");
const EXPIRY = 1e3 * 60 * 60 * 24;
const DB = import_database.database.collection("SystemAUTH");
const DB2 = import_database.database.collection("SupportMessaging");
const DB3 = import_database.database.collection("BetaUtilities");
function validate(user, pwd, action, access, callback, token = "") {
  if (action != "refresh" && action != "refresh_log" && action != "sendMsg" && action != "bMsg" && action != "checkAccess_A" && action != "checkAccess" && action != "userReq" && action != "acquireTodo" && action != "ROOMLISTING")
    (0, import_misc.systemLog)("Validating as " + user + " with action " + action + " (token " + token + ")");
  if (!token || !token.match("[0-9]+") || (!user || user && action != "CMD" && action != "sendMsg" && !user.match("^[a-zA-Z0-9_]+$")) || (!pwd || action != "CMD" && pwd.length <= 0)) {
    if (action == "add" || action == "login") {
      (0, import_misc.systemLog)("Unknown error");
      callback.end(JSON.stringify("ERROR"));
      return;
    }
  }
  if (action == "ROOMLISTING") {
    callback.end(JSON.stringify(import_initialiser.sysRooms));
  }
  if (action == "bMsg") {
    DB2.insertOne({
      fieldName: "MSG",
      sender: "BetaOS_System",
      data: user,
      room: access,
      permLevel: 3,
      expiry: Date.now() + EXPIRY
    });
    (0, import_server.sendMsgAllRooms)(access, format({ permLevel: 3, data: user, sender: "BetaOS_System" }));
    return;
  }
  if (action == "logout") {
    (0, import_misc.systemLog)("Logging out " + token);
    DB.deleteOne({ fieldName: "TOKEN", token: { $eq: token } });
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }
  let todoMatch = action.match("updateTODO([0-9]+)");
  let todoMatch2 = action.match("completeTODO([0-9]+)");
  if (action == "add" || action == "CMD" || action == "checkAccess" || action == "sendMsg" || action == "refresh" || action == "checkAccess_A" || action == "refresh_log" || action == "userReq" || action == "renick" || action == "delete" || action == "acquireTodo" || todoMatch || todoMatch2 || action == "addTODO" || action == "newRoom") {
    DB.findOne({ fieldName: "TOKEN", token: { $eq: token } }).then(
      (obj) => {
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
        if (action != "refresh" && action != "refresh_log" && action != "sendMsg" && action != "checkAccess_A" && action != "userReq" && action != "checkAccess")
          (0, import_misc.systemLog)("Logged in as " + tokenUser + " | Expiring in: " + (expiryTime - Date.now()) + " ms");
        if (expiryTime < Date.now()) {
          (0, import_misc.systemLog)("Token expired. Logged out user.");
          DB.deleteOne({ fieldName: "TOKEN", token: { $eq: token } });
          if (action == "checkAccess" || action == "checkAccess_A")
            callback.sendFile(path.join(__dirname, "../frontend", "403.html"));
          else
            callback.end(JSON.stringify("EXPIRE"));
          return;
        }
        DB.findOne({ fieldName: "UserData", user: obj.associatedUser }).then(
          (obj2) => {
            if (!obj2) {
              callback.end(JSON.stringify("ERROR"));
              return;
            }
            let perms = obj2.permLevel;
            if (action == "renick" && perms >= 1) {
              if (obj.associatedUser != "betatester1024" && obj.associatedUser != "betaos" && (user.toLowerCase() == "betaos" || user.toLowerCase() == "betatester1024")) {
                callback.end(JSON.stringify("ERROR"));
                return;
              }
              DB.updateOne({ fieldName: "UserData", user: obj.associatedUser }, {
                $set: {
                  alias: user
                },
                $currentDate: { lastModified: true }
              }, { upsert: true });
              callback.end(JSON.stringify(escape(user)));
              return;
            }
            if (action == "acquireTodo" || todoMatch || todoMatch2 || action == "addTODO") {
              if (!obj2.todo)
                obj2.todo = [];
              if (action == "acquireTodo")
                callback.end(JSON.stringify(obj2.todo ? obj2.todo : ""));
              else {
                if (todoMatch) {
                  if (todoMatch[1] < obj2.todo.length)
                    obj2.todo[todoMatch[1]] = user;
                }
                if (todoMatch2) {
                  if (obj2.todo.length > todoMatch2[1])
                    obj2.todo.splice(todoMatch2[1], 1);
                }
                if (action == "addTODO") {
                  obj2.todo.push(user);
                }
                DB.updateOne({ fieldName: "UserData", user: obj.associatedUser }, {
                  $set: {
                    todo: obj2.todo
                  },
                  $currentDate: { lastModified: true }
                }, { upsert: true }).then(() => {
                  callback.end(JSON.stringify("SUCCESS"));
                });
                return;
              }
              return;
            }
            if (action == "userReq") {
              callback.end(JSON.stringify(obj.associatedUser + " " + obj2.permLevel));
              return;
            }
            if (action == "add" || action == "delete") {
              DB.findOne({ fieldName: "UserData", user: { $eq: user } }).then(
                (obj3) => {
                  if (obj3 && obj3.permLevel > perms) {
                    (0, import_misc.systemLog)("Trying to delete a higher-level user");
                    callback.end(JSON.stringify("ACCESS"));
                    return;
                  } else if (action == "delete" && (perms >= 2 || user == obj.associatedUser)) {
                    DB.findOneAndDelete({ fieldName: "UserData", user: { $eq: user } }).then((res) => {
                      callback.end(JSON.stringify(escape(user)));
                    });
                    (0, import_misc.systemLog)("Deleted user " + user);
                    return;
                  } else if (action == "delete") {
                    (0, import_misc.systemLog)("Insufficient access for deletion");
                    callback.end(JSON.stringify("ACCESS"));
                    return;
                  }
                  if (Number(perms) < 2) {
                    if (user == tokenUser && access == "1") {
                      (0, import_misc.systemLog)("Updating password");
                      (0, import_updateuser.updateUser)(user, pwd);
                      callback.end(JSON.stringify("SUCCESS"));
                      let exp = perms < 3 ? Date.now() + 1e3 * 60 * 60 * 24 * 30 : Date.now() + 1e3 * 300;
                      (0, import_misc.systemLog)("Logging user " + user + " with expiry " + exp + " (in " + (exp - Date.now()) + " ms)");
                      DB.updateOne(
                        { fieldName: "TOKEN", token: { $eq: token } },
                        {
                          $set: {
                            associatedUser: user,
                            expiry: exp
                          },
                          $currentDate: { lastModified: true }
                        },
                        { upsert: true }
                      );
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
                }
              );
              return;
            } else if (action == "CMD" && perms == 3) {
              if (user == "!killall") {
                import_wsHandler.WS.killall();
                callback.end(JSON.stringify("SUCCESS"));
                return;
              }
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
              callback.sendFile(path.join(__dirname, "../frontend", "sysLog.html"));
              return;
            } else if (action == "sendMsg" && perms >= 1) {
              const snd = obj2.alias ? obj2.alias : obj.associatedUser;
              DB2.insertOne({
                fieldName: "MSG",
                sender: snd,
                data: user,
                room: access,
                permLevel: perms,
                expiry: Date.now() + EXPIRY
              });
              callback.end(JSON.stringify("SUCCESS"));
              (0, import_server.sendMsgAllRooms)(access, format({ permLevel: perms, data: user, sender: snd }));
              let handler = findHandler("OnlineSUPPORT|" + access);
              if (handler) {
                handler.onMessage(user, snd);
              } else {
                handler = findHandler("HIDDEN|" + access);
                if (handler) {
                  handler.onMessage(user, snd);
                } else
                  console.log("ROOMINVALID");
              }
              return;
            } else if (action == "refresh" && perms >= 1) {
              DB2.find({ fieldName: "MSG", room: { $eq: access } }).toArray().then((objs) => {
                let out = "";
                for (let i = 0; i < objs.length; i++) {
                  out += format(objs[i]);
                }
                callback.end(JSON.stringify(out));
              });
              DB2.find({ fieldName: "MSG", room: { $eq: access } }).toArray().then((objs) => {
                let out = "";
                for (let i = 0; i < objs.length; i++) {
                  out += format(objs[i]);
                }
                callback.end(JSON.stringify(out));
              });
              return;
            } else if (action == "refresh_log" && perms >= 2) {
              DB3.findOne({ fieldName: "SYSTEMLOG" }).then((obj3) => {
                callback.end(JSON.stringify(obj3.data.replaceAll("\n", "<br>")));
              });
              return;
            } else if (action == "refresh_log" || action == "refresh" || action == "checkAccess_A") {
              callback.sendFile(path.join(__dirname, "../frontend", "403.html"));
              return;
            } else if (action == "newRoom" && perms >= 2) {
              if (user.match("^[0-9a-zA-Z_\\-]{1,20}$")) {
                DB3.findOne({ fieldName: "ROOMS" }).then((obj4) => {
                  if (obj4.rooms.indexOf(user) < 0 && obj4.hidRooms.indexOf(user) < 0) {
                    obj4.rooms.push(user);
                    import_initialiser.webHandlers.push(new import_webHandler.WebH(user));
                    DB3.updateOne({ fieldName: "ROOMS" }, {
                      $set: {
                        rooms: obj4.rooms
                      },
                      $currentDate: { lastModified: true }
                    }, { upsert: true }).then(() => {
                      callback.end(JSON.stringify("SUCCESS"));
                    });
                  } else
                    callback.end(JSON.stringify("ERROR"));
                });
              } else
                callback.end(JSON.stringify("ERROR"));
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
        (0, import_misc.systemLog)("Registered user " + user + "with pass: [REDACTED]");
        (0, import_updateuser.updateUser)(user, pwd, 1);
        let exp = Date.now() + 1e3 * 60 * 60 * 24 * 30;
        (0, import_misc.systemLog)("Logging user " + user + " with expiry " + exp + " (in " + (exp - Date.now()) + " ms)");
        DB.updateOne(
          { fieldName: "TOKEN", token: { $eq: token } },
          {
            $set: {
              associatedUser: user,
              expiry: exp
            },
            $currentDate: { lastModified: true }
          },
          { upsert: true }
        );
        callback.end(JSON.stringify("SUCCESS"));
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
        let exp = perm < 3 ? Date.now() + 1e3 * 60 * 60 * 24 * 30 : Date.now() + 1e3 * 300;
        (0, import_misc.systemLog)("Logging user " + user + " with expiry " + exp + " (in " + (exp - Date.now()) + " ms)");
        DB.updateOne(
          { fieldName: "TOKEN", token: { $eq: token } },
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
  DB3.find({ fieldName: "TIMER" }).toArray().then(
    (objs) => {
      for (let i = 0; i < objs.length; i++) {
        if (Date.now() > objs[i].expiry || objs[i].expiry == null) {
          DB3.deleteOne({ fieldName: "TIMER", expiry: objs[i].expiry });
          import_wsHandler.WS.notifRoom.socket.send(import_wsHandler.WS.toSendInfo("!tell @" + objs[i].notifyingUser + " You are reminded of: " + objs[i].msg.replaceAll(/\\/gm, "\\\\").replaceAll(/"/gm, '\\"')));
        }
      }
    }
  );
}
function format(obj3) {
  let cls_n = "", extraText = "";
  switch (obj3.permLevel) {
    case 2:
      cls_n = "admin";
      extraText = " [ADMIN]";
      break;
    case 3:
      cls_n = "beta";
      extraText = " [SYSTEM]";
      break;
  }
  let data = obj3.data;
  data = data.replaceAll("&", "&amp;");
  data = data.replaceAll(">", "&gt;");
  data = data.replaceAll("<", "&lt;");
  data = data.replaceAll("\\n", "<br>");
  data = data.replaceAll(/\&amp;([0-9a-zA-Z]+)/gm, (match, p1) => {
    return "<a href='https://euphoria.io/room/" + p1 + "'>" + match + "</a>";
  });
  data = data.replaceAll(/#([0-9a-zA-Z_\-]{1,20})/gm, (match, p1) => {
    return "<a href='/support?room=" + p1 + "'>" + match + "</a>";
  });
  data = data.replaceAll(
    /.+\.(jpg|jpeg|png|gif|mp4)(\?.*)?$/gm,
    (match, p1) => {
      return `<img onclick='window.open("` + match + `")'src='` + match + "'></img>";
    }
  );
  data = linkifyHtml(data, {
    target: {
      url: "_blank"
    }
  });
  for (let i = 0; i < import_replacements.replacements.length; i++) {
    data = data.replaceAll(import_replacements.replacements[i].from, "<span class='material-symbols-outlined'>" + import_replacements.replacements[i].to + "</span>");
  }
  let cls_w = "";
  let slashMe = false;
  if (data.match("^/me")) {
    slashMe = true;
    cls_w += " slashMe";
    data = data.replace("/me", "");
  }
  cls_w += " " + cls_n;
  return `<p class="${cls_w}""><b class='${cls_n}'>${obj3.sender}${extraText}${slashMe ? "" : ":"}</b> ${data} </p><br>`;
}
function findHandler(name) {
  for (let i = 0; i < import_initialiser.webHandlers.length; i++) {
    if (import_initialiser.webHandlers[i].roomName == name)
      return import_initialiser.webHandlers[i];
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DBGarbageCollect,
  validate
});
//# sourceMappingURL=accessControl.js.map
