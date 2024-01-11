"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var validateLogin_exports = {};
__export(validateLogin_exports, {
  logout: () => logout,
  signup: () => signup,
  validateLogin: () => validateLogin
});
module.exports = __toCommonJS(validateLogin_exports);
var import_consts = require("./consts");
var import_crypto = __toESM(require("crypto"));
const argon2 = require("argon2");
async function validateLogin(user, pwd, persistQ, token) {
  if (!user.match(import_consts.userRegex)) {
    return { status: "ERROR", data: { error: "Invalid user string!" }, token };
  }
  if (pwd.length == 0) {
    return { status: "ERROR", data: { error: "No password provided!" }, token };
  }
  let usrInfo = await import_consts.authDB.findOne({ fieldName: "UserData", user: { $eq: user } });
  if (!usrInfo) {
    return { status: "ERROR", data: { error: "No such user!" }, token };
  } else if (await argon2.verify(usrInfo.pwd, pwd)) {
    let uuid = import_crypto.default.randomUUID();
    let userData = await import_consts.authDB.findOne({ fieldName: "UserData", user });
    await import_consts.authDB.insertOne({ fieldName: "Token", associatedUser: user, token: uuid, expiry: persistQ ? 9e99 : Date.now() + import_consts.expiry[userData.permLevel] });
    return { status: "SUCCESS", data: { perms: usrInfo.permLevel }, token: uuid };
  } else {
    return { status: "ERROR", data: { error: "Password is invalid!" }, token };
  }
}
async function signup(user, pwd, token) {
  if (!user.match(import_consts.userRegex)) {
    return { status: "ERROR", data: { error: "Invalid user string!" }, token };
  }
  if (pwd.length == 0) {
    return { status: "ERROR", data: { error: "No password provided!" }, token };
  }
  let usrInfo = await import_consts.authDB.findOne({ fieldName: "UserData", user });
  if (usrInfo) {
    return { status: "ERROR", data: { error: "User is registered" }, token };
  } else {
    let hash = await argon2.hash(pwd, import_consts.hashingOptions);
    await import_consts.authDB.insertOne({ fieldName: "UserData", user, pwd: hash, permLevel: 1 });
    return await validateLogin(user, pwd, false, token);
  }
}
async function logout(token, allaccsQ = false) {
  if (allaccsQ) {
    let userData = await import_consts.authDB.findOne({ fieldName: "Token", token });
    if (!userData) {
      await import_consts.authDB.deleteOne({ fieldName: "Token", token });
      return { status: "ERROR", data: { error: "Cannot find your session. Logged you out." }, token };
    }
    await import_consts.authDB.deleteMany({ fieldName: "Token", associatedUser: userData.associatedUser });
  }
  await import_consts.authDB.deleteOne({ fieldName: "Token", token });
  return { status: "SUCCESS", data: null, token: "" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  logout,
  signup,
  validateLogin
});
//# sourceMappingURL=validateLogin.js.map
