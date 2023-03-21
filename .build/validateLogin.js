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
var validateLogin_exports = {};
__export(validateLogin_exports, {
  logout: () => logout,
  signup: () => signup,
  validateLogin: () => validateLogin
});
module.exports = __toCommonJS(validateLogin_exports);
var import_consts = require("./consts");
const argon2 = require("argon2");
const crypto = require("crypto");
async function validateLogin(user, pwd, callback, token) {
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token);
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token);
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: { $eq: user } });
  if (!usrInfo) {
    callback("ERROR", { error: "No such user!" }, token);
    return;
  } else if (await argon2.verify(usrInfo.pwd, pwd)) {
    let uuid = crypto.randomUUID();
    let userData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user });
    await import_consts.K.authDB.insertOne({ fieldName: "Token", associatedUser: user, token: uuid, expiry: Date.now() + import_consts.K.expiry[userData.permLevel] });
    callback("SUCCESS", { perms: usrInfo.permLevel }, uuid);
    return;
  } else {
    callback("ERROR", { error: "Password is invalid!" }, token);
    return;
  }
}
async function signup(user, pwd, callback, token) {
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token);
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token);
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user });
  if (usrInfo) {
    callback("ERROR", { error: "User is registered" }, token);
    return;
  } else {
    let hash = await argon2.hash(pwd, import_consts.K.hashingOptions);
    await import_consts.K.authDB.insertOne({ fieldName: "UserData", user, pwd: hash, permLevel: 1 });
    validateLogin(user, pwd, callback, token);
    return;
  }
}
async function logout(callback, token, allaccsQ = false) {
  if (allaccsQ) {
    let userData = await import_consts.K.authDB.findOne({ fieldName: "Token", token });
    if (!userData) {
      await import_consts.K.authDB.deleteOne({ fieldName: "Token", token });
      callback("ERROR", { error: "Cannot find your session. Logged you out." });
      return;
    }
    await import_consts.K.authDB.deleteMany({ fieldName: "Token", associatedUser: userData.associatedUser });
  }
  await import_consts.K.authDB.deleteOne({ fieldName: "Token", token });
  callback("SUCCESS", null, "");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  logout,
  signup,
  validateLogin
});
//# sourceMappingURL=validateLogin.js.map
