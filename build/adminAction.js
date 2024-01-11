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
var adminAction_exports = {};
__export(adminAction_exports, {
  adminAction: () => adminAction
});
module.exports = __toCommonJS(adminAction_exports);
var import_consts = require("./consts");
var import_userRequest = require("./userRequest");
async function adminAction(action, options, token) {
  let usrInfo = await (0, import_userRequest.userRequest)(token);
  if (usrInfo.status != "SUCCESS")
    return usrInfo;
  if (usrInfo.data.perms < 2)
    return { status: "ERROR", data: { error: "No admin permissions" }, token };
  switch (action) {
    case "suspendPage":
      await import_consts.uDB.updateOne(
        { fieldName: "suspendedPages", page: options.page },
        { $set: { suspended: options.suspendedQ } },
        { upsert: true }
      );
      return { status: "SUCCESS", data: null, token };
    default:
      return { status: "ERROR", data: { error: "No such command!" }, token };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminAction
});
//# sourceMappingURL=adminAction.js.map
