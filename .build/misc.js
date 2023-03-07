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
  getUptimeStr: () => getUptimeStr,
  systemLog: () => systemLog
});
module.exports = __toCommonJS(misc_exports);
var import_database = require("./database");
const fs = require("fs");
function getUptimeStr(STARTTIME = -1) {
  if (STARTTIME < 0) {
    let time = Number(fs.readFileSync("./runtime.txt"));
    return formatTime(time);
  }
  let timeElapsed = Date.now() - STARTTIME;
  let date = new Date(STARTTIME);
  return `/me has been up since ${date.toUTCString()} (It's been ${formatTime(timeElapsed)})`;
}
function formatTime(ms) {
  let seconds = ms / 1e3;
  const days = Math.floor(seconds / 3600 / 24);
  seconds = seconds % (3600 * 24);
  const hours = Math.floor(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds);
  seconds = seconds % 60;
  return (days == 0 ? "" : days + " day" + (days == 1 ? "" : "s") + ", ") + format(hours) + ":" + format(minutes) + ":" + format(seconds);
}
function format(n) {
  return n < 10 ? "0" + n : n;
}
let actionQueue = [];
function systemLog(thing) {
  actionQueue.push(thing);
  if (actionQueue.length == 1)
    nextEleInQueue();
}
function nextEleInQueue() {
  if (actionQueue.length > 0) {
    console.log("Writing " + actionQueue[0]);
    import_database.DB.findOne({ fieldName: "SYSTEMLOG" }).then((obj) => {
      import_database.DB.updateOne(
        { fieldName: "SYSTEMLOG" },
        {
          $set: {
            data: obj.data + actionQueue[0].toString() + "\n"
          },
          $currentDate: { lastModified: true }
        }
      ).then(() => {
        actionQueue.shift();
        nextEleInQueue();
      });
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getUptimeStr,
  systemLog
});
//# sourceMappingURL=misc.js.map
