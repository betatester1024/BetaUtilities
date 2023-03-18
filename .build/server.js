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
var server_exports = {};
__export(server_exports, {
  initServer: () => initServer
});
module.exports = __toCommonJS(server_exports);
const express = require("express");
const app = express();
const port = 3e3;
const rootDir = "/home/runner/BetaUtilitiesV2/";
const frontendDir = "/home/runner/BetaUtilitiesV2/frontend/";
const jsDir = "/home/runner/BetaUtilitiesV2/.build/frontend/";
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
var RateLimit = require("express-rate-limit");
function initServer() {
  var limiter = RateLimit({
    windowMs: 10 * 1e3,
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429
  });
  app.use(limiter);
  app.get("/", (req, res) => {
    res.sendFile(rootDir + "/frontend/index.html");
  });
  app.get("/*.js", (req, res) => {
    res.sendFile(jsDir + req.url);
  });
  app.post("/server", urlencodedParser, (req, res) => {
    if (!req.body)
      res.end(JSON.stringify({ status: "ERROR", data: null }));
    makeRequest(req.body.action, req.body.token, req.body.data, (s, d) => {
      res.end(JSON.stringify({ status: s, data: d }));
    });
  });
  app.listen(port, () => {
    console.log(`BetaUtilities V2 listening on port ${port}`);
  });
}
function makeRequest(action, token, data, callback) {
  switch (action) {
    case "test":
      callback("SUCCESS", { abc: "def", def: 5 });
      break;
    default:
      callback("ERROR", null);
  }
  return;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initServer
});
//# sourceMappingURL=server.js.map
