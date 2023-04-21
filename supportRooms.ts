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
  write(thing:any) {}
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
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
        userRequest(this.connections[i].tk, this.connections[i].isPseudoConnection).then((obj:{status:string, data:any, token:string})=>{
          if (obj.status == "SUCCESS") {
            ev.write("data:+"+obj.data.alias+"("+obj.data.perms+")>\n\n");
          }
          else {
            ev.write("data:+"+processAnon(this.connections[i].tk)+"(1)>\n\n");
          }
        });
    }
    // add NEW CONNECTION
    let thiscn = {id:this.connectionCt, event:ev, roomName:rn, tk:token, readyQ:false, isPseudoConnection:internalFlag};
    this.connections.push(thiscn);
    // TELL EVERYONE ELSE ABOUT THE NEW CONNECTION
    userRequest(token, internalFlag).then((obj:{status:string, data:any, token:string})=>{
      if (obj.status == "SUCCESS") this.sendMsgTo(rn, "+"+obj.data.alias+"("+obj.data.perms+")");
      else this.sendMsgTo(rn, "+"+processAnon(obj.token)+"(1)");
    });
    console.log("added connection in "+rn);
    let roomData = await msgDB.findOne({fieldName:"RoomInfo", room:rn});
    let msgCt = roomData?roomData.msgCt:0;
    let msgs = await msgDB.find({fieldName:"MSG", room:{$eq:rn}, msgID:{$gt: msgCt-30}}).toArray();
    let text = "";
    ev.write("data:CONNECTIONID "+this.connectionCt+">\n\n");
    for (let i=0; i<msgs.length; i++) {
      // let userData = await authDB.findOne({fieldName:"UserData", user:msgs[i].sender})
      // if (!userData) text+= "["+msgs[i].sender+"](1)"+msgs[i].data+">";
      // if (!userData) ev.write("data:["+msgs[i].sender+"](1)"+msgs[i].data+">\n\n");
      // else text += "["+(userData.alias??msgs[i].sender)+"]("+userData.permLevel+")"+msgs[i].data+">";
      ev.write("data:{"+/*(Math.random()<0.5?"-":"")+*/(msgs[i].msgID??-1)+"}["+(msgs[i].sender)+"]("+msgs[i].permLevel+")"+msgs[i].data+">\n\n");
    }
    text += "{99999999999}[SYSTEM](3)Welcome to BetaOS Services support! Enter any message in the box below. "+
      "Automated response services and utilities are provided by BetaOS System. "+
      "Commands are available here: &gt;&gt;commands \n"+
      "Enter !alias @[NEWALIAS] to re-alias yourself. Thank you for using BetaOS Systems!>"
    ev.write("data:"+text+"\n\n")
    thiscn.readyQ = true;
  }
  static async removeConnection(ev:any, rn:string, token:string) {
    let idx = this.connections.findIndex((cn:any)=>cn.event == ev);
    if (idx >= 0) this.connections.splice(idx, 1);
    
    userRequest(token).then((obj:{status:string, data:any, token:string})=>{
      if (obj.status == "SUCCESS") this.sendMsgTo(rn, "-"+obj.data.alias+"("+obj.data.perms+")");
      else this.sendMsgTo(rn, "-"+processAnon(obj.token)+"(1)");
      console.log("removed connection in "+rn); 
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
    for (let i=0; i<this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName && this.allRooms[i].type != "EUPH_ROOM") return true;
    }
    return false;
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
        this.connections[i].event.write("data:"+data+">\n\n")
      }
    }
    
  }

  static sendMsgTo_ID(connectionID:number, data:string) {
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].id == connectionID) {
        // encode '>' -- used for message-breaks (yes, it is stupid.)
        data = data.replaceAll(">", "&gt;");
        
        this.connections[i].event.write("data:"+data+">\n\n")
        
      }
    }
  }  
}

export function sendMsg(msg:string, room:string, token:string, callback: (status:string, data:any, token:string)=>any) {
  userRequest(token).then(async (obj:{status:string, data:any, token:string})=>{
    let roomData = await msgDB.findOne({fieldName:"RoomInfo", room:room});
    let msgCt = roomData?roomData.msgCt:0;
    await msgDB.insertOne({fieldName:"MSG", data:msg.replaceAll(">", "&gt;"), permLevel:obj.data.perms??1, 
                             sender:obj.data.alias??""+processAnon(token), expiry:Date.now()+3600*1000*24*30, 
                           room:room, msgID:msgCt});
    await msgDB.updateOne({room:room, fieldName:"RoomInfo"}, {
      $inc: {msgCt:1}
    }, {upsert: true});
    if (obj.status == "SUCCESS") {
      supportHandler.sendMsgTo(room, "{"+msgCt+"}["+obj.data.alias+"]("+obj.data.perms+")"+msg);
    }
    else {
      //console.log("sending")
      supportHandler.sendMsgTo(room, "{"+msgCt+"}["+processAnon(token)+"](1)"+msg);
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
  await msgDB.insertOne({fieldName:"MSG", data:msg, permLevel:3, 
                           sender:"BetaOS_System", expiry:Date.now()+3600*1000*24*30, 
                         room:room, msgID:msgCt});
  await msgDB.updateOne({room:room, fieldName:"RoomInfo"}, {
      $inc: {msgCt:1}
    }, {upsert: true});
  supportHandler.sendMsgTo(room, "{"+msgCt+"}[BetaOS_System](3)"+msg);
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
  if (!name.match(roomRegex)) return {status:"ERROR", data:{error:"Invalid roomname!"}, token:token};
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
  if (!name.match(roomRegex)) return {status:"ERROR", data:{error:"Invalid roomname!"}, token:token};
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
  from = +from;
  console.log("LOADING LOGS FROM",from-30,"TO",from);
  if (from<minID) return {status:"SUCCESS", data:null, token:token}
                         // DO NOT RETURN LOADCOMPLETE.
  
  let msgs = await msgDB.find({fieldName:"MSG", room:{$eq:rn}, msgID:{$gt: from-30, $lt: from}}).toArray();
  console.log(msgs.length);
  for (let i=msgs.length-1; i>=0; i--) {
    // console.log(msgs[i]);
    let dat = "{"+(-msgs[i].msgID)+"}["+(msgs[i].sender)+"]("+msgs[i].permLevel+")"+msgs[i].data;
    // console.log(dat);
    supportHandler.sendMsgTo_ID(id, dat);
  }
  console.log("LOADING COMPLETE, LOADED"+msgs.length,"MESSAGES");
  supportHandler.sendMsgTo_ID(id, "LOADCOMPLETE "+(from-30));
  return {status:"SUCCESS", data:null, token:token};
} // loadLogs