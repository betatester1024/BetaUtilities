import { userRequest } from './userRequest';
import { msgDB, authDB, uDB, roomRegex } from './consts';
import { log } from './logging'
// import { minID } from './database';
import {WebSocket} from 'ws';
import {realias} from './updateUser';
import { WebH } from './betautilities/webHandler';
const cookie = require('cookie');
export class Room {
  type: string;
  name: string;
  handler: WebH | null;
  constructor(type: string, name: string, handler: WebH | null = null) {
    // console.log(handler);
    this.type = type;
    this.name = name;
    this.handler = handler;
  };

}

export class BridgeSocket 
{
  euphSocket: WebSocket;
  client: WebSocket;
  token:string;
  roomName:string;
  setNick:boolean = false;
  onOpen() {
    // console.log("bridgeSocket was opened")
    this.client.send(JSON.stringify({action:"RELOAD"}));
    this.setNick = false;
  }

  loadLogs(before:string) {
    // let usrData = await userRequeest(token);
    this.euphSocket.send(JSON.stringify({type:"log", data:{n:100, before:before}}))
    // this.client.send(JSON.stringify({
      // action:"yourAlias",
      // data:{alias:usrData.data.alias}
    // }))
  }

  sendMsg(room:string, parent:string, content:string) {
    this.euphSocket.send(JSON.stringify({
      type:"send", 
      id:parent=="-1"?"requiresAutoThreading":null, 
      data:{
        content:content, 
        parent:(parent=="-1"?null:parent)
      }
    }))
  }
  
  async onMessage(msg:string) {
    let dat = JSON.parse(msg);
    // console.log(dat);
    let usrData = await userRequest(this.token);
    if (usrData.status != "SUCCESS") usrData = {data:{alias:"AnonymousBridgeUser", perms:0}};
    if (!this.setNick) {
      this.setNick = true;
      this.euphSocket.send(JSON.stringify({
        type:"nick",
        data:{name:usrData.data.alias}
      }))
    }
    switch(dat.type) {
      case "ping-event":
        this.euphSocket.send(JSON.stringify({type:"ping-reply", data:{time:dat.data.time}}));
        break;
      case "snapshot-event":
        for (let i=0; i<dat.data.listing.length; i++) {
          // console.log(dat.data.log[i]);
          if (!dat.data.listing[i].name) continue;
          this.client.send(JSON.stringify({action:"addUser", data:{
            user:dat.data.listing[i].name, 
            isBot:dat.data.listing[i].id.match(/^bot:/)!=null}
          }));
        }
        for (let i=0; i<dat.data.log.length; i++) {
          this.client.send(JSON.stringify({
            action:"msg",
            data:{
              id:dat.data.log[i].id,
              parent:dat.data.log[i].parent,
              sender:dat.data.log[i].sender.name,
              time:dat.data.log[i].time,
              perms: usrData.data.perms,
              content:dat.data.log[i].content,
            }
          }))
        }
        break;
      case "log-reply":
        // console.log(dat);
        dat.data.log.sort((a:{time:number}, b:{time:number})=>{return b.time-a.time;});
        for (let i=0; i<dat.data.log.length; i++) 
        {
          // console.log(dat.data.log[i].time);
          this.client.send(JSON.stringify({
            action:"msg",
            data:{
              id:"-"+dat.data.log[i].id,
              parent:dat.data.log[i].parent,
              sender:dat.data.log[i].sender.name,
              time:dat.data.log[i].time,
              perms: usrData.data.perms,
              content:dat.data.log[i].content,
            }
          }));
        }
        this.client.send(JSON.stringify({
          action:"LOADCOMPLETE", 
          data:{
            id:dat.data.log.length<100?"-1":"randomthing"
          }
        }));
        break;
      case "send-event":
      case "send-reply":
        this.client.send(JSON.stringify({
          action:"msg",
          data:{
            id:dat.data.id,
            parent:dat.data.parent,
            sender:dat.data.sender.name,
            time:dat.data.time,
            recentQ:Date.now() - dat.data.time < 60000,
            perms: usrData.data.perms,
            content:dat.data.content,
          }
        }));
        console.log(dat.id);
        if (dat.id == "requiresAutoThreading") {
          this.client.send(JSON.stringify({
            action:"autoThreading",
            data:{id:dat.data.id}
          }));
        }
        break;
      case "nick-event":
        this.client.send(JSON.stringify({
          action:"removeUser",
          data:{
            isBot:dat.data.id.match(/^bot:/)!=null,
            user:dat.data.from
          }
        }))
        this.client.send(JSON.stringify({
          action:"addUser",
          data:{
            user:dat.data.to,
            isBot:dat.data.id.match(/^bot:/)!=null
          }
        }))
        // this.client.send(JSON.stringify({
        //   action:"yourAlias",
        //   data:{alias:usrData.data.alias}
        // }))
        break;
      case "hello-event":
        // console.log(req);
        if (dat.data.session.id.match(/^bot:/)) {
          // don't do this perhaps
          // this.euphSocket.send(JSON.stringify({
          //   type:"login",
          //   data:{
          //     namespace:"email",
          //     id:process.env["euphEmail"],
          //     password:process.env["euphPassword"]
          //   }
          // }));
        }
        this.client.send(JSON.stringify({
          action:"addUser",
          data:{
            user:usrData.data.alias,
            isBot:dat.data.session.id.match(/^bot:/)!=null
          }
        }))
        this.client.send(JSON.stringify({
          action:"yourAlias",
          data:{alias:usrData.data.alias}
        }))
        break;
      case "disconnect-event":
        // const cookies = 
        break;
        this.euphSocket= new WebSocket("wss://euphoria.io/room/"+this.roomName+"/ws",
           [],
           {
             finishRequest:(request:any)=>{
               request.addEventListener('response', (res)=>{
                 console.log(res);
               })
               request.end();
             }
           });
        //   [],
        //   {
        //     'headers': {'Cookie': cookie.serialize('a', '496E66DD')}
        //   });
        
        this.euphSocket.on('open', this.onOpen.bind(this));
        this.euphSocket.on('message', this.onMessage.bind(this));
        // this.client.on('close', this.onClientClose.bind(this));
        this.euphSocket.on('error', (e:any)=>{this.euphSocket.close(1000, "");})
      case "login-reply":
        console.log(dat);
        break;
      case "join-event":
        this.client.send(JSON.stringify({
          action:"addUser",
          data:{
            user:dat.data.name,
            isBot:dat.data.id.match(/^bot:/)!=null
          }
        }))
        break;
      case "part-event":
        this.client.send(JSON.stringify({
          action:"removeUser",
          data:{
            user:dat.data.name,
            isBot:dat.data.id.match(/^bot:/)!=null
          }
        }));
        break;
      default: 
        console.log(dat.type)
        // scream.
        console.log(dat);
    }
  }

