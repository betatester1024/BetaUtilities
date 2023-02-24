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
  validate: () => validate
});
module.exports = __toCommonJS(accessControl_exports);
var import_wsHandler = require("./wsHandler");
var import_misc = require("./misc");
var bcrypt = require("bcrypt");
const path = require("path");
function validate(user, pwd, action, access, callback, token = "") {
  (0, import_misc.systemLog)("Validating as " + user + " with action " + action + " (token " + token + ")");
  if (!token || !token.match("[0-9]+") || (!user || user && action != "CMD" && !user.match("[a-zA-Z0-9_]+")) || (!pwd || action != "CMD" && pwd.length <= 0)) {
    if (action != "checkAccess" && action != "logout") {
      (0, import_misc.systemLog)("Unknown error");
      callback.end(JSON.stringify("ERROR"));
      return;
    }
  }
  if (action == "logout") {
    (0, import_misc.systemLog)("Logging out " + token);
    import_wsHandler.WS.db.delete(token);
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }
  if (action == "add" || action == "CMD" || action == "checkAccess") {
    import_wsHandler.WS.db.get("T=" + token).then((data) => {
      if (data == null) {
        (0, import_misc.systemLog)("No active session");
        if (action == "checkAccess")
          callback.sendFile(path.join(__dirname, "../frontend", "403.html"));
        else
          callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = Number(data.split(" ")[1]);
      let tokenUser = data.split(" ")[0];
      (0, import_misc.systemLog)("Logged in as " + tokenUser + " | Expiring in: " + (expiryTime - Date.now()) + " ms");
      if (expiryTime < Date.now()) {
        (0, import_misc.systemLog)("Token expired. Logged out user.");
        import_wsHandler.WS.db.delete("T=" + token);
        if (action == "checkAccess")
          callback.sendFile(path.join(__dirname, "../frontend", "403.html"));
        else
          callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      import_wsHandler.WS.db.get(tokenUser + "^PERM").then((perms) => {
        if (action == "add") {
          if (Number(perms) < 2) {
            if (user == tokenUser && access == "1") {
              (0, import_misc.systemLog)("Updating password");
              import_wsHandler.WS.db.set(user, bcrypt.hashSync(pwd, 8));
              callback.end(JSON.stringify("SUCCESS"));
            }
            (0, import_misc.systemLog)("Permissions insufficient.");
            callback.end(JSON.stringify("ACCESS"));
          } else if (Number(access) < 3) {
            (0, import_misc.systemLog)("Access granted; Token not expired. Adding " + user + " with permissions" + access);
            import_wsHandler.WS.db.set(user, bcrypt.hashSync(pwd, 8));
            import_wsHandler.WS.db.set(user + "^PERM", access);
            callback.end(JSON.stringify("SUCCESS"));
          } else {
            (0, import_misc.systemLog)("Invalid access-level granting:");
            callback.end(JSON.stringify("ACCESS"));
          }
        } else if (action == "CMD" && perms == "3") {
          var DB = import_wsHandler.WS.db;
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
        } else {
          (0, import_misc.systemLog)("No perms!");
          callback.end(JSON.stringify("ACCESS"));
        }
      });
    });
    return;
  }
  if (action == "signup") {
    import_wsHandler.WS.db.list().then((keys) => {
      if (keys.indexOf(user) >= 0) {
        (0, import_misc.systemLog)(user + " was already registered");
        callback.end(JSON.stringify("TAKEN"));
      } else {
        (0, import_misc.systemLog)("Registered user " + user);
        import_wsHandler.WS.db.set(user, bcrypt.hashSync(pwd, 8));
        import_wsHandler.WS.db.set(user + "^PERM", "1");
        callback.end(JSON.stringify("SUCCESS"));
      }
    });
    return;
  }
  import_wsHandler.WS.db.get(user).then((value) => {
    if (value && bcrypt.compareSync(pwd, value)) {
      import_wsHandler.WS.db.get(user + "^PERM").then((perm) => {
        (0, import_misc.systemLog)("Password OK for user " + user + " | Perms: " + perm);
        callback.end(JSON.stringify(perm));
        let exp = perm < 3 ? Date.now() + 1e3 * 60 * 60 : Date.now() + 1e3 * 60;
        (0, import_misc.systemLog)("Logging user " + user + " with expiry " + exp + " (in " + (exp - Date.now()) + " ms)");
        import_wsHandler.WS.db.set("T=" + token, user + " " + exp);
      });
    } else {
      (0, import_misc.systemLog)("Invalid credentials.");
      let response = 0;
      callback.end(JSON.stringify(response));
    }
    ;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validate
});
//# sourceMappingURL=accessControl.js.map
