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
  WHOIS: () => WHOIS,
  createRoom: () => createRoom,
  deleteRoom: () => deleteRoom,
  pseudoConnection: () => pseudoConnection,
  roomRequest: () => roomRequest,
  sendMsg: () => sendMsg,
  sendMsg_B: () => sendMsg_B,
  supportHandler: () => supportHandler,
  updateActive: () => updateActive
});
module.exports = __toCommonJS(supportRooms_exports);
var import_userRequest = require("./userRequest");
var import_consts = require("./consts");
var import_logging = require("./logging");
class Room {
  type;
  name;
  handler;
  constructor(type, name, responder = null, handler = null) {
    this.type = type;
    this.name = name;
    this.handler = handler;
  }
}
class pseudoConnection {
  write(thing) {
  }
  close() {
  }
}
;
class supportHandler {
  static allRooms = [];
  static connections = [];
  static addRoom(rm) {
    (0, import_logging.log)("Room created!" + rm);
    let idx = this.allRooms.findIndex((r) => {
      return r.type == rm.type && r.name == rm.name;
    });
    if (idx >= 0)
      return;
    else
      this.allRooms.push(rm);
  }
  static deleteRoom(type, roomName) {
    (0, import_logging.log)("Room deleted!" + type + roomName);
    let idx = this.allRooms.findIndex((r) => {
      return r.type == type && r.name == roomName;
    });
    if (idx >= 0)
      this.allRooms.splice(idx, 1);
  }
  static async addConnection(ev, rn, token, internalFlag = false) {
    if (internalFlag)
      token = "[SYSINTERNAL]";
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
        (0, import_userRequest.userRequest)(this.connections[i].tk, internalFlag).then((obj) => {
          if (obj.status == "SUCCESS")
            ev.write("data:+" + obj.data.alias + "(" + obj.data.perms + ")>\n\n");
          else
            ev.write("data:+" + processAnon(this.connections[i].tk) + "(1)>\n\n");
        });
    }
    let thiscn = { event: ev, roomName: rn, tk: token, readyQ: false };
    this.connections.push(thiscn);
    (0, import_userRequest.userRequest)(token, internalFlag).then((obj) => {
      if (obj.status == "SUCCESS")
        this.sendMsgTo(rn, "+" + obj.data.alias + "(" + obj.data.perms + ")");
      else
        this.sendMsgTo(rn, "+" + processAnon(obj.token) + "(1)");
    });
    console.log("added connection in " + rn);
    let msgs = await import_consts.msgDB.find({ fieldName: "MSG", room: { $eq: rn } }).toArray();
    let text = "";
    for (let i = 0; i < msgs.length; i++) {
      ev.write("data:[" + msgs[i].sender + "](" + msgs[i].permLevel + ")" + msgs[i].data + ">\n\n");
    }
    text += "[SYSTEM](3)Welcome to BetaOS Services support! Enter any message in the box below. Automated response services and utilities are provided by BetaOS System. Commands are available here: &gt;&gt;commands \nEnter !alias @[NEWALIAS] to re-alias yourself. Thank you for using BetaOS Systems!>";
    ev.write("data:" + text + "\n\n");
    thiscn.readyQ = true;
  }
  static async removeConnection(ev, rn, token) {
    let idx = this.connections.findIndex((cn) => cn.event == ev);
    if (idx >= 0)
      this.connections.splice(idx, 1);
    (0, import_userRequest.userRequest)(token).then((obj) => {
      if (obj.status == "SUCCESS")
        this.sendMsgTo(rn, "-" + obj.data.alias + "(" + obj.data.perms + ")");
      else
        this.sendMsgTo(rn, "-" + processAnon(obj.token) + "(1)");
      console.log("removed connection in " + rn);
    });
  }
  static listRooms(euphOnlyQ, onlineOnlyQ) {
    if (euphOnlyQ) {
      return this.listEuphRooms();
    } else if (onlineOnlyQ) {
      return this.listOnlineRooms();
    } else {
      return this.listAllRooms();
    }
  }
  static listAllRooms() {
    let out = [];
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].type == "HIDDEN_SUPPORT")
        continue;
      out.push(this.getPrefix(this.allRooms[i].type) + this.allRooms[i].name);
    }
    return out;
  }
  static listEuphRooms() {
    let out = [];
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].type != "EUPH_ROOM")
        continue;
      out.push(this.getPrefix(this.allRooms[i].type) + this.allRooms[i].name);
    }
    return out;
  }
  static listOnlineRooms() {
    let out = [];
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].type != "ONLINE_SUPPORT")
        continue;
      out.push(this.getPrefix(this.allRooms[i].type) + this.allRooms[i].name);
    }
    return out;
  }
  static getPrefix(type) {
    switch (type) {
      case "EUPH_ROOM":
        return "&";
      case "ONLINE_SUPPORT":
        return "#";
      default:
        return "??";
    }
  }
  static checkFoundQ(roomName) {
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName && this.allRooms[i].type != "EUPH_ROOM")
        return true;
    }
    return false;
  }
  static mitoseable(roomName) {
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName && this.allRooms[i].type == "EUPH_ROOM")
        return true;
    }
    return false;
  }
  static sendMsgTo(roomName, data) {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].roomName == roomName) {
        data = data.replaceAll(">", "&gt;");
        this.connections[i].event.write("data:" + data + ">\n\n");
      }
    }
  }
}
function sendMsg(msg, room, token, callback) {
  (0, import_userRequest.userRequest)(token).then(async (obj) => {
    await import_consts.msgDB.insertOne({
      fieldName: "MSG",
      data: msg.replaceAll(">", "&gt;"),
      permLevel: obj.data.perms ?? 1,
      sender: obj.data.alias ?? "" + processAnon(token),
      expiry: Date.now() + 3600 * 1e3,
      room
    });
    if (obj.status == "SUCCESS")
      supportHandler.sendMsgTo(room, "[" + obj.data.alias + "](" + obj.data.perms + ")" + msg);
    else
      supportHandler.sendMsgTo(room, "[" + processAnon(token) + "](1)" + msg);
    for (let i = 0; i < supportHandler.allRooms.length; i++) {
      if (supportHandler.allRooms[i].name == room) {
        supportHandler.allRooms[i].handler.onMessage(msg, obj.data.alias ?? processAnon(token));
      }
    }
    callback("SUCCESS", null, token);
  });
}
async function sendMsg_B(msg, room) {
  await import_consts.msgDB.insertOne({
    fieldName: "MSG",
    data: msg,
    permLevel: 3,
    sender: "BetaOS_System",
    expiry: Date.now() + 3600 * 1e3,
    room
  });
  supportHandler.sendMsgTo(room, "[BetaOS_System](3)" + msg);
}
function processAnon(token) {
  return "Anonymous user";
}
function roomRequest(token, all = false) {
  if (all)
    return { status: "SUCCESS", data: supportHandler.listAllRooms(), token };
  else
    return { status: "SUCCESS", data: supportHandler.listOnlineRooms(), token };
}
async function createRoom(name, token) {
  if (supportHandler.checkFoundQ(name))
    return { status: "ERROR", data: { error: "Room already exists" }, token };
  let usrData = await (0, import_userRequest.userRequest)(token);
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {
      supportHandler.addRoom(new Room("ONLINE_SUPPORT", name));
      let obj = await import_consts.uDB.findOne({ fieldName: "ROOMS" });
      obj.rooms.push(name);
      await import_consts.uDB.updateOne({ fieldName: "ROOMS" }, {
        $set: {
          rooms: obj.rooms
        }
      }, { upsert: true });
      return { status: "SUCCESS", data: null, token };
    } else
      return { status: "ERROR", data: { error: "Access denied!" }, token };
  } else
    return usrData;
}
async function deleteRoom(name, token) {
  if (!supportHandler.checkFoundQ(name))
    return { status: "ERROR", data: { error: "Room does not exist" }, token };
  let usrData = await (0, import_userRequest.userRequest)(token);
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {
      let obj = await import_consts.uDB.findOne({ fieldName: "ROOMS" });
      let idx = obj.rooms.indexOf(name);
      if (idx >= 0) {
        supportHandler.deleteRoom("ONLINE_SUPPORT", name);
        obj.rooms.splice(idx, 1);
        await import_consts.uDB.updateOne({ fieldName: "ROOMS" }, {
          $set: {
            rooms: obj.rooms
          }
        }, { upsert: true });
        return { status: "SUCCESS", data: null, token };
      } else {
        let idx2 = obj.hidRooms.indexOf(name);
        if (idx2 >= 0) {
          supportHandler.deleteRoom("HIDDEN_SUPPORT", name);
          obj.hidRooms.splice(idx2, 1);
        } else
          return { status: "ERROR", data: { error: "Database inconsistency detected" }, token };
        await import_consts.uDB.updateOne({ fieldName: "ROOMS" }, {
          $set: {
            hidRooms: obj.hidRooms
          }
        }, { upsert: true });
        return { status: "SUCCESS", data: null, token };
      }
    } else
      return { status: "ERROR", data: { error: "Access denied!" }, token };
  } else
    return usrData;
}
function updateActive(name, activeQ) {
  if (activeQ)
    supportHandler.addRoom(new Room("EUPH_ROOM", name));
  else
    supportHandler.deleteRoom("EUPH_ROOM", name);
}
async function WHOIS(token, user) {
  let userData = await import_consts.authDB.findOne({ fieldName: "UserData", user });
  let userData2 = await import_consts.authDB.find({ fieldName: "UserData", alias: user }).toArray();
  let out = [];
  for (let i = 0; i < userData2.length; i++) {
    out.push({
      user: userData2[i].user,
      tasks: userData2[i].tasksCompleted,
      about: userData2[i].aboutme,
      perms: userData2[i].permLevel
    });
  }
  return { status: "SUCCESS", data: { account: {
    perms: userData ? userData.permLevel : "N/A",
    user,
    tasks: userData ? userData.tasksCompleted : "N/A",
    about: userData ? userData.aboutme : "Account not found"
  }, users: out }, token };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Room,
  WHOIS,
  createRoom,
  deleteRoom,
  pseudoConnection,
  roomRequest,
  sendMsg,
  sendMsg_B,
  supportHandler,
  updateActive
});
//# sourceMappingURL=supportRooms.js.map
