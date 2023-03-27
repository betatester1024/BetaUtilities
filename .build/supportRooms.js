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
  sendMsg: () => sendMsg,
  supportHandler: () => supportHandler
});
module.exports = __toCommonJS(supportRooms_exports);
var import_userRequest = require("./userRequest");
var import_consts = require("./consts");
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
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
        (0, import_userRequest.userRequest)((status, data, _token) => {
          if (status == "SUCCESS")
            ev.write("data:+" + data.alias + "(" + data.perms + ")>\n\n");
          else
            ev.write("data:+ANON|" + processAnon(this.connections[i].tk) + "(1)>\n\n");
        }, this.connections[i].tk);
    }
    this.connections.push({ event: ev, roomName: rn, tk: token });
    (0, import_userRequest.userRequest)((status, data, _token) => {
      if (status == "SUCCESS")
        this.sendMsgTo(rn, "+" + data.alias + "(" + data.perms + ")");
      else
        this.sendMsgTo(rn, "+ANON|" + processAnon(token) + "(1)");
    }, token);
    console.log("added connection in " + rn);
  }
  static async removeConnection(ev, rn, token) {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].event == ev)
        this.connections.splice(i, 1);
    }
    ;
    (0, import_userRequest.userRequest)((status, data, _token) => {
      if (status == "SUCCESS")
        this.sendMsgTo(rn, "-" + data.alias + "(" + data.perms + ")");
      else
        this.sendMsgTo(rn, "-ANON|" + processAnon(token) + "(1)");
    }, token);
    console.log("removed connection in " + rn);
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
      if (this.allRooms[i].name == roomName && this.allRooms[i].type != "EUPH_ROOM")
        return true;
    }
    return false;
  }
  static sendMsgTo(roomName, data) {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].roomName == roomName) {
        data = data.replace(">", "&gt;");
        this.connections[i].event.write("data:" + data + ">\n\n");
      }
    }
  }
}
async function sendMsg(msg, room, callback, token) {
  (0, import_userRequest.userRequest)(async (status, data, _token) => {
    await import_consts.K.msgDB.insertOne({ fieldName: "MSG", user: data.alias });
    if (status == "SUCCESS")
      supportHandler.sendMsgTo(room, "[" + data.alias + "](" + data.perms + ")" + msg);
    else
      supportHandler.sendMsgTo(room, "[ANON|" + processAnon(token) + "](1)" + msg);
    callback("SUCCESS", null, token);
  }, token);
}
function processAnon(token) {
  return token ? token.slice(0, 4) : "Err";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Room,
  sendMsg,
  supportHandler
});
//# sourceMappingURL=supportRooms.js.map
