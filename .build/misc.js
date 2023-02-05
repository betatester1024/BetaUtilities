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
var misc_exports = {};
__export(misc_exports, {
  getUptimeStr: () => getUptimeStr
});
module.exports = __toCommonJS(misc_exports);
function getUptimeStr(STARTTIME) {
  let timeElapsed = Date.now() - STARTTIME;
  let date = new Date(Date.now());
  return `/me has been up since ${date.getFullYear()}-${format(date.getMonth() + 1)}-${format(date.getDate())} (It's been ${formatTime(timeElapsed)})`;
}
function formatTime(ms) {
  let seconds = ms / 1e3;
  const days = Math.floor(seconds / 3600 / 24) + 1;
  seconds = seconds % (3600 * 24);
  const hours = Math.floor(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds);
  seconds = seconds % 60;
  return days + " day" + (days == 1 ? "" : "s") + ", " + hours + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}
function format(n) {
  return n < 10 ? "0" + n : n;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getUptimeStr
});
//# sourceMappingURL=misc.js.map
