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
  userRequest: () => userRequest
});
module.exports = __toCommonJS(userRequest_exports);
var import_consts = require("./consts");
const argon2 = require("argon2");
async function userRequest(token) {
  let tokenData = await import_consts.K.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    return { status: "ERROR", data: { error: "Your session could not be found!" }, token: "" };
  }
  let userData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (Date.now() > tokenData.expiry) {
    return { status: "ERROR", data: { error: "Your session has expired!" }, token: "" };
  }
  return { status: "SUCCESS", data: { user: tokenData.associatedUser, alias: userData.alias ?? userData.user, perms: userData.permLevel, expiry: tokenData.expiry }, token };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  userRequest
});
//# sourceMappingURL=userRequest.js.map
