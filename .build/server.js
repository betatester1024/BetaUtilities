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
  hidEvents: () => hidEvents,
  hidUserEvents: () => hidUserEvents,
  hidUsers: () => hidUsers,
  pushEvents: () => pushEvents,
  pushUserEvents: () => pushUserEvents,
  sendMsgAllRooms: () => sendMsgAllRooms,
  updateServer: () => updateServer,
  users: () => users
});
module.exports = __toCommonJS(server_exports);
var import_initialiser = require("./initialiser");
var import_accessControl = require("./accessControl");
var import_misc = require("./misc");
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const app = express();
const port = 4e3;
var RateLimit = require("express-rate-limit");
let pushEvents = [];
let hidEvents = [];
let pushUserEvents = [];
let hidUserEvents = [];
let users = [];
let hidUsers = [];
async function updateServer() {
  (0, import_misc.systemLog)("");
  (0, import_misc.systemLog)("Server active!");
  var limiter = RateLimit({
    windowMs: 10 * 1e3,
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429
  });
  app.use(limiter);
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
    if (req.body.action == "bMsg")
      res.end(JSON.stringify("ACCESS"));
    (0, import_accessControl.validate)(decodeURIComponent(req.body.user), decodeURIComponent(req.body.pass), req.body.action, req.body.access, res, req.body.token);
  });
  app.get("/users?*", async (req, res) => {
    res.set({
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive"
    });
    res.flushHeaders();
    res.write("retry:500\n\n");
    let roomIdx = import_initialiser.sysRooms.indexOf("OnlineSUPPORT|" + req.query.room);
    let roomIdx2 = import_initialiser.hidRooms.indexOf("HIDDEN|" + req.query.room);
    if (roomIdx < 0 && roomIdx2 < 0) {
      res.end();
      console.log("Invalid room: " + req.query.room);
      return;
    }
    if (roomIdx >= 0)
      pushUserEvents[roomIdx].push(res);
    else
      hidUserEvents[roomIdx2].push(res);
    res.on("close", () => {
      if (roomIdx >= 0)
        pushUserEvents[roomIdx].splice(pushUserEvents[roomIdx].indexOf(res), 1);
      else
        hidUserEvents[roomIdx2].splice(hidUserEvents[roomIdx2].indexOf(res), 1);
      res.end();
    });
  });
  app.get("/stream?*", async (req, res) => {
    res.set({
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive"
    });
    res.flushHeaders();
    res.write("retry:500\n\n");
    let roomIdx = import_initialiser.sysRooms.indexOf("OnlineSUPPORT|" + req.query.room);
    let roomIdx2 = import_initialiser.hidRooms.indexOf("HIDDEN|" + req.query.room);
    if (roomIdx < 0 && roomIdx2 < 0) {
      res.end();
      console.log("Invalid room: " + req.query.room);
      return;
    }
    if (roomIdx >= 0) {
      pushEvents[roomIdx].push(res);
      pushUserEvents[roomIdx].push(res);
      (0, import_accessControl.validate)("", "", "userReq", "internal", (id) => {
        sendMsgAllRooms(req.query.room, "+" + id + "\\n");
        if (roomIdx >= 0)
          users[roomIdx].push(id);
        else
          hidUsers[roomIdx2].push(id);
      }, req.query.token);
    } else {
      hidEvents[roomIdx2].push(res);
      hidUserEvents[roomIdx2].push(res);
      (0, import_accessControl.validate)("", "", "userReq", "internal", (id) => {
        sendMsgAllRooms(req.query.room, "+" + id + "\\n");
        if (roomIdx >= 0)
          users[roomIdx].push(id);
        else
          hidUsers[roomIdx2].push(id);
      }, req.query.token);
    }
    res.on("close", () => {
      if (roomIdx >= 0)
        pushEvents[roomIdx].splice(pushEvents[roomIdx].indexOf(res), 1);
      else
        hidEvents[roomIdx2].splice(hidEvents[roomIdx2].indexOf(res), 1);
      res.end();
      console.log("Removed stream " + req.query.room);
      (0, import_accessControl.validate)("", "", "userReq", "internal", (id) => {
        if (roomIdx >= 0) {
          let idx = users[roomIdx].indexOf(id);
          if (idx >= 0)
            users[roomIdx].splice(idx, 1);
        } else {
          let idx = hidUsers[roomIdx2].indexOf(id);
          if (idx >= 0)
            hidUsers[roomIdx2].splice(idx, 1);
        }
        sendMsgAllRooms(req.query.room, "-" + id + "\\n");
      }, req.query.token);
    });
  });
  app.get("/testevents", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "support_v2.html"));
  });
  app.get("/status", (req, res) => {
    let str = "BetaUtilities is in: ";
    let prefixedRms = [];
    let euphRooms = 0;
    for (let i = 0; i < import_initialiser.sysRooms.length; i++) {
      if (!import_initialiser.sysRooms[i].match("\\|")) {
        euphRooms++;
        prefixedRms.push(`<a href="https://euphoria.io/room/${import_initialiser.sysRooms[i]}">&${import_initialiser.sysRooms[i]}</a>`);
      } else {
        let roomName = import_initialiser.sysRooms[i].match("\\|(.+)")[1];
        prefixedRms.push(`<a href="/support?room=${roomName}">#${roomName}</a>`);
      }
    }
    for (let j = 0; j < prefixedRms.length - 1; j++) {
      str += prefixedRms[j] + ", ";
    }
    str += (prefixedRms.length > 1 ? "and " : "") + prefixedRms[prefixedRms.length - 1] + "!";
    if (euphRooms == 0) {
      str += "<br> ERROR: Rooms failed on <a href='https://euphoria.io'>euphoria</a>";
    }
    fs.writeFileSync("frontend/status_raw.html", str);
    res.sendFile(path.join(__dirname, "../frontend", "status.html"));
  });
  app.get("/globalformat.css", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "globalformat.css"));
  });
  app.get("/support", (req, res) => {
    let roomIdx = import_initialiser.sysRooms.indexOf("OnlineSUPPORT|" + req.query.room);
    let roomIdx2 = import_initialiser.hidRooms.indexOf("HIDDEN|" + req.query.room);
    if (roomIdx < 0 && roomIdx2 < 0 && req.query.room) {
      res.sendFile(path.join(__dirname, "../frontend", "roomNotFound.html"));
    } else if (req.query.room)
      res.sendFile(path.join(__dirname, "../frontend", "support.html"));
    else
      res.sendFile(path.join(__dirname, "../frontend", "supportIndex.html"));
  });
  app.get("/todo", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "TODO.html"));
  });
  app.get("/syslog", (req, res) => {
    (0, import_accessControl.validate)("", "", "checkAccess_A", "", res, req.query.token);
  });
  app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "about.html"));
  });
  app.get("/commands", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "commands.html"));
  });
  app.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "contact.html"));
  });
  app.get("/screwit", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "bothered.html"));
  });
  app.get("/screwit.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "bothered.js"));
  });
  app.get("*.js.map", (req, res) => {
    res.end();
  });
  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "404.html"));
  });
  app.listen(port, () => {
    (0, import_misc.systemLog)(`Front-end is running on ${port}.`);
  });
}
function sendMsgAllRooms(room, msg) {
  let roomId = import_initialiser.sysRooms.indexOf("OnlineSUPPORT|" + room);
  let roomId2 = import_initialiser.hidRooms.indexOf("HIDDEN|" + room);
  if (roomId < 0 && roomId2 < 0) {
    console.log("invalidROOM:" + room);
    return;
  } else if (roomId >= 0)
    for (let i = 0; i < pushEvents[roomId].length; i++)
      pushEvents[roomId][i].write("data:" + msg + "\n\n");
  else
    for (let i = 0; i < hidEvents[roomId2].length; i++)
      hidEvents[roomId2][i].write("data:" + msg + "\n\n");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hidEvents,
  hidUserEvents,
  hidUsers,
  pushEvents,
  pushUserEvents,
  sendMsgAllRooms,
  updateServer,
  users
});
//# sourceMappingURL=server.js.map