  async updateAlias(alias:string, token) {
    if (alias.length == 0 || alias.length > 36) return;
    let usrData = await userRequest(token);
    let updateAliasRes = await realias(alias, token);
    this.euphSocket.send(JSON.stringify({
      type:"nick",
      data:{name:alias}
    }));
  
    // console.log("here we are");
    // if (updateAliasRes.status != "SUCCESS") {
      // return;
    // }
    // screw it, we realias it anyways!
    // console.log("alias update was a success");
    this.client.send(JSON.stringify({
      action:"removeUser",
      data:{
        user:usrData.data.alias
      }
    }));
    this.client.send(JSON.stringify({
      action:"addUser",
      data:{
        user:alias,
        isBot:true
      }
    }))
    this.client.send(JSON.stringify({
      action:"yourAlias",
      data:{alias:alias}
    }))
    // return {status:"SUCCESS", data:null, token:token};
  }

  onClientClose() {
    console.log("clientClosed");
    this.euphSocket.close(1000, "");
  }
  constructor(roomName:string, socket:WebSocket, token:string) 
  {
    console.log(roomName);
    this.roomName = roomName;
    this.client = socket;
    this.token=token;
    let URL = "wss://euphoria.io/room/"+roomName+"/ws";
    this.euphSocket = new WebSocket(URL);
    this.euphSocket.on('open', this.onOpen.bind(this));
    this.euphSocket.on('message', this.onMessage.bind(this));
    // this.client.on('close', this.onClientClose.bind(this));
    this.euphSocket.on('error', (e:any)=>{this.euphSocket.close(1000, "");})
  }
}

export class pseudoConnection {
  send(thing: any) { }
  close() { }
};

