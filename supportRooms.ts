import {userRequest} from './userRequest';
import {msgDB, authDB, uDB, roomRegex} from './consts';
import {log} from './logging'
import {minID} from  './database';
import { WebH } from './betautilities/webHandler';
export class Room {
  type:string;
  name:string;
  handler: WebH|null;
  constructor(type:string, name:string, responder:((msg:string, sender:string, data:any)=>any)|null=null, handler: WebH|null=null) {
    this.type=type;
    this.name=name;
    this.handler = handler;
  };

}

export class pseudoConnection {
  send(thing:any) {}
  close () {}
};

export class supportHandler {
  static allRooms: Room[] = [];
  static connectionCt = 0;
  static connections: {event:any, roomName:string, tk:string, readyQ:boolean, isPseudoConnection:boolean}[] = [];
  static addRoom(rm:Room) {
    log("Room created!" + rm)
    let idx = this.allRooms.findIndex((r:any)=>{return r.type==rm.type && r.name==rm.name});
    if (idx >= 0) return;
    else this.allRooms.push(rm);
  }
  static deleteRoom(type:string, roomName:string) {
    log("Room deleted!" +  type+ roomName);
    let idx = this.allRooms.findIndex((r:any)=>{return r.type==type && r.name==roomName});
    if (idx >= 0) this.allRooms.splice(idx, 1);
  }
  static async addConnection(ev:any, rn:string, token:string, internalFlag:boolean=false) {
    // send existing connections to THIS EVENT ONLY
    this.connectionCt++;
    if (internalFlag) 
    {
      token = "[SYSINTERNAL]";
    }
    ev.send(JSON.stringify({action:"RELOAD"}));
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
        userRequest(this.connections[i].tk, this.connections[i].isPseudoConnection).then((obj:{status:string, data:any, token:string})=>{
          if (obj.status == "SUCCESS") {
            ev.send(JSON.stringify({action:"addUser", data:{user:obj.data.alias, perms:obj.data.perms}}));
          }
          else {
            ev.send(JSON.stringify({action:"addUser", data:{user:processAnon(this.connections[i].tk), perms:1}}));
          }
        });
    }
    // add NEW CONNECTION
    let thiscn = {id:this.connectionCt, event:ev, roomName:rn, tk:token, readyQ:false, isPseudoConnection:internalFlag};
    this.connections.push(thiscn);
    // TELL EVERYONE ELSE ABOUT THE NEW CONNECTION
    userRequest(token, internalFlag).then((obj:{status:string, data:any, token:string})=>{
      if (obj.status == "SUCCESS") this.sendMsgTo(rn, JSON.stringify({action:"addUser", data:{user:obj.data.alias, perms:obj.data.perms}}));
      else this.sendMsgTo(rn, JSON.stringify({action:"addUser", data:{user:processAnon(obj.token), perms:1}}));
    });
    // console.log("added connection in "+rn);
    let roomData = await msgDB.findOne({fieldName:"RoomInfo", room:{$eq:rn}});
    let msgCt = roomData?roomData.msgCt:0;
    let msgs = await msgDB.find({fieldName:"MSG", room:{$eq:rn}, msgID:{$gt: msgCt-30}}).toArray();
    let threads = await msgDB.find({fieldName:"MSG", room:{$eq:rn}, $or:[{parent:-1}, {parent:{$exists:false}}]}).limit(20).toArray();
    let text = "";
    console.log(await loadThread(rn, -1));
    ev.send(JSON.stringify({action:"CONNECTIONID", data:{id:this.connectionCt}}));
    // load 3 threads and all their children
    for (let i=0; i<threads.length; i++) {
      ev.send(JSON.stringify({action:"msg", data:{id:threads[i].msgID??-1, sender:threads[i].sender, perms: threads[i].permLevel, parent: threads[i].parent??-1, content:threads[i].data}}));
    }
    for (let i=0; i<msgs.length; i++) {
      ev.send(JSON.stringify({action:"msg", data:{id:msgs[i].msgID??-1, sender:msgs[i].sender, perms: msgs[i].permLevel, parent: msgs[i].parent??-1, content:msgs[i].data}}));
    }
    text += "Welcome to BetaOS Services support! Enter any message in the box below. "+
      "Automated response services and utilities are provided by BetaOS System. "+
      "Commands are available here: &gt;&gt;commands \n"+
      "Enter !alias @[NEWALIAS] to re-alias yourself. Thank you for using BetaOS Systems!"
    ev.send(JSON.stringify({action:"msg", data:{id:+msgCt+1, sender:"[SYSTEM]", perms: 3, content:text}}));
    thiscn.readyQ = true;
  }
  static async removeConnection(ev:any, rn:string, token:string) {
    let idx = this.connections.findIndex((cn:any)=>cn.event == ev);
    if (idx >= 0) this.connections.splice(idx, 1);
    
    userRequest(token).then((obj:{status:string, data:any, token:string})=>{
      if (obj.status == "SUCCESS") this.sendMsgTo(rn, JSON.stringify({action:"removeUser", data:{user:obj.data.alias, perms:obj.data.perms}}));
      else this.sendMsgTo(rn, JSON.stringify({action:"removeUser", data:{user:processAnon(obj.token), perms:1}}));
      // console.log("removed connection in "+rn); 
    });
  }
  
  static listRooms(euphOnlyQ:boolean, onlineOnlyQ:boolean) {
    if(euphOnlyQ) {
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
    for (let i=0; i<this.allRooms.length; i++) {
      if (this.allRooms[i].type == "HIDDEN_SUPPORT") continue;
      out.push(this.getPrefix(this.allRooms[i].type)+this.allRooms[i].name);
    }
    return out;
  }
  
  static listEuphRooms() {
    let out = [];
    for (let i=0; i<this.allRooms.length; i++) {
      if (this.allRooms[i].type != "EUPH_ROOM") continue;
      out.push(this.getPrefix(this.allRooms[i].type)+this.allRooms[i].name);
    }
    return out;
  }
  
  static listOnlineRooms() {
    let out = [];
    for (let i=0; i<this.allRooms.length; i++) {
      if (this.allRooms[i].type != "ONLINE_SUPPORT") continue;
      out.push(this.getPrefix(this.allRooms[i].type)+this.allRooms[i].name);
    }
    return out;
  }

  static getPrefix(type:string) {
    switch(type) {
      case 'EUPH_ROOM': return "&";
      case 'ONLINE_SUPPORT': return "#";
      default: return "??";
    }
  }
  
  static checkFoundQ(roomName:string) {
    try {
      for (let i=0; i<this.allRooms.length; i++) {
        if (this.allRooms[i].name == roomName && this.allRooms[i].type != "EUPH_ROOM") return true;
      }
      return false;
    } catch (e:any) {
    console.log("Error:",e);
    }
  }

  static mitoseable(roomName:string) {
     for (let i=0; i<this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName && this.allRooms[i].type == "EUPH_ROOM") return true;
    }
    return false;
  }
  static sendMsgTo(roomName:string, data:string) {
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].roomName == roomName) {
        // encode '>' -- used for message-breaks (yes, it is stupid.)
        data = data.replaceAll(">", "&gt;");
        console.log(data);
        this.connections[i].event.send(data);
      }
    }
    
  }

  static sendMsgTo_ID(connectionID:number, data:string) {
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].id == connectionID) {
        // encode '>' -- used for message-breaks (yes, it is stupid.)
        data = data.replaceAll(">", "&gt;");
        console.log(data);
        this.connections[i].event.send(data);
        
      }
    }
  }  
}

