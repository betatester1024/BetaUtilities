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
var updateUser_exports = {};
__export(updateUser_exports, {
  updateUser: () => updateUser
});
module.exports = __toCommonJS(updateUser_exports);
var import_consts = require("./consts");
const argon2 = require("argon2");
async function updateUser(user, oldPass, newPass, newPermLevel, token) {
  if (!user.match(import_consts.K.userRegex)) {
    return { status: "ERROR", data: { error: "Invalid user string!" }, token };
  }
  if (newPass.length == 0) {
    return { status: "ERROR", data: { error: "No password provided!" }, token };
  }
  let tokenData = await import_consts.K.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    return { status: "ERROR", data: { error: "Cannot update user information: Your session could not be found!" }, token: "" };
  }
  let userData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (Date.now() > tokenData.expiry) {
    return { status: "ERROR", data: { error: "Cannot update user information: Your session has expired!" }, token: "" };
  }
  let newUserData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user });
  if (userData.permLevel >= 2 && (!newUserData || newUserData.permLevel < userData.permLevel) && newPermLevel < userData.permLevel) {
    await import_consts.K.authDB.updateOne(
      { fieldName: "UserData", user },
      { $set: { pwd: await argon2.hash(newPass, import_consts.K.hashingOptions), permLevel: newPermLevel } },
      { upsert: true }
    );
    return { status: "SUCCESS", data: { perms: newPermLevel }, token };
  } else if (await argon2.verify(userData.pwd, oldPass)) {
    await import_consts.K.authDB.updateOne(
      { fieldName: "UserData", user: tokenData.associatedUser },
      { $set: { pwd: await argon2.hash(newPass, import_consts.K.hashingOptions) } }
    );
    return { status: "SUCCESS", data: { perms: userData.permLevel }, token };
  } else {
    return { status: "ERROR", data: { error: "Cannot update user information: Access denied!" }, token };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateUser
});
//# sourceMappingURL=updateUser.js.map
