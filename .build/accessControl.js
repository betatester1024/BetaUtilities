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
function validate(user, pwd, action, access, callback, token = "") {
  console.log("Validating as " + user + " with password " + pwd + " with action" + action + " - token " + token);
  if (action == "logout") {
    console.log("Logging out " + token);
    import_wsHandler.WS.db.delete(token);
    callback.end(JSON.stringify(0));
    return;
  }
  if (action == "add") {
    console.log(token);
    import_wsHandler.WS.db.get(token).then((data) => {
      console.log("Data: " + data);
      if (data == null) {
        console.log("No active session");
        callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = Number(data.match("[0-9]+$")[0]);
      console.log("This token expiring in: " + (expiryTime - Date.now()) + " ms");
      if (expiryTime < Date.now()) {
        console.log("Token expired.");
        import_wsHandler.WS.db.delete(token);
        callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      import_wsHandler.WS.db.get(data.split(" ")[0] + "^PERM").then((perms) => {
        if (perms != "2") {
          console.log("Permissions insufficient.");
          callback.end(JSON.stringify("ACCESS"));
        } else {
          console.log("Access granted; Token not expired. Adding " + user + " with permissions" + access);
          import_wsHandler.WS.db.set(user, pwd);
          import_wsHandler.WS.db.set(user + "^PERM", access);
          let response = 0;
          callback.end(JSON.stringify(response));
        }
      });
    });
    return;
  }
  import_wsHandler.WS.db.get(user).then((value) => {
    if (value == pwd) {
      console.log("Password OK");
      import_wsHandler.WS.db.get(user + "^PERM").then((perm) => {
        console.log(perm);
        callback.end(JSON.stringify(perm));
      });
    } else {
      if (action == "login") {
        let response = 0;
        callback.end(JSON.stringify(response));
      }
    }
    ;
    let exp = Date.now() + 1e3 * 30;
    console.log("Logging token with user " + user + " with expiry" + exp + " Current time:" + Date.now());
    import_wsHandler.WS.db.set(token, user + " " + exp);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validate
});
//# sourceMappingURL=accessControl.js.map