export class supportHandler {
  static allRooms: Room[] = [];
  static connectionCt = 0;
  static connections: { event: any, roomName: string, tk: string, readyQ: boolean, isPseudoConnection: boolean, minThreadID:number}[] = [];
  static addRoom(rm: Room) {
    // log("Room created!" + rm)
    let idx = this.allRooms.findIndex((r: any) => { return r.type == rm.type && r.name == rm.name });
    if (idx >= 0) return;
    else this.allRooms.push(rm);
  }
  static deleteRoom(type: string, roomName: string) {
    log("Room deleted!" + type + roomName);
    let idx = this.allRooms.findIndex((r: any) => { return r.type == type && r.name == roomName });
    if (idx >= 0) this.allRooms.splice(idx, 1);
  }
  static async addConnection(ev: any, rn: string, token: string, internalFlag: boolean = false) {
    // send existing connections to THIS EVENT ONLY
    this.connectionCt++;
    if (internalFlag) {
      token = "[SYSINTERNAL]";
    }
    ev.send(JSON.stringify({ action: "RELOAD" }));
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
        userRequest(this.connections[i].tk, this.connections[i].isPseudoConnection).then((obj: { status: string, data: any, token: string }) => {
          if (obj.status == "SUCCESS") {
            ev.send(JSON.stringify({ action: "addUser", data: { user: obj.data.alias, perms: obj.data.perms, isBot:this.connections[i].isPseudoConnection } }));
          }
          else {
            ev.send(JSON.stringify({ action: "addUser", data: { user: processAnon(this.connections[i].tk), perms: 1 } }));
          }
        });
    }
    // add NEW CONNECTION
    let thiscn = { id: this.connectionCt, event: ev, roomName: rn, tk: token, readyQ: false, isPseudoConnection: internalFlag };
    this.connections.push(thiscn);
    // TELL EVERYONE ELSE ABOUT THE NEW CONNECTION
    userRequest(token, internalFlag).then((obj: { status: string, data: any, token: string }) => {
      if (obj.status == "SUCCESS") this.sendMsgTo(rn, JSON.stringify({ action: "addUser", data: { user: obj.data.alias, perms: obj.data.perms } }));
      else this.sendMsgTo(rn, JSON.stringify({ action: "addUser", data: { user: processAnon(obj.token), perms: 1 } }));
    });
    // console.log("added connection in "+rn);
    let roomData = await msgDB.findOne({ fieldName: "RoomInfo", room: { $eq: rn } });
    let msgCt = roomData ? roomData.msgCt : 0;
    let threadCt = roomData ? (roomData.threadCt??0) : 0;
    // let msgs = await msgDB.find({fieldName:"MSG", room:{$eq:rn}, msgID:{$gt: msgCt-30}}).toArray();
    // let threads = await msgDB.find({fieldName:"MSG", room:{$eq:rn}, $or:[{parent:-1}, {parent:{$exists:false}}]}).limit(20).toArray();
    ev.send(JSON.stringify({ action: "CONNECTIONID", data: { id: thiscn.id } }));
    if (!thiscn.isPseudoConnection) {
      let text = "";
      // // let lastLoadedThread = 0;
      // let loadedCt = 0, j = msgCt;
      // while (loadedCt < 30 && j >=0) {
      //   let msgs = await loadThread(rn, j, true);
      //   // console.log("msgs:", msgs);
      //   if (msgs.length == 0) {
      //     // console.log("message %d is not a parent thread", j)
      //   }
      //   else {
      //     loadedCt++;
      //     thiscn.minThreadID = msgs[0].msgID; // parent message ID
      //     // console.log("loaded", msgs.length, "in room", rn);
      //   }
      //   for (let i = 0; i < msgs.length; i++) {
      //     if (msgs[i])
      //     ev.send(JSON.stringify({ action: "msg", data: { id: "-"+msgs[i].msgID, sender: msgs[i].sender, perms: msgs[i].permLevel, parent: msgs[i].parent ?? -1, content: msgs[i].data } }));
      //   }
      //   j--;
      // }
      // load 30 threads
      let from = threadCt;
      for (let i=0; i<5; i++) 
      {
        let resp = await loadLogs(rn, thiscn.id, from, token);
        if (resp.status == "SUCCESS" && resp.data) from = resp.data.from;
        if (from < 0) break;
        // console.log(resp.data.from)
      }
      // for (let i=0; i<threads.length; i++) {
      //   ev.send(JSON.stringify({action:"msg", data:{id:threads[i].msgID??-1, sender:threads[i].sender, perms: threads[i].permLevel, parent: threads[i].parent??-1, content:threads[i].data}}));
      // }
      // for (let i=0; i<msgs.length; i++) {
      //   ev.send(JSON.stringify({action:"msg", data:{id:msgs[i].msgID??-1, sender:msgs[i].sender, perms: msgs[i].permLevel, parent: msgs[i].parent??-1, content:msgs[i].data}}));
      // }
      text += "Welcome to BetaOS Services support! Enter any message in the box below. " +
        "Automated response services and utilities are provided by BetaOS System. " +
        "Commands are available here: &gt;&gt;commands \n" +
        "Enter !alias @[NEWALIAS] to re-alias yourself. Thank you for using BetaOS Systems!"
      ev.send(JSON.stringify({ action: "msg", data: { id: +msgCt + 1, sender: "[SYSTEM]", perms: 3, content: text } }));

    }
    thiscn.readyQ = true;
  }
  static async removeConnection(ev: any, rn: string, token: string) {
    let idx = this.connections.findIndex((cn: any) => cn.event == ev);
    if (idx >= 0) this.connections.splice(idx, 1);

    userRequest(token).then((obj: { status: string, data: any, token: string }) => {
      if (obj.status == "SUCCESS") this.sendMsgTo(rn, JSON.stringify({ action: "removeUser", data: { user: obj.data.alias, perms: obj.data.perms } }));
      else this.sendMsgTo(rn, JSON.stringify({ action: "removeUser", data: { user: processAnon(obj.token), perms: 1 } }));
      // console.log("removed connection in "+rn); 
    });
  }

  static listRooms(euphOnlyQ: boolean, onlineOnlyQ: boolean) {
    if (euphOnlyQ) {
      return this.listEuphRooms();
    }
    else if (onlineOnlyQ) {
      return this.listOnlineRooms();
    }
    else {
      return this.listAllRooms();
    }
  }

  static listAllRooms() {
    let out = [];
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].type == "HIDDEN_SUPPORT") continue;
      out.push(this.getPrefix(this.allRooms[i].type) + this.allRooms[i].name);
    }
    return out;
  }

  static listEuphRooms() {
    let out = [];
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].type != "EUPH_ROOM") continue;
      out.push(this.getPrefix(this.allRooms[i].type) + this.allRooms[i].name);
    }
    return out;
  }

  static listOnlineRooms() {
    let out = [];
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].type != "ONLINE_SUPPORT") continue;
      out.push(this.getPrefix(this.allRooms[i].type) + this.allRooms[i].name);
    }
    return out;
  }

  static getPrefix(type: string) {
    switch (type) {
      case 'EUPH_ROOM': return "&";
      case 'ONLINE_SUPPORT': return "#";
      default: return "??";
    }
  }

  static checkFoundQ(roomName: string) {
    try {
      for (let i = 0; i < this.allRooms.length; i++) {
        if (this.allRooms[i].name == roomName && this.allRooms[i].type != "EUPH_ROOM") return true;
      }
      return false;
    } catch (e: any) {
      console.log("Error:", e);
    }
  }

  static mitoseable(roomName: string) {
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName && this.allRooms[i].type == "EUPH_ROOM") return true;
    }
    return false;
  }
  static sendMsgTo(roomName: string, data: string) {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].roomName == roomName) {
        // encode '>' -- used for message-breaks (yes, it is stupid.)
        data = data.replaceAll(">", "&gt;");
        // console.log(data);
        this.connections[i].event.send(data);
      }
    }

  }

  static sendMsgTo_ID(connectionID: number, data: string) {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].id == connectionID) {
        // encode '>' -- used for message-breaks (yes, it is stupid.)
        data = data.replaceAll(">", "&gt;");
        // console.log(data);
        this.connections[i].event.send(data);

      }
    }
  }
}

