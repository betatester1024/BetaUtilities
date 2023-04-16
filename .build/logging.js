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
var logging_exports = {};
__export(logging_exports, {
  getLogs: () => getLogs,
  incrRequests: () => incrRequests,
  log: () => log,
  purgeLogs: () => purgeLogs,
  systemLog: () => systemLog,
  visitCt: () => visitCt
});
module.exports = __toCommonJS(logging_exports);
var import_consts = require("./consts");
var import_userRequest = require("./userRequest");
var import_index = require("./index");
function systemLog(thing) {
  log(thing.toString());
}
;
function log(thing) {
  if (import_index.connectionSuccess)
    import_consts.uDB.insertOne({ fieldName: "SysLogV2", data: thing + "\n" });
}
async function incrRequests() {
  if (import_index.connectionSuccess)
    import_consts.uDB.updateOne({ fieldName: "VISITS" }, { $inc: { visitCt: 1 } }, { upsert: true });
}
async function visitCt(token) {
  if (import_index.connectionSuccess) {
    let obj = await import_consts.uDB.findOne({ fieldName: "VISITS" });
    return { status: "SUCCESS", data: { data: obj.visitCt }, token };
  } else
    return { status: "ERROR", data: { error: "Service database connection failed" }, token };
}
async function getLogs(token) {
  let userData = await (0, import_userRequest.userRequest)(token);
  if (userData.status != "SUCCESS" || userData.data.perms < 2) {
    return { status: "ERROR", data: { error: userData.data.error ?? "Insufficient permissions" }, token: userData.token };
  }
  let out = "";
  let logs = await import_consts.uDB.find({ fieldName: "SysLogV2" }).toArray();
  for (let i = 0; i < logs.length; i++) {
    out += logs[i].data;
  }
  return { status: "SUCCESS", data: out, token };
}
async function purgeLogs(token) {
  let userData = await (0, import_userRequest.userRequest)(token);
  if (userData.status != "SUCCESS" || userData.data.perms < 2) {
    return { status: "ERROR", data: { error: userData.data.error ?? "Insufficient permissions" }, token: userData.token };
  }
  await import_consts.uDB.deleteMany({ fieldName: "SysLogV2" });
  return { status: "SUCCESS", data: null, token };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getLogs,
  incrRequests,
  log,
  purgeLogs,
  systemLog,
  visitCt
});
//# sourceMappingURL=logging.js.map
