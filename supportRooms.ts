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

class supportHandler {
  static allRooms: Room[];
  static connections: {event:any, roomName:string}[i];
  static addRoom(r:Room) {
    this.allRooms.push(r);
  }
  static addConnection(ev:any, rn:string) {
    this.connections.push({event:ev, roomName:rn})
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
  static sendMsgTo(roomName:string) {
    for (let i=0; i<this.allRooms.length; i++) {
      if (this.allRooms[i].name == roomName)
    }
  }
}