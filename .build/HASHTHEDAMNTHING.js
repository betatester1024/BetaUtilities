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
var HASHTHEDAMNTHING_exports = {};
__export(HASHTHEDAMNTHING_exports, {
  requestHash: () => requestHash
});
module.exports = __toCommonJS(HASHTHEDAMNTHING_exports);
const bcrypt = require("bcrypt");
const saltRounds = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";
const db = require("@replit/database");
function requestHash(user, pwd, callback) {
  bcrypt.hash(pwd, saltRounds, function(err, hash) {
    const db2 = require("@replit/database");
    console.log(err, hash);
    db2.set("hashed", hash).then(() => {
    });
    returnedHash(user, hash, callback);
  });
}
function returnedHash(user, hash, callback) {
  db.get(user).then((value) => {
    if (value == hash)
      db.get(user + "PERM").then((perm) => {
        let response = {
          granted: perm
        };
        callback.end(JSON.stringify(response));
      });
    else {
      let response = { granted: null };
      callback.end(JSON.stringify(response));
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  requestHash
});
//# sourceMappingURL=HASHTHEDAMNTHING.js.map