export function sendMsg(msg:string, room:string, parent:number, token:string, callback: (status:string, data:any, token:string)=>any) {
  userRequest(token).then(async (obj:{status:string, data:any, token:string})=>{
    let roomData = await msgDB.findOne({fieldName:"RoomInfo", room:room});
    let msgCt = roomData?roomData.msgCt:0;
    msg = msg.replaceAll("\\n", "\n");
    await msgDB.insertOne({fieldName:"MSG", data:msg.replaceAll(">", "&gt;"), permLevel:obj.data.perms??1, 
                             sender:obj.data.alias??""+processAnon(token), expiry:Date.now()+3600*1000*24*30, 
                           room:room, msgID:msgCt, parent:parent});
    await msgDB.updateOne({room:room, fieldName:"RoomInfo"}, {
      $inc: {msgCt:1}
    }, {upsert: true});
    if (obj.status == "SUCCESS") {
      supportHandler.sendMsgTo(room, JSON.stringify({action:"msg", data:{id:msgCt, sender:obj.data.alias, perms:obj.data.perms, parent: parent, content:msg}}));
    }
    else {
      //console.log("sending")
      supportHandler.sendMsgTo(room, JSON.stringify({action:"msg", data:{id:msgCt, sender:processAnon(token), perms:1, parent: parent, content:msg}}));
    }
    //console.log(supportHandler.allRooms);
    for (let i=0; i<supportHandler.allRooms.length; i++) {
      if (supportHandler.allRooms[i].name == room) {
        // console.log("sending"+msg);
        supportHandler.allRooms[i].handler.onMessage(msg, obj.data.alias??processAnon(token))
      }
 
    }
    callback("SUCCESS", null, token);
  });
}

