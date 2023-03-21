import { userRequest } from './userRequest';
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
  static connections: {event:any, roomName:string}[] = [];
  static addRoom(r:Room) {
    this.allRooms.push(r);
  }
  static addConnection(ev:any, rn:string, token:string) {
    this.connections.push({event:ev, roomName:rn});
    userRequest((status:string, data:any, token:string)=>{
      if (status == "SUCCESS") this.sendMsgTo(rn, "+"+data.user+"("+data.perms+")");
    }, token);
    console.log("added connection in "+rn);
  }
  static async removeConnection(ev:any, rn:string, token:string) {
    let idx = this.connections.indexOf({event:ev, roomName:rn});
    if (idx >= 0) this.connections.splice(idx, 1);
    userRequest((status:string, data:any, token:string)=>{
      if (status == "SUCCESS") this.sendMsgTo(rn, "+"+data.user+"("+data.perms+")");
    }, token);
    
  }
  static listRooms(euphOnlyQ:boolean) {
    let out = [];
    for (let i=0; i<this.allRooms.length; i++) {
      if (euphOnlyQ && this.allRooms[i].type != "EUPH_ROOM") continue;
      if (this.allRooms[i].type == "HIDDEN_SUPPORT") continue;
      out.push(this.allRooms[i].name);
    }
    return out;
  }
  static checkFoundQ(roomName:string) {
    for (let i=0; i<this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName) return true;
    }
    return false;
  }
  static sendMsgTo(roomName:string, data:string) {
    for (let i=0; i<this.allRooms.length; i++) {
      if (this.connections[i].roomName == roomName)
        this.connections[i].event.write("data:"+data+"\n\n")
    }
  }
}