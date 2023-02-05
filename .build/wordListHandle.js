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
var wordListHandle_exports = {};
__export(wordListHandle_exports, {
  allWords: () => allWords,
  loopy: () => loopy,
  todayLeetCODE: () => todayLeetCODE,
  todayWordID: () => todayWordID,
  validWords: () => validWords
});
module.exports = __toCommonJS(wordListHandle_exports);
const fs = require("fs");
let todayWordID = 0;
let FILEDATA;
let todayLeetCODE = [];
let charSet = "0123456789abcdefghijklmnopqrstuvwxyz";
let allWords = [];
let validWords = [];
fs.readFile("wordfile.txt", (err, data) => {
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
fs.readFile("allwords.txt", (err, data) => {
  if (err)
    throw err;
  allWords = data.toString().split("\n");
});
function hashCode(s) {
  var hash = 0, i, chr;
  if (s.length === 0)
    return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}
function loopy() {
  setTimeout(loopy, 1e4);
  if (FILEDATA)
    refreshCodes();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  allWords,
  loopy,
  todayLeetCODE,
  todayWordID,
  validWords
});
//# sourceMappingURL=wordListHandle.js.map
