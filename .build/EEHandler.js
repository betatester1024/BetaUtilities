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
var EEHandler_exports = {};
__export(EEHandler_exports, {
  EE: () => EE
});
module.exports = __toCommonJS(EEHandler_exports);
var import_consts = require("./consts");
async function EE(getQ, token, newStr = "") {
  let obj = await import_consts.uDB.findOne({ fieldName: "EE" });
  if (getQ)
    return { status: "SUCCESS", data: { data: obj ? obj.data : "" }, token };
  else {
    await import_consts.uDB.updateOne({ fieldName: "EE" }, {
      $set: { data: newStr }
    }, { upsert: true });
    return { status: "SUCCESS", data: null, token };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EE
});
//# sourceMappingURL=EEHandler.js.map
