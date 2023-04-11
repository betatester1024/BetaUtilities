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
var consts_exports = {};
__export(consts_exports, {
  authDB: () => authDB,
  expiry: () => expiry,
  frontendDir: () => frontendDir,
  hashingOptions: () => hashingOptions,
  jsDir: () => jsDir,
  msgDB: () => msgDB,
  port: () => port,
  pwdMaxLength: () => pwdMaxLength,
  roomRegex: () => roomRegex,
  rootDir: () => rootDir,
  uDB: () => uDB,
  userMaxLength: () => userMaxLength,
  userRegex: () => userRegex
});
module.exports = __toCommonJS(consts_exports);
var import_database = require("./database");
const argon2 = require("argon2");
const rootDir = "/home/runner/v2/";
const frontendDir = "/home/runner/v2/frontend/";
const jsDir = "/home/runner/v2/.build/frontend/";
const port = 3e3;
const userRegex = /^[0-9a-zA-Z_\\-]{1,20}$/;
const roomRegex = "[0-9a-zA-Z_\\-]{1,20}";
const pwdMaxLength = 9e99;
const userMaxLength = 9e99;
const authDB = import_database.database.collection("SystemAUTH_V2");
const msgDB = import_database.database.collection("SupportMessaging");
const uDB = import_database.database.collection("BetaUtilities");
const hashingOptions = {
  type: argon2.argon2d,
  memoryCost: 12288,
  timeCost: 3,
  parallelism: 1,
  hashLength: 50
};
const expiry = [9e99, 1e3 * 60, 1e3 * 60 * 60 * 24 * 30, 1e3 * 60 * 60];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authDB,
  expiry,
  frontendDir,
  hashingOptions,
  jsDir,
  msgDB,
  port,
  pwdMaxLength,
  roomRegex,
  rootDir,
  uDB,
  userMaxLength,
  userRegex
});
//# sourceMappingURL=consts.js.map