export function sendMsg(msg: string, room: string, parent: number, token: string, callback: (status: string, data: any, token: string) => any) {
  userRequest(token).then(async (obj: { status: string, data: any, token: string }) => {
    let roomData = await msgDB.findOne({ fieldName: "RoomInfo", room: room });
    let msgCt = roomData ? roomData.msgCt : 0;
    let threadCt = roomData ? (roomData.threadCt??0) : 0;
    msg = msg.replaceAll("\\n", "\n");
    let parentDoc = await msgDB.findOne({fieldName:"MSG", msgID:Number(parent)});
    // if (parentDoc) console.log(threadCt);
    await msgDB.insertOne({
      fieldName: "MSG", data: msg.replaceAll(">", "&gt;"), permLevel: obj.data.perms ?? 1,
      sender: obj.data.alias ?? "" + processAnon(token), expiry: Date.now() + 3600 * 1000 * 24 * 30,
      room: room, msgID: msgCt, parent:parent, threadID: parentDoc?(parentDoc.threadID??threadCt):threadCt
    });

    await msgDB.updateOne({ room: room, fieldName: "RoomInfo" }, {
      $inc: { msgCt: 1, threadCt:parentDoc?0:1}
    }, { upsert: true });
    if (obj.status == "SUCCESS") {
      supportHandler.sendMsgTo(room, JSON.stringify({ action: "msg", data: { id: msgCt, sender: obj.data.alias, perms: obj.data.perms, parent: parent, content: msg } }));
    }
    else {
      //console.log("sending")
      supportHandler.sendMsgTo(room, JSON.stringify({ action: "msg", data: { id: msgCt, sender: processAnon(token), perms: 1, parent: parent, content: msg } }));
    }
    //console.log(supportHandler.allRooms);
    // console.log(supportHandler.allRooms);
    for (let i = 0; i < supportHandler.allRooms.length; i++) {
      if (supportHandler.allRooms[i].name == room && supportHandler.allRooms[i].type == "ONLINE_SUPPORT") {
        // console.log(supportHandler.allRooms[i].handler)
        supportHandler.allRooms[i].handler.onMessage(msg, obj.data.alias ?? processAnon(token))
      }

    }
    callback("SUCCESS", null, token);
  });
}

