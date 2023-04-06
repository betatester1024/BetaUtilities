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
  static async addConnection(ev:any, rn:string, token:string) {
    // send existing connections to THIS EVENT ONLY
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].roomName == rn)
        userRequest(this.connections[i].tk).then((obj:{status:string, data:any, _token:string})=>{
          if (obj.status == "SUCCESS") ev.write("data:+"+obj.data.alias+"("+obj.data.perms+")>\n\n");
          else ev.write("data:+"+processAnon(this.connections[i].tk)+"(1)>\n\n");
        });
    }
    // add NEW CONNECTION
    this.connections.push({event:ev, roomName:rn, tk:token});
    // TELL EVERYONE ELSE ABOUT THE NEW CONNECTION
    userRequest(token).then((obj:{status:string, data:any, token:string})=>{
      if (obj.status == "SUCCESS") this.sendMsgTo(rn, "+"+obj.data.alias+"("+obj.data.perms+")");
      else this.sendMsgTo(rn, "+"+processAnon(obj.token)+"(1)");
    });
    console.log("added connection in "+rn);
    let msgs = await K.msgDB.find({fieldName:"MSG", room:rn}).toArray();
    let text = "";
    for (let i=0; i<msgs.length; i++) {
      let userData = await K.authDB.findOne({fieldName:"UserData", user:msgs[i].sender})
      if (!userData) text+= "["+msgs[i].sender+"](1)"+msgs[i].data+">";
      else text += "["+(userData.alias??msgs[i].sender)+"]("+userData.permLevel+")"+msgs[i].data+">";
    }
    text += "[SYSTEM](3)Welcome to BetaOS Services support! Enter any message in the box below. Automated response services and utilities are provided by BetaOS System. \nThank you for using BetaOS Systems!>"
    ev.write("data:"+text+"\n\n")
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
  static sendMsgTo(roomName:string, data:string) {
    for (let i=0; i<this.connections.length; i++) {
      if (this.connections[i].roomName == roomName) {
        // encode '>' -- used for message-breaks (yes, it is stupid.)
        data = data.replaceAll(">", "&gt;");
        this.connections[i].event.write("data:"+data+">\n\n")
      }
    }
  }  
}

export function sendMsg(msg:string, room:string, token:string, callback: (status:string, data:any, token:string)=>any) {
  userRequest(token).then(async (obj:{status:string, data:any, token:string})=>{
    await K.msgDB.insertOne({fieldName:"MSG", data:msg, 
                             sender:obj.data.user??""+processAnon(token), expiry:Date.now()+3600*1000, room:room});
    if (obj.status == "SUCCESS") supportHandler.sendMsgTo(room, "["+obj.data.alias+"]("+obj.data.perms+")"+msg);
    else supportHandler.sendMsgTo(room, "["+processAnon(token)+"](1)"+msg);
    callback("SUCCESS", null, token);
  });
}

function processAnon(token:string) {
  return "Anonymous user";
}

export function roomRequest(token:string, all:boolean=false) {
  if (all) return {status: "SUCCESS", data:supportHandler.listAllRooms(), token:token};
  else return {status: "SUCCESS", data:supportHandler.listOnlineRooms(), token:token};
}