export async function sendMsg_B(msg:string, room:string) {
  let roomData = await msgDB.findOne({fieldName:"RoomInfo", room:room});
  let msgCt = roomData?roomData.msgCt:0;
  let betaNick="";
  for (let i=0; i<supportHandler.allRooms.length; i++) {
    if (supportHandler.allRooms[i].name == room) {
      // console.log("sending"+msg);
      betaNick=supportHandler.allRooms[i].handler.displayNick??"[BetaOS_ERROR]";
      break;
    }

  }
  console.log(msg);
  await msgDB.insertOne({fieldName:"MSG", data:msg.replaceAll("\\n\\n", "\n").replaceAll(">", "&gt;"), permLevel:3, 
                           sender:betaNick, expiry:Date.now()+3600*1000*24*30, 
                         room:room, msgID:msgCt});
  await msgDB.updateOne({room:room, fieldName:"RoomInfo"}, {
      $inc: {msgCt:1}
    }, {upsert: true});
  supportHandler.sendMsgTo(room, JSON.stringify({action:"msg", data:{id:msgCt, sender:betaNick, perms:3, content:msg.replaceAll("\\n\\n", "\n")}}));
}

function processAnon(token:string) {
  return "Anonymous user";
}

export function roomRequest(token:string, all:boolean=false) {
  if (all) return {status: "SUCCESS", data:supportHandler.listAllRooms(), token:token};
  else return {status: "SUCCESS", data:supportHandler.listOnlineRooms(), token:token};
}

export async function createRoom(name:string, token:string) {
  if (supportHandler.checkFoundQ(name)) return {status:"ERROR", data:{error:"Room already exists"}, token:token};
  let usrData = await userRequest(token) as {status:string, data:{perms:number}};
  if (!name.match("^"+roomRegex+"$")) return {status:"ERROR", data:{error:"Invalid roomname!"}, token:token};
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {
      
      // supportHandler.addRoom(new Room("ONLINE_SUPPORT", name));
      new WebH(name, false);
      let obj = await uDB.findOne({fieldName:"ROOMS"});
      obj.rooms.push(name);
      await uDB.updateOne({fieldName:"ROOMS"}, {
        $set: {
          rooms: obj.rooms
        },
      }, {upsert:true});
      return {status:"SUCCESS", data:null, token:token}
    }
    else return {status:"ERROR", data:{error:"Access denied!"}, token:token};
  }
  else return usrData;
}