export async function sendMsg_B(msg: string, room: string) {
  let roomData = await msgDB.findOne({ fieldName: "RoomInfo", room: room });
  let msgCt = roomData ? roomData.msgCt : 0;
  let threadCt = roomData ? (roomData.threadCt??0) : 0;
  let betaNick = "";
  for (let i = 0; i < supportHandler.allRooms.length; i++) {
    if (supportHandler.allRooms[i].name == room && supportHandler.allRooms[i].type == "ONLINE_SUPPORT") {
      // console.log("sending"+msg);
      betaNick = supportHandler.allRooms[i].handler.displayNick ?? "[BetaOS_ERROR]";
      break;
    }
  }
  await msgDB.updateOne({ room: room, fieldName: "RoomInfo" }, {
    $inc: { msgCt: 1, threadCt:1}
  }, { upsert: true });
  console.log(msg);
  await msgDB.insertOne({
    fieldName: "MSG", data: msg.replaceAll("\\n\\n", "\n").replaceAll(">", "&gt;"), permLevel: 3,
    sender: betaNick, expiry: Date.now() + 3600 * 1000 * 24 * 30,
    room: room, msgID: msgCt, parent:-1, threadID: threadCt
  });
  await msgDB.updateOne({ room: room, fieldName: "RoomInfo" }, {
    $inc: { msgCt: 1 }
  }, { upsert: true });
  supportHandler.sendMsgTo(room, JSON.stringify({ action: "msg", data: { id: msgCt, sender: betaNick, perms: 3, content: msg.replaceAll("\\n\\n", "\n") } }));
}

function processAnon(token: string) {
  return "Anonymous user";
}

export function roomRequest(token: string, all: boolean = false) {
  if (all) return { status: "SUCCESS", data: supportHandler.listAllRooms(), token: token };
  else return { status: "SUCCESS", data: supportHandler.listOnlineRooms(), token: token };
}

