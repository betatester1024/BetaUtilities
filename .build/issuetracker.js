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
var issuetracker_exports = {};
__export(issuetracker_exports, {
  loadIssues: () => loadIssues,
  newIssue: () => newIssue
});
module.exports = __toCommonJS(issuetracker_exports);
var import_consts = require("./consts");
var import_userRequest = require("./userRequest");
async function newIssue(title, body, token, sessID) {
  console.log(sessID);
  let data = await import_consts.issueDB.findOne({ fieldName: "MetaData" });
  let req = await (0, import_userRequest.userRequest)(token);
  let auth = "Anonymous user " + sessID.slice(0, 7);
  if (req.status == "SUCCESS")
    auth = req.data.user;
  await import_consts.issueDB.insertOne({ fieldName: "Issue", id: data ? data.issueCt + 1 : 1, title, body, author: auth });
  if (data)
    await import_consts.issueDB.updateOne({ fieldName: "MetaData" }, {
      $inc: { issueCt: 1 }
    });
  else
    await import_consts.issueDB.insertOne({ fieldName: "MetaData", issueCt: 1 });
  return { status: "SUCCESS", data: { id: data.issueCt + 1 }, token };
}
async function loadIssues(from, to, token) {
  let out = await import_consts.issueDB.find({ fieldName: "Issue", id: { $gte: from, $lte: to } }).toArray();
  return { status: "SUCCESS", data: out, token };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loadIssues,
  newIssue
});
//# sourceMappingURL=issuetracker.js.map
