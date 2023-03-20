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
  K: () => K
});
module.exports = __toCommonJS(consts_exports);
var import_database = require("./database");
const argon2 = require("argon2");
const K = {
  rootDir: "/home/runner/BetaUtilitiesV2/",
  frontendDir: "/home/runner/BetaUtilitiesV2/frontend/",
  jsDir: "/home/runner/BetaUtilitiesV2/.build/frontend/",
  port: 3e3,
  userRegex: /^[0-9a-zA-Z_\\-]+$/,
  pwdMaxLength: 9e99,
  userMaxLength: 9e99,
  authDB: import_database.database.collection("SystemAUTH_V2"),
  msgDB: import_database.database.collection("SupportMessaging"),
  uDB: import_database.database.collection("BetaUtilities"),
  hashingOptions: {
    type: argon2.argon2d,
    memoryCost: 12288,
    timeCost: 3,
    parallelism: 1,
    hashLength: 50
  },
  expiry: [9e99, 1e3 * 60 * 60, 1e3 * 60 * 60 * 24 * 30, 1e3 * 60 * 60]
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  K
});
//# sourceMappingURL=consts.js.map