export async function createRoom(name: string, token: string) {
  if (supportHandler.checkFoundQ(name)) return { status: "ERROR", data: { error: "Room already exists" }, token: token };
  let usrData = await userRequest(token) as { status: string, data: { perms: number } };
  if (!name.match("^" + roomRegex + "$")) return { status: "ERROR", data: { error: "Invalid roomname!" }, token: token };
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {

      // supportHandler.addRoom(new Room("ONLINE_SUPPORT", name));
      new WebH(name, false);
      let obj = await uDB.findOne({ fieldName: "ROOMS" });
      obj.rooms.push(name);
      await uDB.updateOne({ fieldName: "ROOMS" }, {
        $set: {
          rooms: obj.rooms
        },
      }, { upsert: true });
      await purge(name, token); // also initialises the room info
      return { status: "SUCCESS", data: null, token: token }
    }
    else return { status: "ERROR", data: { error: "Access denied!" }, token: token };
  }
  else return usrData;
}

export async function deleteRoom(name: string, token: string) {
  if (!supportHandler.checkFoundQ(name)) return { status: "ERROR", data: { error: "Room does not exist" }, token: token };
  let usrData = await userRequest(token) as { status: string, data: { perms: number } };
  if (!name.match("^" + roomRegex + "$")) return { status: "ERROR", data: { error: "Invalid roomname!" }, token: token };
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {

      let obj = await uDB.findOne({ fieldName: "ROOMS" })
      await msgDB.deleteOne({ fieldName: "RoomInfo", room: name });
      await purge(name, token)
      let idx = obj.rooms.indexOf(name);
      if (idx >= 0) {
        supportHandler.deleteRoom("ONLINE_SUPPORT", name);
        obj.rooms.splice(idx, 1);
        await uDB.updateOne({ fieldName: "ROOMS" }, {
          $set: {
            rooms: obj.rooms
          },
        }, { upsert: true });
        return { status: "SUCCESS", data: null, token: token }
      }
      else {
        let idx = obj.hidRooms.indexOf(name);
        if (idx >= 0) {
          supportHandler.deleteRoom("HIDDEN_SUPPORT", name);
          obj.hidRooms.splice(idx, 1);
        }
        else return { status: "ERROR", data: { error: "Database inconsistency detected" }, token: token };
        await uDB.updateOne({ fieldName: "ROOMS" }, {
          $set: {
            hidRooms: obj.hidRooms
          },
        }, { upsert: true });
        return { status: "SUCCESS", data: null, token: token }
      }
    }
    else return { status: "ERROR", data: { error: "Access denied!" }, token: token };
  }
  else return usrData;
}

export function updateActive(name: string, activeQ: boolean) {
  if (activeQ) supportHandler.addRoom(new Room("EUPH_ROOM", name));
  else supportHandler.deleteRoom("EUPH_ROOM", name);
}

export async function WHOIS(token: string, user: string) {
  let userData = await authDB.findOne({ fieldName: "UserData", user: user });
  let userData2 = await authDB.find({ fieldName: "UserData", alias: user }).toArray();
  let out = [];
  for (let i = 0; i < userData2.length; i++) {
    out.push({
      user: userData2[i].user,
      tasks: userData2[i].tasksCompleted,
      about: userData2[i].aboutme,
      perms: userData2[i].permLevel
    })
  }
  return {
    status: "SUCCESS", data: {
      account: {
        perms: userData ? userData.permLevel : "N/A",
        user: user,
        tasks: userData ? userData.tasksCompleted : "N/A",
        about: userData ? userData.aboutme : "Account not found"
      }, users: out
    }, token: token
  };
}

// async function loadEuphLogs(rn:string, from:number) {
  
