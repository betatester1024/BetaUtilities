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
var wordler_exports = {};
__export(wordler_exports, {
  allWords: () => allWords,
  serverUpdate: () => serverUpdate,
  todayLeetCODE: () => todayLeetCODE,
  todayWordID: () => todayWordID,
  validWords: () => validWords
});
module.exports = __toCommonJS(wordler_exports);
const fs = require("fs");
let todayWordID = 0;
let FILEDATA;
let todayLeetCODE = [];
let charSet = "0123456789abcdefghijklmnopqrstuvwxyz";
let allWords = [];
let validWords = [];
fs.readFile("betautilities/wordfile.txt", (err, data) => {
  if (err)
    throw err;
  FILEDATA = data;
  refreshCodes();
});
function refreshCodes() {
  validWords = FILEDATA.toString().split("\n");
  let DATE = new Date(Date.now());
  const str = DATE.getHours() + "/" + DATE.toLocaleDateString();
  todayWordID = Math.abs(hashCode(str)) % validWords.length;
  for (let i = 0; i < 5; i++) {
    todayLeetCODE[i] = charSet[Math.floor(Math.abs(hashCode(str)) % Math.pow(10, 5) / Math.pow(10, i)) % charSet.length];
  }
}
fs.readFile("betautilities/allwords.txt", (err, data) => {
  if (err)
    throw err;
  allWords = data.toString().split("\n");
});
function hashCode(str) {
  var seed = 0;
  let h1 = 3735928559 ^ seed, h2 = 1103547991 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507);
  h1 ^= Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507);
  h2 ^= Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
let STARTTIME = Date.now();
function serverUpdate() {
  setTimeout(serverUpdate, 1e3);
  if (FILEDATA)
    refreshCodes();
  let offsetTime = Date.now() - STARTTIME;
  STARTTIME = Date.now();
  fs.writeFileSync("betautilities/runtime.txt", (Number(fs.readFileSync("betautilities/runtime.txt")) + offsetTime).toString());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  allWords,
  serverUpdate,
  todayLeetCODE,
  todayWordID,
  validWords
});
//# sourceMappingURL=wordler.js.map
