import { userRequest } from './userRequest';
import { K } from './consts';
export class Room {
  type:string;
  pausedQ: boolean;
  name:string;
  constructor(type:string, name:string) {
    this.type=type;
    this.pausedQ = false;
    this.name=name;
  };

  pause() {
    this.pausedQ = true;
  }
}

export class supportHandler {
  static allRooms: Room[] = [];
  static connections: {event:any, roomName:string, tk:string}[] = [];
  static addRoom(r:Room) {
    this.allRooms.push(r);
  }
  static addConnection(ev:any, rn:string, token:string) {
    // send existing connections to THIS EVENT ONLY
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
      userRequest((status:string, data:any, _token:string)=>{
        if (status == "SUCCESS") ev.write("data:+"+data.alias+"("+data.perms+")>\n\n");
        else ev.write("data:+ANON|"+processAnon(this.connections[i].tk)+"(1)>\n\n");
      }, this.connections[i].tk);
    }
    // add NEW CONNECTION
    this.connections.push({event:ev, roomName:rn, tk:token});
    // TELL EVERYONE ELSE ABOUT THE NEW CONNECTION
    userRequest((status:string, data:any, _token:string)=>{
        if (status == "SUCCESS") this.sendMsgTo(rn, "+"+data.alias+"("+data.perms+")");
        else this.sendMsgTo(rn, "+ANON|"+processAnon(token)+"(1)");
    }, token);
    console.log("added connection in "+rn);
  }
  static async removeConnection(ev:any, rn:string, token:string) {
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].event == ev) this.connections.splice(i, 1);
    };
    userRequest((status:string, data:any, _token:string)=>{
      if (status == "SUCCESS") this.sendMsgTo(rn, "-"+data.alias+"("+data.perms+")");
      else this.sendMsgTo(rn, "-ANON|"+processAnon(token)+"(1)");
    }, token);
    console.log("removed connection in "+rn);
  }
  static listRooms(euphOnlyQ:boolean, onlineOnlyQ:boolean) {
    let out = [];
    for (let i=0; i<this.allRooms.length; i++) {
      if (euphOnlyQ && this.allRooms[i].type != "EUPH_ROOM") continue;
      if (onlineOnlyQ && this.allRooms[i].type != "ONLINE_SUPPORT") continue;
      if (this.allRooms[i].type == "HIDDEN_SUPPORT") continue;
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
  static sendMsgTo(roomName:string, data:string) {
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].roomName == roomName) {
        // encode '>' -- used for message-breaks (yes, it is stupid.)
        data = data.replace(">", "&gt;");
        this.connections[i].event.write("data:"+data+">\n\n")
      }
    }
  }  
}

export async function sendMsg(msg:string, room:string, callback: (status:string, data:any, token:string)=>any, token:string) {
  userRequest(async (status:string, data:any, _token:string)=>{
    await K.msgDB.insertOne({fieldName:"MSG", user:data.alias});
    if (status == "SUCCESS") supportHandler.sendMsgTo(room, "["+data.alias+"]("+data.perms+")"+msg);
    else supportHandler.sendMsgTo(room, "[ANON|"+processAnon(token)+"](1)"+msg);
    callback("SUCCESS", null, token);
  }, token);
}

function processAnon(token:string) {
  return token?token.slice(0, 4):"";
}

export function roomRequest(callback:(status:string, data:any, token:string)=>any, token:string, all:boolean=false) {
  if (all) callback("SUCCESS", supportHandler.listRooms(false, false), token);
  else callback("SUCCESS", supportHandler.listRooms(false, true), token);
}