// };
//loadLogs(data.room, data.id, data.from token)
export async function loadLogs(rn: string, id: number, from: number, isBridge:boolean, token: string) {
  // if (isBridge) {await loadEuphLogs(rn, id, from); return;}
  try {
    // let j = -1;
    // let thiscn;
    let roomInfo = await msgDB.findOne({ fieldName: "RoomInfo", room: { $eq: rn } });
    let minThreadID = roomInfo.minThreadID??0;
    // for (let i = 0; i < supportHandler.connections.length; i++) 
    //   if (supportHandler.connections[i].id == id) {
    //     j = supportHandler.connections[i].minThreadID;
    //     thiscn = supportHandler.connections[i];
    //     // supportHandler.connections[i].minThreadID+=5;
    //     break;
    //   }
    
    // let loadedCt = 0;
    // while (loadedCt < 5 && j >=roomInfo.minCt && j <= roomInfo.msgCt) {
    //   let msgs = await loadThread(rn, j, true);
    //   // console.log("msgs:", msgs);
    //   if (msgs.length == 0) {
    //     // console.log("message %d is not a parent thread", j)
    //   }
    //   else {
    //     loadedCt++;
    //     thiscn.minThreadID = Math.min(thiscn.minThreadID, msgs[0].msgID); // parent message ID
    //     // console.log("loaded", msgs.length, "in room", rn);
    //   }
    //   for (let i = 0; i < msgs.length; i++) {
    //     if (msgs[i])
    //     supportHandler.sendMsgTo_ID(id, JSON.stringify({ action: "msg", data: { id: "-"+msgs[i].msgID, sender: msgs[i].sender, perms: msgs[i].permLevel, parent: msgs[i].parent ?? -1, content: msgs[i].data } }));
    //   }
    //   j--;
    // }
    // if (loadedCt < 5) supportHandler.sendMsgTo_ID(id, JSON.stringify({ action: "LOADCOMPLETE", data: { id: -1 } }));
    // else supportHandler.sendMsgTo_ID(id, JSON.stringify({ action: "LOADCOMPLETE", data: { id: 1} })); // nonsense value, unused now
    // return {status:"SUCCESS", data:null, token:token}
    from = +from;
    // console.log("LOADING LOGS FROM", from - 5, "TO", from, roomInfo.minThreadID);
    if (from+1 < minThreadID) {
      supportHandler.sendMsgTo_ID(id, JSON.stringify({ action: "LOADCOMPLETE", data: { id: -1 } }));
      return { status: "SUCCESS", data: {from:-1}, token: token }
    }
    let msgs = await msgDB.find({ fieldName: "MSG", room: { $eq: rn }, threadID: { $gt: from - 5, $lte: from } }).sort({threadID:-1, msgID:1}).toArray();
    for (let i = 0; i <msgs.length; i++) {
      // console.log("thread id %d msgid %d content %s", msgs[i].threadID, msgs[i].msgID, msgs[i].data);
      let dat = JSON.stringify({ action: "msg", data: { id: "-" + msgs[i].msgID, sender: msgs[i].sender, perms: msgs[i].permLevel, parent: msgs[i].parent ?? -1, content: msgs[i].data } });
      // console.log(dat);
      supportHandler.sendMsgTo_ID(id, dat);
    }
    // console.log("LOADING COMPLETE, LOADED" + msgs.length, "MESSAGES");
    supportHandler.sendMsgTo_ID(id, JSON.stringify({ action: "LOADCOMPLETE", data: { id: from - 5 } }));
    return { status: "SUCCESS", data: {from:from-5}, token: token };
  } catch (e: any) {
    console.log("Error:", e);
    return {status:"ERROR", data:{error:e}, token:token};
  }
} // loadLogs

export async function delMsg(id: string, room: string, token: string) {
  try {
    // console.log({fieldName:"MSG", msgID:id, room:room});
    if (!supportHandler.checkFoundQ(room)) return { status: "ERROR", data: { error: "Room does not exist" }, token: token };
    let usrData = await userRequest(token) as { status: string, data: { perms: number } };
    if (usrData.status != "SUCCESS") return usrData;
    if (usrData.perms < 2) return { status: "ERROR", data: { error: "Insufficient permissions!" }, token: token };
    await msgDB.deleteOne({ fieldName: "MSG", msgID: Number(id), room: room });
    supportHandler.sendMsgTo(room, JSON.stringify({ action: "delMsg", data: { id: Number(id) } }));
    return { status: "SUCCESS", data: null, token: token };
  } catch (e: any) {
    console.log("Error:", e);
  }
}

export async function updateDefaultLoad(name: string[], token: string) {
  try {
    let usrData = await userRequest(token) as { status: string, data: { perms: number } };
    if (usrData.status != "SUCCESS") return usrData;
    // console.log(usrData.data.perms);
    if (usrData.data.perms < 3) return { status: "ERROR", data: { error: "Insufficient permissions!" }, token: token };
    for (let i = 0; i < name.length; i++) {
      if (!name[i].match("^" + roomRegex + "$")) return { status: "ERROR", data: { error: "Invalid room-name(s)" }, token: token }
    }
    await uDB.updateOne({ fieldName: "ROOMS" }, {
      $set: {
        euphRooms: name
      }
    });
    return { status: "SUCCESS", data: null, token: token };
  } catch (e: any) {
    console.log("Error:", e);
  }
}