export async function deleteRoom(name:string, token:string) {
  if (!supportHandler.checkFoundQ(name)) return {status:"ERROR", data:{error:"Room does not exist"}, token:token};
  let usrData = await userRequest(token) as {status:string, data:{perms:number}};
  if (!name.match("^"+roomRegex+"$")) return {status:"ERROR", data:{error:"Invalid roomname!"}, token:token};
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {

      let obj = await uDB.findOne({fieldName:"ROOMS"})
      let idx = obj.rooms.indexOf(name); 
      if (idx>=0) {
        supportHandler.deleteRoom("ONLINE_SUPPORT", name);
        obj.rooms.splice(idx, 1);
        await uDB.updateOne({fieldName:"ROOMS"}, {
          $set: {
            rooms: obj.rooms
          },
        }, {upsert:true});
        return {status:"SUCCESS", data:null, token:token}
      }
      else {
        let idx = obj.hidRooms.indexOf(name); 
        if (idx>=0) {
          supportHandler.deleteRoom("HIDDEN_SUPPORT", name);
          obj.hidRooms.splice(idx, 1);
        }
        else return {status:"ERROR", data:{error: "Database inconsistency detected"}, token:token};
        await uDB.updateOne({fieldName:"ROOMS"}, {
          $set: {
            hidRooms: obj.hidRooms
          },
        }, {upsert:true});
        return {status:"SUCCESS", data:null, token:token}
      }
    }
    else return {status:"ERROR", data:{error:"Access denied!"}, token:token};
  }
  else return usrData;
}

export function updateActive(name:string, activeQ: boolean) {
  if (activeQ) supportHandler.addRoom(new Room("EUPH_ROOM", name));
  else supportHandler.deleteRoom("EUPH_ROOM", name);
}

export async function WHOIS(token:string, user:string) {
  let userData = await authDB.findOne({fieldName:"UserData", user:user});
  let userData2 = await authDB.find({fieldName:"UserData", alias:user}).toArray();
  let out = [];
  for (let i=0; i<userData2.length; i++) {
    out.push({user:userData2[i].user, 
              tasks: userData2[i].tasksCompleted,
              about:userData2[i].aboutme,
              perms: userData2[i].permLevel})
  }
  return {status:"SUCCESS", data:{account:{
    perms:userData?userData.permLevel:"N/A", 
    user:user, 
    tasks:userData?userData.tasksCompleted:"N/A",
    about:userData?userData.aboutme:"Account not found"
  }, users:out}, token:token};
}

//loadLogs(data.room, data.id, data.from token)
export async function loadLogs(rn:string, id:string, from:number, token:string) {
  try {
  let roomInfo = await msgDB.findOne({fieldName:"RoomInfo", room:{$eq:rn}});
  from = +from;
  console.log("LOADING LOGS FROM",from-30,"TO",from, roomInfo.minCt);
  if (from<minID || (roomInfo && roomInfo.minCt && from < roomInfo.minCt)) {
    supportHandler.sendMsgTo_ID(id, JSON.stringify({action:"LOADCOMPLETE", data:{id:-1}}));
    return {status:"SUCCESS", data:null, token:token}
  }
  let msgs = await msgDB.find({fieldName:"MSG", room:{$eq:rn}, msgID:{$gt: from-30, $lt: from}}).toArray();
  for (let i=msgs.length-1; i>=0; i--) {
    console.log(msgs[i].msgID);
    let dat = JSON.stringify({action:"msg", data:{id:"-"+msgs[i].msgID, sender:msgs[i].sender, perms:msgs[i].permLevel, parent: msgs[i].parent??-1, content:msgs[i].data}});
    // console.log(dat);
    supportHandler.sendMsgTo_ID(id, dat);
  }
  console.log("LOADING COMPLETE, LOADED"+msgs.length,"MESSAGES");
  supportHandler.sendMsgTo_ID(id, JSON.stringify({action:"LOADCOMPLETE", data:{id:from-30}}));
  return {status:"SUCCESS", data:null, token:token};
  } catch (e:any) {
    console.log("Error:",e);
  }
} // loadLogs

export async function delMsg(id:string, room:string, token:string) {
  try {
  // console.log({fieldName:"MSG", msgID:id, room:room});
  if (!supportHandler.checkFoundQ(room)) return {status:"ERROR", data:{error:"Room does not exist"}, token:token};
  let usrData = await userRequest(token) as {status:string, data:{perms:number}};
  if (usrData.status != "SUCCESS") return usrData;
  if (usrData.perms < 2) return {status:"ERROR", data:{error:"Insufficient permissions!"}, token:token};
  await msgDB.deleteOne({fieldName:"MSG", msgID:Number(id), room:room});
  supportHandler.sendMsgTo(room, JSON.stringify({action:"delMsg", data:{id:Number(id)}}));
  return {status:"SUCCESS", data:null, token:token};
  } catch (e:any) {
    console.log("Error:",e);
  }
}

