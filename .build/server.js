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
var import_consts = require("./consts");
var import_validateLogin = require("./validateLogin");
var import_delacc = require("./delacc");
var import_updateUser = require("./updateUser");
var import_userRequest = require("./userRequest");
var import_EEHandler = require("./EEHandler");
var import_supportRooms = require("./supportRooms");
const express = require("express");
const app = express();
const crypto = require("crypto");
const parse = require("co-body");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
var RateLimit = require("express-rate-limit");
async function initServer() {
  var limiter = RateLimit({
    windowMs: 10 * 1e3,
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429
  });
  app.use(limiter);
  app.use(new cookieParser());
  app.get("/", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/index.html");
    incrRequests();
  });
  app.get("/login", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/login.html");
    incrRequests();
  });
  app.get("/signup", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/signup.html");
    incrRequests();
  });
  app.get("/config", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/config.html");
    incrRequests();
  });
  app.get("/account", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/config.html");
    incrRequests();
  });
  app.get("/admin", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/admin.html");
    incrRequests();
  });
  app.get("/todo", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/todo.html");
    incrRequests();
  });
  app.get("/status", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/status.html");
    incrRequests();
  });
  app.get("/EE", (req, res) => {
    (0, import_EEHandler.EE)(true, (_status, data, _token) => {
      res.set("Content-Type", "text/html");
      res.send(Buffer.from(`<!DOCTYPE html>
<html>
  <head>
    <script src='./utils.js'><\/script>
    <title>Everyone Edits | BetaOS Systems</title>
    <script>
    <\/script>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@100;400;700&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="/globalformat.css">
    <style>
    </style>
  </head>
  <body onload = "globalOnload();">
    <div class="main_content">
    <header>
      <h2>Everybody edits!</h2>
      <hr class="rounded">
    </header>
      ${data.data}
    </div>
    
    <div class="overlay" id="overlay">
      <div class="internal">
        <p class="fsmed" id="alerttext">Hey, some text here</p>
        <button class="btn szTwoThirds" onclick="closeAlert()">
          Continue
          <span class="material-symbols-outlined">arrow_forward_ios</span>
          <div class="anim"></div>
        </button>
      </div>
    </div>
  </body>
</html>`));
    }, "", "");
    incrRequests();
  });
  app.get("/docs", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/docs.html");
    incrRequests();
  });
  app.get("/EEdit", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/EEdit.html");
    incrRequests();
  });
  app.get("/logout", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/logout.html");
    incrRequests();
  });
  app.get("/support", (req, res) => {
    let match = req.url.match("\\?room=(" + import_consts.K.roomRegex + ")");
    if (match) {
      if (!import_supportRooms.supportHandler.checkFoundQ(match[1])) {
        console.log("Room not found");
        res.sendFile(import_consts.K.frontendDir + "/room404.html");
        return;
      } else
        res.sendFile(import_consts.K.frontendDir + "/support.html");
    } else
      res.sendFile(import_consts.K.frontendDir + "/supportIndex.html");
    incrRequests();
  });
  app.get("/accountDel", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/delAcc.html");
    incrRequests();
  });
  app.get("*/favicon.ico", (req, res) => {
    res.sendFile(import_consts.K.rootDir + "/favicon.ico");
    incrRequests();
  });
  app.get("/support.js", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "support.js");
    incrRequests();
  });
  app.get("/*.js*", (req, res) => {
    res.sendFile(import_consts.K.jsDir + req.url);
    incrRequests();
  });
  app.get("/*.ts", (req, res) => {
    res.sendFile(import_consts.K.jsDir + req.url);
    incrRequests();
  });
  app.get("/*.css", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + req.url);
    incrRequests();
  });
  app.get("/stream", (req, res) => {
    res.set({
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive"
    });
    res.flushHeaders();
    res.write("retry:500\n\n");
    import_supportRooms.supportHandler.addConnection(res, req.query.room, req.cookies.sessionID);
    res.on("close", () => {
      import_supportRooms.supportHandler.removeConnection(res, req.query.room, req.cookies.sessionID);
      res.end();
    });
  });
  app.get("/*", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "404.html");
    incrRequests();
  });
  app.post("/server", urlencodedParser, async (req, res) => {
    incrRequests();
    var body = await parse.json(req);
    if (!body)
      res.end(JSON.stringify({ status: "ERROR", data: null }));
    makeRequest(body.action, req.cookies.sessionID, body.data, (s, d, token) => {
      if (body.action != "sendMsg")
        res.cookie("sessionID", token ? token : "", { maxAge: 1e3 * 60 * 60 * 24 * 30, httpOnly: true, secure: true, sameSite: "Strict" });
      res.end(JSON.stringify({ status: s, data: d }));
    });
  });
  app.listen(import_consts.K.port, () => {
    console.log(`BetaUtilities V2 listening on port ${import_consts.K.port}`);
  });
}
async function incrRequests() {
  let ct = await import_consts.K.uDB.findOne({ fieldName: "VISITS" });
  import_consts.K.uDB.updateOne({ fieldName: "VISITS" }, { $set: { visitCt: ct.visitCt + 1 } }, { upsert: true });
}
function makeRequest(action, token, data, callback) {
  switch (action) {
    case "test":
      callback("SUCCESS", { abc: "def", def: 5 }, token);
      break;
    case "login":
      data = data;
      (0, import_validateLogin.validateLogin)(data.user, data.pass, callback, token);
      break;
    case "signup":
      data = data;
      (0, import_validateLogin.signup)(data.user, data.pass, callback, token);
      break;
    case "userRequest":
      (0, import_userRequest.userRequest)(callback, token);
      break;
    case "roomRequest":
      (0, import_supportRooms.roomRequest)(callback, token);
      break;
    case "statusRequest":
      (0, import_supportRooms.roomRequest)(callback, token, true);
    case "getEE":
      (0, import_EEHandler.EE)(true, callback, token, "");
      break;
    case "setEE":
      data = data;
      (0, import_EEHandler.EE)(false, callback, token, data.data);
      break;
    case "updateuser":
      data = data;
      (0, import_updateUser.updateUser)(data.user, data.oldPass, data.pass, data.newPermLevel, callback, token);
      break;
    case "delAcc":
      data = data;
      (0, import_delacc.delAcc)(data.user, data.pass, callback, token);
      break;
    case "logout":
      (0, import_validateLogin.logout)(callback, token);
      break;
    case "logout_all":
      (0, import_validateLogin.logout)(callback, token, true);
      break;
    case "sendMsg":
      data = data;
      (0, import_supportRooms.sendMsg)(data.msg, data.room, callback, token);
    default:
      callback("ERROR", { error: "Unknown command string!" }, token);
  }
  return;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initServer
});
//# sourceMappingURL=server.js.map
