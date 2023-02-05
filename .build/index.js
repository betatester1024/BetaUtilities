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
var BetaUtils_exports = {};
__export(BetaUtils_exports, {
  WS: () => WS
});
module.exports = __toCommonJS(BetaUtils_exports);
var import_ws = require("ws");
var import_initialiser = require("./initialiser");
var import_messageHandle = require("./messageHandle");
var import_messageHandle2 = require("./messageHandle");
var import_messageHandle3 = require("./messageHandle");
const Database = require("@replit/database");
const express = require("express");
const app = express();
const port = 4e3;
app.get("/", (req, res) => {
  let str = "BetaUtilities is is in: ";
  for (let j = 0; j < import_messageHandle3.rooms.length - 1; j++) {
    str += `<a href="test"> & ${import_messageHandle3.rooms[j]},`;
  }
  str += "and &" + import_messageHandle3.rooms[import_messageHandle3.rooms.length - 1] + "!";
  res.send(str);
  console.log("Accessed.");
});
app.listen(port, () => {
  console.log(`Success! Your application is running on port ${port}.`);
});
class WS {
  static CALLTIMEOUT = 5e3;
  url;
  nick;
  socket;
  pausedQ = false;
  roomName;
  pauser = null;
  failedQ = false;
  callTimes = [];
  callReset = null;
  callStatus = -1;
  transferOutQ = false;
  bypass = false;
  confirmcode = -1;
  static db = new Database();
  static toSendInfo(msg, data = null) {
    if (data)
      return `{"type":"send", "data":{"content":"${msg}","parent":"${data["data"]["id"]}"}}`;
    else
      return `{"type":"send", "data":{"content":"${msg}"}`;
  }
  incrRunCt() {
    WS.db.get("RUNCOUNT").then((value) => {
      WS.db.set("RUNCOUNT", value + 1);
    });
  }
  incrPingCt() {
    WS.db.get("PINGCOUNT").then((value) => {
      WS.db.set("PINGCOUNT", value + 1);
    });
  }
  displayStats(data) {
    WS.db.get("RUNCOUNT").then((value) => {
      let RUNCOUNT = value;
      WS.db.get("PINGCOUNT").then((value2) => {
        let PINGCOUNT = value2;
        this.delaySendMsg("Run count: " + RUNCOUNT + "\\nPing count: " + PINGCOUNT, data, 0);
      });
    });
  }
  bumpCallReset(data) {
    if (this.callReset)
      clearTimeout(this.callReset);
    this.callReset = setTimeout(() => {
      this.resetCall(data);
    }, WS.CALLTIMEOUT);
  }
  clearCallReset() {
    if (this.callReset)
      clearTimeout(this.callReset);
    this.callStatus = -1;
  }
  resetCall(data) {
    if (this.callStatus >= 0) {
      this.delaySendMsg("[CALLEND] Disconnected from BetaOS Services", data, 0);
    }
    this.callStatus = -1;
  }
  replyMessage(msg, sender, data) {
    return "";
  }
  delaySendMsg(msg, data, delay) {
    if (delay == 0)
      this.sendMsg(msg, data);
    else {
      setTimeout(() => {
        this.sendMsg(msg, data);
      }, delay);
    }
    this.incrRunCt();
  }
  sendMsg(msg, data) {
    this.socket.send(WS.toSendInfo(msg, data));
  }
  onOpen() {
    console.log("Open in " + this.socket.url);
    app.get("/", (req, res) => {
      res.send("Open in " + this.socket.url);
    });
  }
  initNick() {
    this.changeNick(this.nick);
  }
  changeNick(nick) {
    this.socket.send(`{"type": "nick", "data": {"name": "${nick}"},"id": "1"}`);
  }
  onMessage(dat) {
    let data = JSON.parse(dat);
    if (data["type"] == "ping-event") {
      let reply = `{"type": "ping-reply","data": {"time":${data["data"]["time"]}},"id":"0"}`;
      this.socket.send(reply);
      setTimeout(this.initNick.bind(this), 3e3);
    }
    if (data["type"] == "send-event") {
      let msg = data["data"]["content"].toLowerCase().trim();
      let snd = data["data"]["sender"]["name"];
      console.log(`[${snd}] ${msg}`);
      if (msg == "!kill @" + this.nick.toLowerCase()) {
        this.sendMsg("/me crashes", data);
        setTimeout(() => {
          this.socket.close(1e3, "!killed by user.");
        }, 100);
      } else if (this.pausedQ && msg == "!restore @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been unpaused", data);
        this.pauser = null;
        this.callTimes = [];
        this.pausedQ = false;
      } else if (msg == "!pause @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been paused", data);
        let reply = "Enter !kill @" + this.nick + " to kill this bot, or enter !restore @" + this.nick + " to restore it.";
        this.delaySendMsg(reply, data, 0);
        this.pauser = snd;
        this.pausedQ = true;
      } else if (this.pausedQ && (msg.match("!ping @" + this.nick.toLowerCase(), "gmiu") || msg.match("!help @" + this.nick.toLowerCase(), "gmiu"))) {
        this.delaySendMsg("/me has been paused by @" + this.pauser, data, 0);
        return;
      } else if (msg == "!ping") {
        this.sendMsg("Pong!", data);
        this.incrPingCt();
      } else if (msg.match("!ping @" + this.nick.toLowerCase() + "$")) {
        this.sendMsg(":white_check_mark: BetaOS services ONLINE", data);
        this.incrPingCt();
      } else if (msg == "!help") {
        this.sendMsg("Enter !help @" + this.nick + " for help!", data);
      } else if (!this.pausedQ) {
        let outStr = this.replyMessage(msg.trim(), snd, data);
        if (this.failedQ && outStr != "")
          outStr = "/me is rebooting.";
        if (outStr == "")
          return;
        if (!this.bypass) {
          this.callTimes.push(Date.now());
          setTimeout(() => {
            this.callTimes.shift();
          }, 60 * 5 * 1e3);
        }
        if (!this.bypass && this.callTimes.length >= 5) {
          if (this.callTimes.length < 10) {
            outStr = this.transferOutQ ? outStr + "\\n[ANTISPAM] Consider moving to &bots or &test for large-scale testing. Thank you for your understanding." : outStr + " [ANTISPAM WARNING]";
          } else {
            outStr = outStr + "\\n[ANTISPAM] Automatically paused @" + this.nick;
            this.pausedQ = true;
            this.pauser = "BetaOS_ANTISPAM";
            this.resetCall(data);
          }
        }
        this.sendMsg(outStr, data);
      }
    }
  }
  errorSocket() {
    this.pausedQ = false;
    this.pauser = null;
    this.changeNick(this.nick + "[Error]");
    this.incrRunCt();
    this.failedQ = true;
    setTimeout(() => {
      this.changeNick(this.nick);
      this.incrRunCt();
      (0, import_messageHandle2.updateActive)(this.roomName, true);
      this.failedQ = false;
    }, 5e3);
    (0, import_messageHandle2.updateActive)(this.roomName, false);
  }
  onClose(event) {
    console.log(event);
    if (event != 1e3) {
      (0, import_messageHandle2.updateActive)(this.roomName, false);
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ);
        (0, import_messageHandle2.updateActive)(this.roomName, true);
      }, 1e3);
    } else {
      (0, import_messageHandle2.updateActive)(this.roomName, false);
      console.log("[close] Connection at " + this.url + " was killed");
    }
  }
  constructor(url, nick, roomName, transferQ) {
    this.nick = nick;
    this.url = url;
    this.roomName = roomName;
    this.socket = new import_ws.WebSocket(url);
    this.transferOutQ = transferQ;
    this.socket.on("open", this.onOpen.bind(this));
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("close", this.onClose.bind(this));
    this.replyMessage = import_messageHandle.replyMessage;
  }
}
(0, import_initialiser.init)();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WS
});
//# sourceMappingURL=index.js.map
