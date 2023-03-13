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
var webHandler_exports = {};
__export(webHandler_exports, {
  WebH: () => WebH
});
module.exports = __toCommonJS(webHandler_exports);
var import_database = require("./database");
var import_messageHandle = require("./messageHandle");
var import_messageHandle2 = require("./messageHandle");
var import_misc = require("./misc");
var import_accessControl = require("./accessControl");
const DATALOGGING = true;
const fs = require("fs");
const Database = require("@replit/database");
class WebH {
  static CALLTIMEOUT = 3e4;
  nick;
  pausedQ = false;
  roomName;
  hiddenQ;
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
    else
      return `{"type":"send", "data":{"content":"${msg}"}`;
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
    }, WebH.CALLTIMEOUT);
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
  sendMsg(msg, user) {
    (0, import_accessControl.validate)(msg, "", "bMsg", this.roomName.match("\\|(.*)$")[1], null, "");
    this.incrRunCt();
  }
  onOpen() {
    (0, import_misc.systemLog)("BetaUtilities open");
    WebH.resetTime = 1e3;
  }
  initNick() {
  }
  changeNick(nick) {
  }
  onMessage(msg, snd) {
    let data = "";
    if (DATALOGGING)
      fs.writeFileSync("./msgLog.txt", fs.readFileSync("./msgLog.txt").toString() + `(${this.roomName})[${snd}] ${msg}
`);
    msg = msg.trim().toLowerCase();
    if (msg == "!kill @" + this.nick.toLowerCase()) {
      this.sendMsg("/me crashes", data);
      this.delaySendMsg("/me restarts", data, 200);
    } else if (this.pausedQ && msg == "!restore @" + this.nick.toLowerCase()) {
      this.sendMsg("/me has been unpaused", data);
      if (!this.hiddenQ)
        (0, import_messageHandle2.updateActive)(this.roomName, true);
      this.pauser = null;
      this.callTimes = [];
      this.pausedQ = false;
    } else if (msg == "!pause @" + this.nick.toLowerCase()) {
      this.sendMsg("/me has been paused", data);
      if (!this.hiddenQ)
        (0, import_messageHandle2.updateActive)(this.roomName, false);
      let reply = "Enter !kill @" + this.nick + " to kill this bot, or enter !restore @" + this.nick + " to restore it.";
      this.sendMsg(reply, data);
      this.pauser = snd;
      this.pausedQ = true;
    } else if (this.pausedQ && (msg.match("!ping @" + this.nick.toLowerCase()) || msg.match("!help @" + this.nick.toLowerCase()))) {
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
  errorSocket() {
    this.pausedQ = false;
    this.pauser = null;
    this.changeNick(this.nick + "[Error]");
    this.incrRunCt();
    this.failedQ = true;
    setTimeout(() => {
      this.changeNick(this.nick);
      this.incrRunCt();
      if (!this.hiddenQ)
        (0, import_messageHandle2.updateActive)(this.roomName, true);
      this.failedQ = false;
    }, 5e3);
    if (!this.hiddenQ)
      (0, import_messageHandle2.updateActive)(this.roomName, false);
  }
  static resetTime = 1e3;
  onClose(event) {
    (0, import_misc.systemLog)("Closed");
  }
  constructor(roomName, hiddenQ = false) {
    this.nick = "BetaOS_System";
    this.replyMessage = import_messageHandle.replyMessage;
    this.hiddenQ = hiddenQ;
    if (roomName.length > 21)
      return;
    this.roomName = (hiddenQ ? "HIDDEN|" : "OnlineSUPPORT|") + roomName;
    if (!hiddenQ)
      (0, import_messageHandle2.updateActive)(this.roomName, true);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WebH
});
//# sourceMappingURL=webHandler.js.map
