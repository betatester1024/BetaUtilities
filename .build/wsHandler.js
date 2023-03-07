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
var wsHandler_exports = {};
__export(wsHandler_exports, {
  WS: () => WS
});
module.exports = __toCommonJS(wsHandler_exports);
var import_ws = require("ws");
var import_database = require("./database");
var import_messageHandle = require("./messageHandle");
var import_messageHandle2 = require("./messageHandle");
var import_misc = require("./misc");
const fs = require("fs");
const Database = require("@replit/database");
class WS {
  static notifRoom;
  DATALOGGING = false;
  static CALLTIMEOUT = 3e4;
  url;
  static sockets = [];
  nick;
  setNickQ = false;
  socket;
  pausedQ = false;
  roomName;
  static FAILSAFETIMEOUT = null;
  pauser = null;
  failedQ = false;
  callTimes = [];
  callReset = null;
  callStatus = -1;
  transferOutQ = false;
  bypass = false;
  confirmcode = -1;
  static toSendInfo(msg, data = null) {
    if (data)
      return `{"type":"send", "data":{"content":"${msg}","parent":"${data["data"]["id"]}"}}`;
    else {
      return `{"type":"send", "data":{"content":"${msg}"}}`;
    }
  }
  incrRunCt() {
    import_database.DB.findOne({ fieldName: "COUNTERS" }).then(
      (obj) => {
        import_database.DB.updateOne(
          { fieldName: "COUNTERS" },
          {
            $set: { "runCt": obj.runCt + 1 },
            $currentDate: { lastModified: true }
          }
        );
      }
    );
  }
  incrPingCt() {
    import_database.DB.findOne({ fieldName: "COUNTERS" }).then(
      (obj) => {
        import_database.DB.updateOne(
          { fieldName: "COUNTERS" },
          {
            $set: { "pingCt": obj.pingCt + 1 },
            $currentDate: { lastModified: true }
          }
        );
      }
    );
  }
  displayStats(data) {
    import_database.DB.findOne({ fieldName: "COUNTERS" }).then(
      (obj) => {
        this.delaySendMsg("Run count: " + obj.runCt + "\\nPing count: " + obj.pingCt, data, 0);
      }
    );
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
      this.sendMsg("[CALLEND] Disconnected from BetaOS Services", data);
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
    this.incrRunCt();
  }
  onOpen() {
    (0, import_misc.systemLog)("BetaUtilities open in " + this.socket.url);
    WS.FAILSAFETIMEOUT = setTimeout(() => {
      WS.resetTime = 1e3;
    }, 1e4);
  }
  initNick() {
    if (!this.setNickQ)
      this.changeNick(this.nick);
    this.setNickQ = true;
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
      if (this.DATALOGGING) {
        console.log("LOG");
        fs.writeFileSync("./msgLog.txt", fs.readFileSync("./msgLog.txt").toString() + `(${this.roomName})[${snd}] ${msg}
`);
      }
      if (msg == "!kill @" + this.nick.toLowerCase()) {
        this.sendMsg("/me crashes", data);
        setTimeout(() => {
          this.socket.close(1e3, "!killed by user.");
        }, 100);
      } else if (this.pausedQ && msg == "!restore @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been unpaused", data);
        (0, import_messageHandle2.updateActive)(this.roomName, true);
        this.pauser = null;
        this.callTimes = [];
        this.pausedQ = false;
      } else if (msg == "!pause @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been paused", data);
        (0, import_messageHandle2.updateActive)(this.roomName, false);
        let reply = "Enter !kill @" + this.nick + " to kill this bot, or enter !restore @" + this.nick + " to restore it.";
        this.sendMsg(reply, data);
        this.pauser = snd;
        this.pausedQ = true;
      } else if (this.pausedQ && (msg.match("!ping @" + this.nick.toLowerCase(), "gmiu") || msg.match("!help @" + this.nick.toLowerCase(), "gmiu"))) {
        this.sendMsg("/me has been paused by @" + this.pauser, data);
        return;
      } else if (msg == "!ping") {
        this.sendMsg("Pong!", data);
        this.incrPingCt();
      } else if (msg.match("!ping @" + this.nick.toLowerCase() + "$")) {
        this.sendMsg(":white_check_mark: BetaOS services ONLINE", data);
        this.incrPingCt();
      } else if (msg == "!help") {
        this.sendMsg("Enter !help @" + this.nick + " for help!", data);
      }
      if (data["data"]["sender"]["id"].match("bot:")) {
        return;
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
  static resetTime = 1e3;
  onClose(event) {
    WS.sockets.splice(WS.sockets.indexOf(this), 1);
    if (WS.FAILSAFETIMEOUT) {
      clearTimeout(WS.FAILSAFETIMEOUT);
      WS.FAILSAFETIMEOUT = null;
    }
    if (event != 1e3 && event != 1006) {
      (0, import_messageHandle2.updateActive)(this.roomName, false);
      (0, import_misc.systemLog)("!killed in &" + this.roomName);
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ);
        (0, import_messageHandle2.updateActive)(this.roomName, true);
      }, 1e3);
    } else {
      (0, import_messageHandle2.updateActive)(this.roomName, false);
      if (event == 1e3)
        return;
      WS.resetTime *= 1.5;
      if (WS.resetTime > 3e4) {
        WS.resetTime = 3e4;
        return;
      }
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ);
        (0, import_messageHandle2.updateActive)(this.roomName, true);
      }, WS.resetTime);
      (0, import_misc.systemLog)("Retrying in: " + Math.round(WS.resetTime / 1e3) + " seconds");
      let dateStr = new Date().toLocaleDateString("en-US", { timeZone: "EST" }) + "/" + new Date().toLocaleTimeString("en-US", { timeZone: "EST" });
      (0, import_misc.systemLog)("[close] Connection at " + this.url + " was killed at " + dateStr);
    }
  }
  static killall() {
    for (let i = 0; i < WS.sockets.length; i++) {
      WS.sockets[i].socket.close(1e3, "!killall-ed");
      (0, import_messageHandle2.updateActive)(WS.sockets[i].roomName, false);
    }
  }
  constructor(url, nick, roomName, transferQ) {
    this.nick = nick;
    if (roomName == "bots")
      WS.notifRoom = this;
    WS.sockets.push(this);
    this.url = url;
    this.roomName = roomName;
    this.socket = new import_ws.WebSocket(url);
    this.transferOutQ = transferQ;
    this.socket.on("open", this.onOpen.bind(this));
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("close", this.onClose.bind(this));
    this.socket.on("error", (e) => {
      this.socket.close(1e3, "");
      (0, import_messageHandle2.updateActive)(this.roomName, false);
    });
    this.replyMessage = import_messageHandle.replyMessage;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WS
});
//# sourceMappingURL=wsHandler.js.map
