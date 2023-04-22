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
  deleteAccount: () => deleteAccount
});
module.exports = __toCommonJS(delacc_exports);
var import_consts = require("./consts");
const argon2 = require("argon2");
async function deleteAccount(user, pass, token) {
  let tokenData = await import_consts.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    return { status: "ERROR", data: { error: "Cannot update user information: Your session could not be found!" }, token: "" };
  }
  if (!user.match(import_consts.userRegex)) {
    return { status: "ERROR", data: { error: "Invalid user string!" }, token };
  }
  let usrInfo = await import_consts.authDB.findOne({ fieldName: "UserData", user: { $eq: user } });
  if (!usrInfo) {
    return { status: "ERROR", data: { error: "No such user!" }, token };
  }
  let loginInfo = await import_consts.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (loginInfo.permLevel > usrInfo.permLevel) {
    await import_consts.authDB.deleteMany({ fieldName: "Token", associatedUser: user });
    await import_consts.authDB.deleteOne({ fieldName: "UserData", user });
    return { status: "SUCCESS", data: null, token };
  }
  if (pass.length == 0) {
    return { status: "ERROR", data: { error: "No password provided!" }, token };
  } else if (await argon2.verify(usrInfo.pwd, pass)) {
    await import_consts.authDB.deleteOne({ fieldName: "Token", token: { $eq: token } });
    await import_consts.authDB.deleteOne({ fieldName: "UserData", user });
    return { status: "SUCCESS", data: null, token: "" };
  } else {
    return { status: "ERROR", data: { error: "Cannot delete account-- Access denied" }, token };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deleteAccount
});
//# sourceMappingURL=delacc.js.map
