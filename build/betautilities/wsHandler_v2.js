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
var wsHandler_v2_exports = {};
__export(wsHandler_v2_exports, {
  WS_V2: () => WS_V2
});
module.exports = __toCommonJS(wsHandler_v2_exports);
var import_ws = require("ws");
var import_supportRooms = require("../supportRooms");
class WS_V2 {
  socket;
  static FAILSAFETIMEOUT = null;
  roomName;
  nick;
  url;
  static sockets;
  static resetTime = 500;
  onOpen() {
    console.log("BetaUtilities open in " + this.socket.url);
    WS_V2.FAILSAFETIMEOUT = setTimeout(() => {
      WS_V2.resetTime = 1e3;
    }, 1e4);
  }
  onClose(event) {
    WS_V2.sockets.splice(WS_V2.sockets.indexOf(this), 1);
    if (WS_V2.FAILSAFETIMEOUT) {
      clearTimeout(WS_V2.FAILSAFETIMEOUT);
      WS_V2.FAILSAFETIMEOUT = null;
    }
    if (event != 1e3 && event != 1006) {
      (0, import_supportRooms.updateActive)(this.roomName, false);
      console.log("!killed in &" + this.roomName);
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ);
        (0, import_supportRooms.updateActive)(this.roomName, true);
      }, 1e3);
    } else {
      (0, import_supportRooms.updateActive)(this.roomName, false);
      if (event == 1e3)
        return;
      WS_V2.resetTime *= 1.5;
      if (WS_V2.resetTime > 3e4) {
        WS_V2.resetTime = 3e4;
        return;
      }
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ);
        (0, import_supportRooms.updateActive)(this.roomName, true);
      }, WS_V2.resetTime);
      console.log("Retrying in: " + Math.round(WS_V2.resetTime / 1e3) + " seconds");
      let dateStr = new Date().toLocaleDateString("en-US", { timeZone: "EST" }) + "/" + new Date().toLocaleTimeString("en-US", { timeZone: "EST" });
      console.log("[close] Connection at " + this.url + " was killed at " + dateStr);
    }
  }
  constructor(url, nick, roomName, transferQ) {
    this.nick = nick;
    WS_V2.sockets.push(this);
    this.url = url;
    this.roomName = roomName;
    this.socket = new import_ws.WebSocket(url);
    this.socket.on("open", this.onOpen.bind(this));
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("close", this.onClose.bind(this));
    this.socket.on("error", (e) => {
      this.socket.close(1e3, "");
      (0, import_supportRooms.updateActive)(this.roomName, false);
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WS_V2
});
//# sourceMappingURL=wsHandler_v2.js.map
