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
var delacc_exports = {};
__export(delacc_exports, {
  delAcc: () => delAcc
});
module.exports = __toCommonJS(delacc_exports);
var import_consts = require("./consts");
const argon2 = require("argon2");
async function delAcc(user, pass, callback, token) {
  let tokenData = await import_consts.K.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    callback("ERROR", { error: "Cannot update user information: Your session could not be found!" }, "");
    return;
  }
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token);
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: { $eq: user } });
  if (!usrInfo) {
    callback("ERROR", { error: "No such user!" }, token);
    return;
  }
  let loginInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (loginInfo.permLevel >= 2) {
    await import_consts.K.authDB.deleteOne({ fieldName: "Token", token });
    await import_consts.K.authDB.deleteOne({ fieldName: "UserData", user });
    callback("SUCCESS", null, token);
    return;
  }
  if (pass.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token);
    return;
  } else if (await argon2.verify(usrInfo.pwd, pass)) {
    await import_consts.K.authDB.deleteOne({ fieldName: "Token", token });
    await import_consts.K.authDB.deleteOne({ fieldName: "UserData", user });
    callback("SUCCESS", null, "");
    return;
  } else {
    callback("ERROR", { error: "Cannot delete account. Password is invalid!" }, token);
    return;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  delAcc
});
//# sourceMappingURL=delacc.js.map
