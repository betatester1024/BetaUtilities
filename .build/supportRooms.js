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
  delMsg: () => delMsg,
  deleteRoom: () => deleteRoom,
  hidRoom: () => hidRoom,
  loadLogs: () => loadLogs,
  pseudoConnection: () => pseudoConnection,
  purge: () => purge,
  roomRequest: () => roomRequest,
  sendMsg: () => sendMsg,
  sendMsg_B: () => sendMsg_B,
  supportHandler: () => supportHandler,
  updateAbout: () => updateAbout,
  updateActive: () => updateActive,
  updateDefaultLoad: () => updateDefaultLoad
});
module.exports = __toCommonJS(supportRooms_exports);
var import_userRequest = require("./userRequest");
var import_consts = require("./consts");
var import_logging = require("./logging");
var import_webHandler = require("./betautilities/webHandler");
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
  send(thing) {
  }
  close() {
  }
}
;
class supportHandler {
  static allRooms = [];
  static connectionCt = 0;
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
    this.connectionCt++;
    if (internalFlag) {
      token = "[SYSINTERNAL]";
    }
    ev.send(JSON.stringify({ action: "RELOAD" }));
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
        (0, import_userRequest.userRequest)(this.connections[i].tk, this.connections[i].isPseudoConnection).then((obj) => {
          if (obj.status == "SUCCESS") {
            ev.send(JSON.stringify({ action: "addUser", data: { user: obj.data.alias, perms: obj.data.perms } }));
          } else {
            ev.send(JSON.stringify({ action: "addUser", data: { user: processAnon(this.connections[i].tk), perms: 1 } }));
          }
        });
    }
    let thiscn = { id: this.connectionCt, event: ev, roomName: rn, tk: token, readyQ: false, isPseudoConnection: internalFlag };
    this.connections.push(thiscn);
    (0, import_userRequest.userRequest)(token, internalFlag).then((obj) => {
      if (obj.status == "SUCCESS")
        this.sendMsgTo(rn, JSON.stringify({ action: "addUser", data: { user: obj.data.alias, perms: obj.data.perms } }));
      else
        this.sendMsgTo(rn, JSON.stringify({ action: "addUser", data: { user: processAnon(obj.token), perms: 1 } }));
    });
    let roomData = await import_consts.msgDB.findOne({ fieldName: "RoomInfo", room: { $eq: rn } });
    let msgCt = roomData ? roomData.msgCt : 0;
    let threadCt = roomData ? roomData.threadCt ?? 0 : 0;
    ev.send(JSON.stringify({ action: "CONNECTIONID", data: { id: thiscn.id } }));
    if (!thiscn.isPseudoConnection) {
      let text = "";
      let from = threadCt;
      for (let i = 0; i < 5; i++) {
        let resp = await loadLogs(rn, thiscn.id, from, token);
        if (resp.status == "SUCCESS" && resp.data)
          from = resp.data.from;
        if (from < 0)
          break;
      }
      text += "Welcome to BetaOS Services support! Enter any message in the box below. Automated response services and utilities are provided by BetaOS System. Commands are available here: &gt;&gt;commands \nEnter !alias @[NEWALIAS] to re-alias yourself. Thank you for using BetaOS Systems!";
      ev.send(JSON.stringify({ action: "msg", data: { id: +msgCt + 1, sender: "[SYSTEM]", perms: 3, content: text } }));
    }
    thiscn.readyQ = true;
  }
  static async removeConnection(ev, rn, token) {
    let idx = this.connections.findIndex((cn) => cn.event == ev);
    if (idx >= 0)
      this.connections.splice(idx, 1);
    (0, import_userRequest.userRequest)(token).then((obj) => {
      if (obj.status == "SUCCESS")
        this.sendMsgTo(rn, JSON.stringify({ action: "removeUser", data: { user: obj.data.alias, perms: obj.data.perms } }));
      else
        this.sendMsgTo(rn, JSON.stringify({ action: "removeUser", data: { user: processAnon(obj.token), perms: 1 } }));
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
    try {
      for (let i = 0; i < this.allRooms.length; i++) {
        if (this.allRooms[i].name == roomName && this.allRooms[i].type != "EUPH_ROOM")
          return true;
      }
      return false;
    } catch (e) {
      console.log("Error:", e);
    }
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
        this.connections[i].event.send(data);
      }
    }
  }
  static sendMsgTo_ID(connectionID, data) {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].id == connectionID) {
        data = data.replaceAll(">", "&gt;");
        this.connections[i].event.send(data);
      }
    }
  }
}
function sendMsg(msg, room, parent, token, callback) {
  (0, import_userRequest.userRequest)(token).then(async (obj) => {
    let roomData = await import_consts.msgDB.findOne({ fieldName: "RoomInfo", room });
    let msgCt = roomData ? roomData.msgCt : 0;
    let threadCt = roomData ? roomData.threadCt ?? 0 : 0;
    msg = msg.replaceAll("\\n", "\n");
    let parentDoc = await import_consts.msgDB.findOne({ fieldName: "MSG", msgID: Number(parent) });
    await import_consts.msgDB.insertOne({
      fieldName: "MSG",
      data: msg.replaceAll(">", "&gt;"),
      permLevel: obj.data.perms ?? 1,
      sender: obj.data.alias ?? "" + processAnon(token),
      expiry: Date.now() + 3600 * 1e3 * 24 * 30,
      room,
      msgID: msgCt,
      parent,
      threadID: parentDoc ? parentDoc.threadID ?? threadCt : threadCt
    });
    await import_consts.msgDB.updateOne({ room, fieldName: "RoomInfo" }, {
      $inc: { msgCt: 1, threadCt: parentDoc ? 0 : 1 }
    }, { upsert: true });
    if (obj.status == "SUCCESS") {
      supportHandler.sendMsgTo(room, JSON.stringify({ action: "msg", data: { id: msgCt, sender: obj.data.alias, perms: obj.data.perms, parent, content: msg } }));
    } else {
      supportHandler.sendMsgTo(room, JSON.stringify({ action: "msg", data: { id: msgCt, sender: processAnon(token), perms: 1, parent, content: msg } }));
    }
    for (let i = 0; i < supportHandler.allRooms.length; i++) {
      if (supportHandler.allRooms[i].name == room) {
        supportHandler.allRooms[i].handler.onMessage(msg, obj.data.alias ?? processAnon(token));
      }
    }
    callback("SUCCESS", null, token);
  });
}
async function sendMsg_B(msg, room) {
  let roomData = await import_consts.msgDB.findOne({ fieldName: "RoomInfo", room });
  let msgCt = roomData ? roomData.msgCt : 0;
  let betaNick = "";
  for (let i = 0; i < supportHandler.allRooms.length; i++) {
    if (supportHandler.allRooms[i].name == room) {
      betaNick = supportHandler.allRooms[i].handler.displayNick ?? "[BetaOS_ERROR]";
      break;
    }
  }
  console.log(msg);
  await import_consts.msgDB.insertOne({
    fieldName: "MSG",
    data: msg.replaceAll("\\n\\n", "\n").replaceAll(">", "&gt;"),
    permLevel: 3,
    sender: betaNick,
    expiry: Date.now() + 3600 * 1e3 * 24 * 30,
    room,
    msgID: msgCt
  });
  await import_consts.msgDB.updateOne({ room, fieldName: "RoomInfo" }, {
    $inc: { msgCt: 1 }
  }, { upsert: true });
  supportHandler.sendMsgTo(room, JSON.stringify({ action: "msg", data: { id: msgCt, sender: betaNick, perms: 3, content: msg.replaceAll("\\n\\n", "\n") } }));
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
  if (!name.match("^" + import_consts.roomRegex + "$"))
    return { status: "ERROR", data: { error: "Invalid roomname!" }, token };
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {
      new import_webHandler.WebH(name, false);
      let obj = await import_consts.uDB.findOne({ fieldName: "ROOMS" });
      obj.rooms.push(name);
      await import_consts.uDB.updateOne({ fieldName: "ROOMS" }, {
        $set: {
          rooms: obj.rooms
        }
      }, { upsert: true });
      await purge(name, token);
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
  if (!name.match("^" + import_consts.roomRegex + "$"))
    return { status: "ERROR", data: { error: "Invalid roomname!" }, token };
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {
      let obj = await import_consts.uDB.findOne({ fieldName: "ROOMS" });
      await import_consts.msgDB.deleteOne({ fieldName: "RoomInfo", room: name });
      await purge(name, token);
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
  return {
    status: "SUCCESS",
    data: {
      account: {
        perms: userData ? userData.permLevel : "N/A",
        user,
        tasks: userData ? userData.tasksCompleted : "N/A",
        about: userData ? userData.aboutme : "Account not found"
      },
      users: out
    },
    token
  };
}
async function loadLogs(rn, id, from, token) {
  try {
    let roomInfo = await import_consts.msgDB.findOne({ fieldName: "RoomInfo", room: { $eq: rn } });
    let minThreadID = roomInfo.minThreadID ?? 0;
    from = +from;
    if (from + 1 < minThreadID) {
      supportHandler.sendMsgTo_ID(id, JSON.stringify({ action: "LOADCOMPLETE", data: { id: -1 } }));
      return { status: "SUCCESS", data: { from: -1 }, token };
    }
    let msgs = await import_consts.msgDB.find({ fieldName: "MSG", room: { $eq: rn }, threadID: { $gt: from - 5, $lte: from } }).sort({ threadID: -1, msgID: 1 }).toArray();
    for (let i = 0; i < msgs.length; i++) {
      let dat = JSON.stringify({ action: "msg", data: { id: "-" + msgs[i].msgID, sender: msgs[i].sender, perms: msgs[i].permLevel, parent: msgs[i].parent ?? -1, content: msgs[i].data } });
      supportHandler.sendMsgTo_ID(id, dat);
    }
    supportHandler.sendMsgTo_ID(id, JSON.stringify({ action: "LOADCOMPLETE", data: { id: from - 5 } }));
    return { status: "SUCCESS", data: { from: from - 5 }, token };
  } catch (e) {
    console.log("Error:", e);
    return { status: "ERROR", data: { error: e }, token };
  }
}
async function delMsg(id, room, token) {
  try {
    if (!supportHandler.checkFoundQ(room))
      return { status: "ERROR", data: { error: "Room does not exist" }, token };
    let usrData = await (0, import_userRequest.userRequest)(token);
    if (usrData.status != "SUCCESS")
      return usrData;
    if (usrData.perms < 2)
      return { status: "ERROR", data: { error: "Insufficient permissions!" }, token };
    await import_consts.msgDB.deleteOne({ fieldName: "MSG", msgID: Number(id), room });
    supportHandler.sendMsgTo(room, JSON.stringify({ action: "delMsg", data: { id: Number(id) } }));
    return { status: "SUCCESS", data: null, token };
  } catch (e) {
    console.log("Error:", e);
  }
}
async function updateDefaultLoad(name, token) {
  try {
    let usrData = await (0, import_userRequest.userRequest)(token);
    if (usrData.status != "SUCCESS")
      return usrData;
    if (usrData.data.perms < 3)
      return { status: "ERROR", data: { error: "Insufficient permissions!" }, token };
    for (let i = 0; i < name.length; i++) {
      if (!name[i].match("^" + import_consts.roomRegex + "$"))
        return { status: "ERROR", data: { error: "Invalid room-name(s)" }, token };
    }
    await import_consts.uDB.updateOne({ fieldName: "ROOMS" }, {
      $set: {
        euphRooms: name
      }
    });
    return { status: "SUCCESS", data: null, token };
  } catch (e) {
    console.log("Error:", e);
  }
}
async function hidRoom(name, token) {
  try {
    console.log(name);
    if (supportHandler.checkFoundQ(name))
      return { status: "ERROR", data: { error: "Room already exists" }, token };
    let usrData = await (0, import_userRequest.userRequest)(token);
    if (!name.match("^" + import_consts.roomRegex + "$"))
      return { status: "ERROR", data: { error: "Invalid roomname!" }, token };
    if (usrData.status == "SUCCESS") {
      if (usrData.data.perms >= 2) {
        new import_webHandler.WebH(name, false);
        let obj = await import_consts.uDB.findOne({ fieldName: "ROOMS" });
        obj.hidRooms.push(name);
        await import_consts.uDB.updateOne({ fieldName: "ROOMS" }, {
          $set: {
            hidRooms: obj.hidRooms
          }
        }, { upsert: true });
        await purge(name, token);
        return { status: "SUCCESS", data: null, token };
      } else
        return { status: "ERROR", data: { error: "Access denied!" }, token };
    } else
      return usrData;
  } catch (e) {
    console.log("Error:", e);
  }
}
async function purge(name, token) {
  try {
    if (!supportHandler.checkFoundQ(name))
      return { status: "ERROR", data: { error: "Room does not exist" }, token };
    let usrData = await (0, import_userRequest.userRequest)(token);
    if (usrData.status != "SUCCESS")
      return usrData;
    if (usrData.data.perms < 2)
      return { status: "ERROR", data: { error: "Insufficient permissions!" }, token };
    await import_consts.msgDB.deleteMany({ fieldName: "MSG", room: name });
    await import_consts.msgDB.updateOne({ fieldName: "RoomInfo", room: name }, {
      $set: {
        msgCt: 0,
        minCt: 0,
        threadCt: 0,
        minThreadID: 0
      }
    }, { upsert: true });
    supportHandler.sendMsgTo(name, JSON.stringify({ action: "RESTART" }));
    return { status: "SUCCESS", data: null, token };
  } catch (e) {
    console.log("Error:", e);
  }
}
async function updateAbout(about, token) {
  let usrData = await (0, import_userRequest.userRequest)(token);
  if (usrData.status != "SUCCESS")
    return usrData;
  await import_consts.authDB.updateOne({ fieldName: "UserData", user: usrData.data.user }, {
    $set: {
      aboutme: about
    }
  });
  return { status: "SUCCESS", data: null, token };
}
async function loadThread(room, parentID, isParentQ) {
  let thisMsg;
  if (isParentQ) {
    thisMsg = await import_consts.msgDB.findOne({ fieldName: "MSG", msgID: parentID, $or: [{ parent: -1 }, { parent: { $exists: false } }], room });
    if (!thisMsg)
      return [];
  }
  let children = await import_consts.msgDB.find({
    fieldName: "MSG",
    parent: isParentQ ? thisMsg.msgID : parentID,
    room
  }).toArray();
  if (isParentQ && children.length == 0)
    return [thisMsg];
  for (let i = 0; i < children.length; i++) {
    let newChildren = await loadThread(room, children[i].msgID, false);
    for (let j = 0; j < newChildren.length; j++) {
      children.push(newChildren[j]);
    }
  }
  if (isParentQ) {
    children.unshift(thisMsg);
  }
  return children;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Room,
  WHOIS,
  createRoom,
  delMsg,
  deleteRoom,
  hidRoom,
  loadLogs,
  pseudoConnection,
  purge,
  roomRequest,
  sendMsg,
  sendMsg_B,
  supportHandler,
  updateAbout,
  updateActive,
  updateDefaultLoad
});
//# sourceMappingURL=supportRooms.js.map