export async function updateDefaultLoad(name:string[], token:string) {
  try {
  let usrData = await userRequest(token) as {status:string, data:{perms:number}};
  if (usrData.status != "SUCCESS") return usrData;
  // console.log(usrData.data.perms);
  if (usrData.data.perms < 3) return {status:"ERROR", data:{error:"Insufficient permissions!"}, token:token};
  for (let i=0; i<name.length; i++) {
    if (!name[i].match("^"+roomRegex+"$")) return {status:"ERROR", data:{error:"Invalid room-name(s)"}, token:token}
  }
  await uDB.updateOne({fieldName:"ROOMS"}, {$set:{
    euphRooms:name
  }});
  return {status:"SUCCESS", data:null, token:token};
  } catch (e:any) {
    console.log("Error:",e);
  }
}

export async function hidRoom(name:string, token:string) {
  try {
  console.log(name);
  if (supportHandler.checkFoundQ(name)) return {status:"ERROR", data:{error:"Room already exists"}, token:token};
  let usrData = await userRequest(token) as {status:string, data:{perms:number}};
  if (!name.match("^"+roomRegex+"$")) return {status:"ERROR", data:{error:"Invalid roomname!"}, token:token};
  if (usrData.status == "SUCCESS") {
    if (usrData.data.perms >= 2) {
      
      // supportHandler.addRoom(new Room("ONLINE_SUPPORT", name));
      new WebH(name, false);
      let obj = await uDB.findOne({fieldName:"ROOMS"});
      obj.hidRooms.push(name);
      await uDB.updateOne({fieldName:"ROOMS"}, {
        $set: {
          hidRooms: obj.hidRooms
        },
      }, {upsert:true});
      return {status:"SUCCESS", data:null, token:token}
    }
    else return {status:"ERROR", data:{error:"Access denied!"}, token:token};
  }
  else return usrData;
  } catch (e:any) {
    console.log("Error:",e);
  }
}

export async function purge(name:string, token:string) {
  try {
  if (!supportHandler.checkFoundQ(name)) return {status:"ERROR", data:{error:"Room does not exist"}, token:token};
  let usrData = await userRequest(token) as {status:string, data:{perms:number}};
  if (usrData.status != "SUCCESS") return usrData;
  // console.log(usrData.data.perms);
  if (usrData.data.perms < 3) return {status:"ERROR", data:{error:"Insufficient permissions!"}, token:token};

  await msgDB.deleteMany({fieldName:"MSG", room:name});
  await msgDB.updateOne({fieldName:"RoomInfo", room:name}, {$set:{
    msgCt:0,
    minCt:0
  }})
  supportHandler.sendMsgTo(name, JSON.stringify({action:"RESTART"}));
  return {status:"SUCCESS", data:null, token:token};
  } catch (e:any) {
    console.log("Error:",e);
  }
}

export async function updateAbout(about:string, token:string) {
  let usrData = await userRequest(token) as {status:string, data:{perms:number}};
  if (usrData.status != "SUCCESS") return usrData;
  await authDB.updateOne({fieldName:"UserData", user:usrData.data.user}, {$set:{
    aboutme: about
  }})
  return {status:"SUCCESS", data:null, token:token}
}

async function loadThread(room:string, parentID:number) {
  // let thisMsg;
  // if (parentID < 0) {
  //   thisMsg = await msgDB.findOne({fieldName:"MSG", $or:[{parent:-1}, {parent:{$exists:false}}], room:room})
  //   console.log(thisMsg);
  //   if (!thisMsg) return [];
  // }
  // let children = await msgDB.find({fieldName:"MSG", parent:parentID<0?thisMsg.msgID:parentID, room:room}).toArray();
  // for (let i=0; i<children.length; i++) {
  //   let newChildren = await loadThread(room, children[i].msgID);
  //   for (c in newChildren) 
  //     children.push(c);
  // }
  // return children;
  return [];
}