export async function hidRoom(name: string, token: string) {
  try {
    console.log(name);
    if (supportHandler.checkFoundQ(name)) return { status: "ERROR", data: { error: "Room already exists" }, token: token };
    let usrData = await userRequest(token) as { status: string, data: { perms: number } };
    if (!name.match("^" + roomRegex + "$")) return { status: "ERROR", data: { error: "Invalid roomname!" }, token: token };
    if (usrData.status == "SUCCESS") {
      if (usrData.data.perms >= 2) {

        // supportHandler.addRoom(new Room("ONLINE_SUPPORT", name));
        new WebH(name, false);
        let obj = await uDB.findOne({ fieldName: "ROOMS" });
        obj.hidRooms.push(name);
        await uDB.updateOne({ fieldName: "ROOMS" }, {
          $set: {
            hidRooms: obj.hidRooms
          },
        }, { upsert: true });
        await purge(name, token); // also initialises the room info
        return { status: "SUCCESS", data: null, token: token }
      }
      else return { status: "ERROR", data: { error: "Access denied!" }, token: token };
    }
    else return usrData;
  } catch (e: any) {
    console.log("Error:", e);
  }
}

export async function purge(name: string, token: string) {
  try {
    if (!supportHandler.checkFoundQ(name)) return { status: "ERROR", data: { error: "Room does not exist" }, token: token };
    let usrData = await userRequest(token) as { status: string, data: { perms: number } };
    if (usrData.status != "SUCCESS") return usrData;
    // console.log(usrData.data.perms);
    if (usrData.data.perms < 2) return { status: "ERROR", data: { error: "Insufficient permissions!" }, token: token };

    await msgDB.deleteMany({ fieldName: "MSG", room: name });
    await msgDB.updateOne({ fieldName: "RoomInfo", room: name }, {
      $set: {
        msgCt: 0,
        minCt: 0,
        threadCt:0,
        minThreadID:0
      }
    }, {upsert:true})
    supportHandler.sendMsgTo(name, JSON.stringify({ action: "RESTART" }));
    return { status: "SUCCESS", data: null, token: token };
  } catch (e: any) {
    console.log("Error:", e);
  }
}

export async function updateAbout(about: string, token: string) {
  let usrData = await userRequest(token) as { status: string, data: { perms: number } };
  if (usrData.status != "SUCCESS") return usrData;
  await authDB.updateOne({ fieldName: "UserData", user: usrData.data.user }, {
    $set: {
      aboutme: about
    }
  })
  return { status: "SUCCESS", data: null, token: token }
}

async function loadThread(room: string, parentID: number, isParentQ: boolean) {
  let thisMsg;
  if (isParentQ) {
    // load the parent message first
    thisMsg = await msgDB.findOne({ fieldName: "MSG", msgID: parentID, $or: [{ parent: -1 }, { parent: { $exists: false } }], room: room })
    if (!thisMsg) return [];
  }
  let children = await msgDB.find({
    fieldName: "MSG",
    parent: (isParentQ ? thisMsg.msgID : parentID),
    room: room
  }).toArray();
  
  // else if (!isParentQ && children.length == 0) {
    // return [];
  // }
  // let origLength = children.length;
  if (isParentQ && children.length == 0) return [thisMsg];
  // let skip = [parentID];
  for (let i = 0; i < children.length; i++) {
    // console.log("att2empting", children[i].msgID);
    // if (skip.indexOf(children[i].msgID)>=0) continue;
    let newChildren = await loadThread(room, children[i].msgID, false);
    // console.log("success: ", newChildren);
    // skip.push(newChildren[i].msgID);
    for (let j=0; j<newChildren.length; j++) {
      children.push(newChildren[j]);
    }
    // if (newChildren.length>0) skip.push(newChildren[0].msgID);
  }
  if (isParentQ) {
    children.unshift(thisMsg);
  }
  // console.log("made it here");
  // if (children.length>1) console.log(children.length)
  // if (children.length>0 && isParentQ) console.log(children[0].parent)
  // if (children.length == 0) console.log("%d children found with parent %d", children.length, parentID);
  return children;
  // return [];
}