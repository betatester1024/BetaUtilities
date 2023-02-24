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
  updateServer: () => updateServer
});
module.exports = __toCommonJS(server_exports);
var import_messageHandle = require("./messageHandle");
var import_accessControl = require("./accessControl");
var import_misc = require("./misc");
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const app = express();
const port = 4e3;
function updateServer() {
  (0, import_misc.systemLog)("");
  (0, import_misc.systemLog)("Server active!");
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "index.html"));
  });
  app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "favicon.ico"));
  });
  app.get("/NotoSansDisplay-Variable.ttf", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "NotoSansDisplay-Variable.ttf"));
  });
  app.get("/status/status_raw.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "status_raw.html"));
  });
  app.get("/frontend.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../.build/frontend", "frontend.js"));
  });
  app.get("/login.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../.build/frontend", "login.js"));
  });
  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "login.html"));
  });
  app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "admin.html"));
  });
  app.get("/logout", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "logout.html"));
  });
  app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "signup.html"));
  });
  app.post("/login", urlencodedParser, function(req, res) {
    (0, import_misc.systemLog)("Logging in as " + req.body.action + "+" + req.body.token);
    (0, import_accessControl.validate)(decodeURIComponent(req.body.user), decodeURIComponent(req.body.pass), req.body.action, req.body.access, res, req.body.token);
  });
  app.get("/status", (req, res) => {
    let str = "BetaUtilities is in: ";
    for (let j = 0; j < import_messageHandle.rooms.length - 1; j++) {
      str += ` <a href="https://euphoria.io/room/${import_messageHandle.rooms[j]}">&${import_messageHandle.rooms[j]}</a>,`;
    }
    str += ` ${import_messageHandle.rooms.length > 1 ? "and " : ""}<a href="https://euphoria.io/room/${import_messageHandle.rooms[import_messageHandle.rooms.length - 1]}">&${import_messageHandle.rooms[import_messageHandle.rooms.length - 1]}</a>!  `;
    if (import_messageHandle.rooms.length == 0) {
      str = "ERROR";
    }
    fs.writeFileSync("frontend/status_raw.html", str);
    res.sendFile(path.join(__dirname, "../frontend", "status.html"));
  });
  app.get("/globalformat.css", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "globalformat.css"));
  });
  app.get("/support", (req, res) => {
    (0, import_accessControl.validate)("", "", "checkAccess", "", res, req.query.token);
  });
  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "404.html"));
  });
  app.listen(port, () => {
    (0, import_misc.systemLog)(`Front-end is running on ${port}.`);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateServer
});
//# sourceMappingURL=server.js.map
