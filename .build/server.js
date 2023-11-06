"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var server_exports = {};
__export(server_exports, {
  initServer: () => initServer
});
module.exports = __toCommonJS(server_exports);
var import_handlebars = __toESM(require("handlebars"));
var import_index = require("./index");
var import_consts = require("./consts");
var import_validateLogin = require("./validateLogin");
var import_delacc = require("./delacc");
var import_updateUser = require("./updateUser");
var import_userRequest = require("./userRequest");
var import_EEHandler = require("./EEHandler");
var import_paste = require("./paste");
var import_tasks = require("./tasks");
var import_logging = require("./logging");
var import_button = require("./button");
var import_issuetracker = require("./issuetracker");
var import_messageHandle = require("./betautilities/messageHandle");
var import_supportRooms = require("./supportRooms");
var import_adminAction = require("./adminAction");
const express = require("express");
const enableWs = require("express-ws");
const app = express();
const crypto = require("crypto");
const parse = require("co-body");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
var RateLimit = require("express-rate-limit");
async function getMainClass(token) {
  let res = await (0, import_userRequest.userRequest)(token);
  if (res.status != "SUCCESS")
    return "";
  else
    return res.data.darkQ ? "dark" : "";
}
function getToken(req) {
  return req.cookies.accountID;
}
async function sendFile(res, token, filePath) {
  console.log(filePath.replace(/(^(.+)\/|\.html)/g, ""));
  let suspensionFile = await import_consts.uDB.findOne({
    fieldName: "suspendedPages",
    page: filePath.replaceAll(/(^(.+)\/|\.html)/g, "")
  });
  let user = await (0, import_userRequest.userRequest)(token);
  if (user.status != "SUCCESS")
    user = { data: { perms: 0 } };
  if (suspensionFile && suspensionFile.suspended && user.data.perms < 2) {
    res.sendFile(import_consts.frontendDir + "/403.html");
    return;
  }
  if (!filePath.match(/\.html$/)) {
    res.sendFile(filePath);
    return;
  } else {
    fs.readFile(filePath, "utf8", async (err, fileContents) => {
      if (err) {
        console.error(err);
        return;
      }
      const template = import_handlebars.default.compile(fileContents);
      res.set("Content-Type", "text/html");
      res.send(Buffer.from(template({ mainClass: await getMainClass(token) })));
    });
  }
}
async function initServer() {
  enableWs(app);
  var limiter = RateLimit({
    windowMs: 10 * 1e3,
    max: 50,
    message: tooManyRequests(),
    statusCode: 429
  });
  app.use(limiter);
  let corsOptions = {
    credentials: true,
    origin: true
  };
  app.use(cors(corsOptions));
  app.use(new cookieParser());
  app.get("/", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "/index.html");
    (0, import_logging.incrRequests)();
  });
  app.get("/register", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "/signup.html");
    (0, import_logging.incrRequests)();
  });
  app.get("/account", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "/config.html");
    (0, import_logging.incrRequests)();
  });
  app.get("/EE", (req, res) => {
    (0, import_EEHandler.EE)(true, (_status, data, _token) => {
      res.set("Content-Type", "text/html");
      res.send(Buffer.from(eeFormat(data.data)));
    }, "", "");
    (0, import_logging.incrRequests)();
  });
  app.ws("/", (ws, req) => {
    ws.on("message", (msg) => {
      ws.send("reply:" + msg);
    });
    console.log("WebSocket was opened");
    ws.send(JSON.stringify({ action: "OPEN", data: null }));
    import_supportRooms.supportHandler.addConnection(ws, req.query.room, req.cookies.accountID);
    ws.on("close", () => {
      import_supportRooms.supportHandler.removeConnection(ws, req.query.room, req.cookies.accountID);
      console.log("Removed stream");
    });
  });
  app.get("/support", (req, res) => {
    let match = req.url.match("\\?room=(" + import_consts.roomRegex + ")");
    if (match) {
      if (!import_supportRooms.supportHandler.checkFoundQ(match[1])) {
        console.log("Room not found");
        sendFile(res, getToken(req), import_consts.frontendDir + "/room404.html");
        return;
      } else
        sendFile(res, getToken(req), import_consts.frontendDir + "/support.html");
    } else
      sendFile(res, getToken(req), import_consts.frontendDir + "/supportIndex.html");
    (0, import_logging.incrRequests)();
  });
  app.get("/accountDel", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "/delAcc.html");
    (0, import_logging.incrRequests)();
  });
  app.get("/whois", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "/aboutme.html");
    (0, import_logging.incrRequests)();
  });
  app.get("/cmd", urlencodedParser, async (req, res) => {
    makeRequest(req.query.action, req.cookies.accountID, null, (s, d, token) => {
      console.log(d);
      if (s == "SUCCESS")
        sendFile(res, getToken(req), import_consts.frontendDir + "/actionComplete.html");
      else {
        sendFile(res, getToken(req), import_consts.frontendDir + "/error.html");
      }
    });
    (0, import_logging.incrRequests)();
  });
  app.get("*/nodemodules/*", (req, res) => {
    if (req.url.length > 500)
      sendFile(res, getToken(req), import_consts.frontendDir + "/404.html");
    else
      res.sendFile(import_consts.rootDir + "node_modules" + req.url.replace(/.*nodemodules/, ""));
    (0, import_logging.incrRequests)();
  });
  app.get("/paste", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "newpaste.html");
    (0, import_logging.incrRequests)();
  });
  app.get("/paste/*", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "paste.html");
    (0, import_logging.incrRequests)();
  });
  app.get("*/favicon.ico", (req, res) => {
    sendFile(res, getToken(req), import_consts.rootDir + "favicon.ico");
    (0, import_logging.incrRequests)();
  });
  app.get("*/icon.png", (req, res) => {
    sendFile(res, getToken(req), import_consts.rootDir + "temp.png");
    (0, import_logging.incrRequests)();
  });
  app.get("*/notif.wav", (req, res) => {
    sendFile(res, getToken(req), import_consts.rootDir + "notif.wav");
    (0, import_logging.incrRequests)();
  });
  app.get("/support.js", (req, res) => {
    sendFile(res, getToken(req), import_consts.frontendDir + "support.js");
    (0, import_logging.incrRequests)();
  });
  app.get("*.svg", (req, res) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    res.setHeader("expires", date.toUTCString());
    res.setHeader("cache-control", "public, max-age=31536000, immutable");
    res.sendFile(import_consts.frontendDir + req.url);
    (0, import_logging.incrRequests)();
  });
  app.get("/*.js*", (req, res) => {
    res.sendFile(import_consts.jsDir + req.url);
    (0, import_logging.incrRequests)();
  });
  app.get("/*.ts", (req, res) => {
    res.sendFile(import_consts.jsDir + req.url);
    (0, import_logging.incrRequests)();
  });
  app.get("/*.css", (req, res) => {
    res.sendFile(import_consts.frontendDir + req.url);
    (0, import_logging.incrRequests)();
  });
  app.get("/stream", (req, res) => {
    res.set({
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive"
    });
    res.flushHeaders();
    res.write("retry:500\n\n");
    import_supportRooms.supportHandler.addConnection(res, req.query.room, req.cookies.accountID);
    res.on("close", () => {
      import_supportRooms.supportHandler.removeConnection(res, req.query.room, req.cookies.accountID);
      res.end();
    });
  });
  app.get("/redirector", (req, res) => {
    sendFile(res, getToken(req), import_consts.rootDir + "/.github/pages/index.html");
    (0, import_logging.incrRequests)();
  });
  app.post("/oauth2callback", (req, res) => {
  });
  app.get("/*", (req, res) => {
    let requrl = req.url.match("([^?]*)\\??.*")[1];
    let idx = validPages.findIndex((obj) => obj.toLowerCase() == requrl.toLowerCase());
    if (idx >= 0)
      sendFile(res, getToken(req), import_consts.frontendDir + validPages[idx] + ".html");
    else {
      res.status(404);
      sendFile(res, getToken(req), import_consts.frontendDir + "404.html");
    }
    (0, import_logging.incrRequests)();
  });
  app.post("/server", urlencodedParser, async (req, res) => {
    (0, import_logging.incrRequests)();
    if (req.headers["content-length"] > 6e4) {
      res.set("Connection", "close");
      res.status(413).end();
      return;
    }
    var body = await parse.json(req);
    if (!body)
      res.end(JSON.stringify({ status: "ERROR", data: { error: "No command string" } }));
    if (body.action == "cookieRequest") {
      res.end(JSON.stringify({ data: req.cookies.acceptedQ ?? false }));
      return;
    }
    if (body.action == "acceptCookies") {
      res.cookie("acceptedQ", true, { httpOnly: true, secure: true, sameSite: "None" });
      res.end(JSON.stringify(""));
      return;
    }
    if (body.action == "accountID") {
      if (req.cookies.accountID)
        res.end(JSON.stringify({ status: "SUCCESS", data: { id: req.cookies.accountID } }));
      else
        res.end(JSON.stringify({ status: "ERROR", data: { error: "Not logged in" } }));
      return;
    }
    if (body.action == "setAccountID") {
      res.cookie("accountID", body.data.id, { httpOnly: true, secure: true, sameSite: "None" });
      res.end(JSON.stringify({ status: "SUCCESS", data: null }));
      return;
    }
    if (!req.cookies.sessionID)
      res.cookie("sessionID", crypto.randomUUID(), { httpOnly: true, secure: true, sameSite: "None" });
    makeRequest(body.action, req.cookies.accountID, body.data, req.cookies.sessionID, (s, d, token) => {
      if (ignoreLog.indexOf(body.action) >= 0) {
      } else if (s == "SUCCESS") {
        (0, import_logging.log)("Action performed:" + body.action + ", response:" + JSON.stringify(d));
      } else
        (0, import_logging.log)("Action performed, error on " + body.action + ", error:" + d.error);
      res.cookie("accountID", token ? token : "", { httpOnly: true, secure: true, sameSite: "None", maxAge: 9e12 });
      res.end(JSON.stringify({ status: s, data: d }));
    });
  });
  app.listen(import_consts.port, () => {
    console.log(`BetaUtilities V2 listening on port ${import_consts.port}`);
  });
}
function makeRequest(action, token, data, sessID, callback) {
  if (!import_index.connectionSuccess) {
    callback("ERROR", { error: "Database connection failure" }, token);
    return;
  }
  try {
    switch (action) {
      case "test":
        callback("SUCCESS", { abc: "def", def: 5 }, token);
        break;
      case "login":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        (0, import_validateLogin.validateLogin)(data.user, data.pass, data.persistQ, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "signup":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        (0, import_validateLogin.signup)(data.user, data.pass, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        ;
        break;
      case "userRequest":
        (0, import_userRequest.userRequest)(token).then((obj) => {
          obj.data.branch = process.env["branch"];
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "extendSession":
        (0, import_userRequest.extendSession)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "roomRequest":
        let obj2 = (0, import_supportRooms.roomRequest)(token);
        callback(obj2.status, obj2.data, obj2.token);
        break;
      case "createRoom":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        (0, import_supportRooms.createRoom)(data.name, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "deleteRoom":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        (0, import_supportRooms.deleteRoom)(data.name, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "statusRequest":
        let obj3 = (0, import_supportRooms.roomRequest)(token, true);
        callback(obj3.status, obj3.data, obj3.token);
        break;
      case "getEE":
        (0, import_EEHandler.EE)(true, callback, token, "");
        break;
      case "setEE":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        (0, import_EEHandler.EE)(false, callback, token, data.data);
        break;
      case "updateuser":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        (0, import_updateUser.updateUser)(data.user, data.oldPass, data.pass, data.newPermLevel, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "delAcc":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        (0, import_delacc.deleteAccount)(data.user, data.pass, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "logout":
        (0, import_validateLogin.logout)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "logout_all":
        (0, import_validateLogin.logout)(token, true).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "sendMsg":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        data = data;
        if (data.msg.length == 0) {
          callback("SUCCESS", null, token);
          break;
        }
        (0, import_supportRooms.sendMsg)(data.msg.slice(0, 1024), data.room, data.parent, token, callback);
        break;
      case "lookup":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_supportRooms.WHOIS)(token, data.user).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "getLogs":
        (0, import_logging.getLogs)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "purgeLogs":
        (0, import_logging.purgeLogs)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "realias":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_updateUser.realias)(data.alias, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "visits":
        (0, import_logging.visitCt)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "addTODO":
        (0, import_tasks.addTask)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "getTodo":
        (0, import_tasks.getTasks)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "updateTODO":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_tasks.updateTask)(token, data.id, data.updated).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "deleteTODO":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_tasks.deleteTask)(token, data.id).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "completeTODO":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_tasks.deleteTask)(token, data.id, true).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "loadLogs":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_supportRooms.loadLogs)(data.room, data.id, data.from, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "delMsg":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_supportRooms.delMsg)(data.id, data.room, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "updateDefaultLoad":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_supportRooms.updateDefaultLoad)(data.new, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "hidRoom":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_supportRooms.hidRoom)(data.name, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "purge":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_supportRooms.purge)(data.name, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "uptime":
        (0, import_messageHandle.uptime)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "toggleTheme":
        (0, import_updateUser.toggleTheme)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "updateAboutMe":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_supportRooms.updateAbout)(data.new, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "paste":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_paste.paste)(data.content, data.name, data.pwd, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "findPaste":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_paste.findPaste)(data.name, data.pwd, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "editPaste":
        if (!data) {
          callback("ERROR", { error: "No data provided" }, token);
          break;
        }
        (0, import_paste.editPaste)(data.content, data.name, data.pwd, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "clickIt":
        (0, import_button.clickIt)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "leaderboard":
        (0, import_button.getLeaderboard)(token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "newIssue":
        (0, import_issuetracker.newIssue)(data.title, data.body, data.priority, data.tags ?? [], token, sessID).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "loadIssues":
        (0, import_issuetracker.loadIssues)(data.from, data.ct, data.completedOnly, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "deleteissue":
        (0, import_issuetracker.deleteIssue)(data.id, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "completeissue":
        (0, import_issuetracker.completeIssue)(data.id, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "editissue":
        (0, import_issuetracker.editIssue)(data.id, data.newTitle, data.newBody, data.newPriority, data.tags ?? [], token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      case "adminAction":
        (0, import_adminAction.adminAction)(data.action, data.options, token).then((obj) => {
          callback(obj.status, obj.data, obj.token);
        });
        break;
      default:
        callback("ERROR", { error: "Unknown command string!" }, token);
    }
  } catch (e) {
    console.log("Error:", e);
  }
  return;
}
function eeFormat(data, mainClass) {
  return `<!DOCTYPE html>
<html class="${mainClass}">
  <head>
    <script src='./utils.js'><\/script>
    <title>Everyone Edits | BetaOS Systems</title>
    <script>
    <\/script>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@100;400;500;600;700&display=swap" rel="stylesheet">
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
      ${data}
      <br>
      <a class="btn fssml" href="/EEdit">
    <span class="material-symbols-outlined">edit</span>
    Edit this page
    <div class="anim"></div></a>
    <a class="btn fssml" href="/">
    <span class="material-symbols-outlined">arrow_back_ios</span>
    
    Return to home<div class="anim"></div></a>
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
</html>`;
}
function tooManyRequests() {
  return `<!DOCTYPE html>
<html class="{{mainClass}}">
  <head>
    <title>Error 429 | BetaOS Systems</title>
    <script>
    ${fs.readFileSync(import_consts.jsDir + "utils.js")}
    <\/script>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@100;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <style>
      ${fs.readFileSync(import_consts.frontendDir + "/globalformat.css")}
    </style>
  </head>
  <body onload="globalOnload(()=>{}, true)">
    <div class="main_content">
    <header>
      <h2>Error: Too many requests</h2>
      <hr class="redrounded">
    </header>
    <p class="fsmed"><span class="material-symbols-outlined red nohover nooutline">error</span>
    Try <button class="btn fssml" onclick="location.reload()">
    <span class="material-symbols-outlined">refresh</span>
    refreshing.<div class="anim"></div></button></p>
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
</html>`;
}
const validPages = [
  "/commands",
  "/contact",
  "/EEdit",
  "/todo",
  "/status",
  "/logout",
  "/signup",
  "/config",
  "/admin",
  "/docs",
  "/login",
  "/syslog",
  "/aboutme",
  "/mailertest",
  "/timer",
  "/newpaste",
  "/pastesearch",
  "/clickit",
  "/capsdle",
  "/sweepthatmine",
  "/stopwatch",
  "/testbed",
  "/credits",
  "/atomicmoose",
  "/issuetracker",
  "/graphIt",
  "/betterselect",
  "/redirect",
  "/betterselect.js",
  "/minimalLogin",
  "/minimalSignup",
  "/8192",
  "/imgedit",
  "/leaderboard",
  "/eval"
];
const ignoreLog = [
  "getEE",
  "userRequest",
  "getLogs",
  "loadLogs",
  "visits",
  "roomRequest",
  "sendMsg",
  "clickIt",
  "leaderboard",
  "paste",
  "findPaste"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initServer
});
//# sourceMappingURL=server.js.map
