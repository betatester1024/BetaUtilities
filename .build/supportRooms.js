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
var supportRooms_exports = {};
__export(supportRooms_exports, {
  Room: () => Room,
  supportHandler: () => supportHandler
});
module.exports = __toCommonJS(supportRooms_exports);
var import_userRequest = require("./userRequest");
class Room {
  type;
  pausedQ;
  name;
  constructor(type, name) {
    this.type = type;
    this.pausedQ = false;
    this.name = name;
  }
  pause() {
    this.pausedQ = true;
  }
}
class supportHandler {
  static allRooms = [];
  static connections = [];
  static addRoom(r) {
    this.allRooms.push(r);
  }
  static addConnection(ev, rn, token) {
    this.connections.push({ event: ev, roomName: rn });
    (0, import_userRequest.userRequest)((status, data, token2) => {
      if (status == "SUCCESS")
        this.sendMsgTo(rn, "+" + data.user + "(" + data.perms + ")");
    }, token);
    console.log("added connection in " + rn);
  }
  static async removeConnection(ev, rn, token) {
    let idx = this.connections.indexOf({ event: ev, roomName: rn });
    if (idx >= 0)
      this.connections.splice(idx, 1);
    (0, import_userRequest.userRequest)((status, data, token2) => {
      if (status == "SUCCESS")
        this.sendMsgTo(rn, "+" + data.user + "(" + data.perms + ")");
    }, token);
  }
  static listRooms(euphOnlyQ) {
    let out = [];
    for (let i = 0; i < this.allRooms.length; i++) {
      if (euphOnlyQ && this.allRooms[i].type != "EUPH_ROOM")
        continue;
      if (this.allRooms[i].type == "HIDDEN_SUPPORT")
        continue;
      out.push(this.allRooms[i].name);
    }
    return out;
  }
  static checkFoundQ(roomName) {
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName)
        return true;
    }
    return false;
  }
  static sendMsgTo(roomName, data) {
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.connections[i].roomName == roomName)
        this.connections[i].event.write("data:" + data + "\n\n");
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Room,
  supportHandler
});
//# sourceMappingURL=supportRooms.js.map