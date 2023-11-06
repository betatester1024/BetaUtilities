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
var button_exports = {};
__export(button_exports, {
  clickIt: () => clickIt,
  getLeaderboard: () => getLeaderboard
});
module.exports = __toCommonJS(button_exports);
var import_userRequest = require("./userRequest");
var import_consts = require("./consts");
async function clickIt(token) {
  let userData = await (0, import_userRequest.userRequest)(token);
  if (userData.status != "SUCCESS") {
    return userData;
  }
  if (userData.data.lastCl > Date.now() - 1e4)
    return { status: "ERROR", data: { error: "Clicked too much" }, token };
  await import_consts.uDB.updateOne({ fieldName: "BUTTON", user: userData.data.user }, { $inc: { clickedCt: 1 } }, { upsert: true });
  await import_consts.authDB.updateOne({ fieldName: "UserData", user: userData.data.user }, { $set: { lastClicked: Date.now() } }, { upsert: true });
  return { status: "SUCCESS", data: null, token };
}
async function getLeaderboard(token) {
  let data = await import_consts.uDB.findOne({ fieldName: "BUTTON" });
  let allClickingUsers = await import_consts.uDB.find({ fieldName: "BUTTON" }).sort({ clickedCt: -1 }).toArray();
  return { status: "SUCCESS", data: allClickingUsers, token };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clickIt,
  getLeaderboard
});
//# sourceMappingURL=button.js.map
