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
var bcrypt = require("bcrypt");
function validate(user, pwd, action, access, callback, token = "") {
  console.log("Validating as " + user + " with action " + action + " (token " + token + ")");
  if (action == "logout") {
    console.log("Logging out " + token);
    import_wsHandler.WS.db.delete(token);
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }
  if (action == "add") {
    import_wsHandler.WS.db.get(token).then((data) => {
      if (data == null) {
        console.log("No active session");
        callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = Number(data.split(" ")[1]);
      let tokenUser = data.split(" ")[0];
      console.log("Logged in as " + tokenUser + " | Expiring in: " + (expiryTime - Date.now()) + " ms");
      if (expiryTime < Date.now()) {
        console.log("Token expired. Logged out user.");
        import_wsHandler.WS.db.delete(token);
        callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      import_wsHandler.WS.db.get(tokenUser + "^PERM").then((perms) => {
        if (perms != "2") {
          if (user == tokenUser && access == "1") {
            console.log("Updating password");
            import_wsHandler.WS.db.set(user, bcrypt.hashSync(pwd, 8));
            callback.end(JSON.stringify("SUCCESS"));
          }
          console.log("Permissions insufficient.");
          callback.end(JSON.stringify("ACCESS"));
        } else {
          console.log("Access granted; Token not expired. Adding " + user + " with permissions" + access);
          import_wsHandler.WS.db.set(user, bcrypt.hashSync(pwd, 8));
          import_wsHandler.WS.db.set(user + "^PERM", access);
          callback.end(JSON.stringify("SUCCESS"));
        }
      });
    });
    return;
  }
  import_wsHandler.WS.db.get(user).then((value) => {
    console.log("Logged password hash:" + value);
    if (value && bcrypt.compareSync(pwd, value)) {
      import_wsHandler.WS.db.get(user + "^PERM").then((perm) => {
        console.log("Password OK for user " + user + " | Perms: " + perm);
        callback.end(JSON.stringify(perm));
        let exp = Date.now() + 1e3 * 60 * 60;
        console.log("Logging user " + user + " with expiry " + exp + " (in " + (exp - Date.now()) + " ms)");
        import_wsHandler.WS.db.set(token, user + " " + exp);
      });
    } else {
      console.log("Invalid credentials.");
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
