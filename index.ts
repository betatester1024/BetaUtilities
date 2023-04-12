import {initServer} from './server';
import {DBMaintenance, connectDB} from './database';
import {supportHandler, Room} from './supportRooms'
import {log} from './logging';
import {uDB} from './consts';
import {WS} from './wsHandler'
log("Systems restarted");

try {
  connectDB().then((thing:any)=>{
    console.log(thing)
    initServer();
    DBMaintenance();
    uDB.findOne({fieldName:"ROOMS"}).then((obj:{euphRooms:string[], rooms:string[], hidRooms:string[]})=>{
      for (let i=0; i<obj.euphRooms.length; i++) {
        supportHandler.addRoom(new Room("EUPH_ROOM", obj.euphRooms[i]));
        new WS("wss://euphoria.io/room/" + obj.euphRooms[i] + "/ws", "BetaUtilities", obj.euphRooms[i], false)
      }
      for (let i=0; i<obj.rooms.length; i++) {
        supportHandler.addRoom(new Room("ONLINE_SUPPORT", obj.rooms[i]));
      }
      for (let i=0; i<obj.hidRooms.length; i++) {
        supportHandler.addRoom(new Room("HIDDEN_SUPPORT", obj.hidRooms[i]));
      }
    })
  });
} catch (e:any) {
  console.log(e);
}
