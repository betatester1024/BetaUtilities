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
var userRequest_exports = {};
__export(userRequest_exports, {
  extendSession: () => extendSession,
  userListing: () => userListing,
  userRequest: () => userRequest
});
module.exports = __toCommonJS(userRequest_exports);
var import_consts = require("./consts");
const argon2 = require("argon2");
async function userRequest(token, internalFlag = false) {
  if (token == "[SYSINTERNAL]" && internalFlag)
    return { status: "SUCCESS", data: { user: "BetaOS_System", alias: "BetaOS_System", perms: 3, expiry: 9e99, tasks: [], darkQ: false }, token: "SYSINTERNAL" };
  let tokenData = await import_consts.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    return { status: "ERROR", data: { errorCode: 0, error: "Your session could not be found!" }, token: "" };
  }
  let userData = await import_consts.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (Date.now() > tokenData.expiry) {
    return { status: "ERROR", data: { errorCode: 0, error: "Your session has expired!" }, token: "" };
  }
  return { status: "SUCCESS", data: {
    user: tokenData.associatedUser,
    alias: userData.alias ?? userData.user,
    perms: userData.permLevel,
    expiry: tokenData.expiry,
    tasks: userData.tasks,
    darkQ: userData.darkTheme ?? false,
    lastCl: userData.lastClicked,
    branch: process.env.branch,
    domain: process.env.domain,
    unstableDomain: process.env.unstableDomain
  }, token };
}
async function extendSession(token) {
  let tokenData = await import_consts.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    return { status: "ERROR", data: { error: "Your session could not be found!" }, token: "" };
  }
  let userData = await import_consts.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (Date.now() > tokenData.expiry) {
    return { status: "ERROR", data: { error: "Your session has expired!" }, token: "" };
  }
  let newExpiry = import_consts.expiry[userData.permLevel] + Date.now();
  await import_consts.authDB.updateOne({ fieldName: "Token", token }, { $set: { expiry: newExpiry } });
  return { status: "SUCCESS", data: { expiry: newExpiry }, token };
}
async function userListing(token) {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  extendSession,
  userListing,
  userRequest
});
//# sourceMappingURL=userRequest.js.map
