import {initServer} from './server';
import {DBMaintenance, connectDB, client} from './database';
import {supportHandler, Room} from './supportRooms'
import {log} from './logging';
import {uDB} from './consts';
import {WS} from './betautilities/wsHandler';
export let connectionSuccess = true;
export let DBConnectFailure:any = null;

try {
  if (connectionSuccess)
  connectDB().then((thing:any)=>{
    console.log(thing)
    if (!connectionSuccess) return;
    initServer();
    DBMaintenance();
    log("Systems restarted");
    uDB.findOne({fieldName:"ROOMS"}).then((obj:{euphRooms:string[], rooms:string[], hidRooms:string[]})=>{
      for (let i=0; i<obj.euphRooms.length; i++) {
        supportHandler.addRoom(new Room("EUPH_ROOM", obj.euphRooms[i]));
        new WS("wss://euphoria.io/room/" + obj.euphRooms[i] +"/ws", "BetaUtilities", obj.euphRooms[i], false)
        log("Connected euph_room")+obj.euphRooms[i];
        console.log("Connected euph_room", obj.euphRooms[i]);
      }
      for (let i=0; i<obj.rooms.length; i++) {
        supportHandler.addRoom(new Room("ONLINE_SUPPORT", obj.rooms[i]));
        console.log("Loaded support room", obj.rooms[i]);
      }
      for (let i=0; i<obj.hidRooms.length; i++) {
        supportHandler.addRoom(new Room("HIDDEN_SUPPORT", obj.hidRooms[i]));
        console.log("Loaded support room", obj.rooms[i]);
      }
    })
  });
  DBConnectFailure = setTimeout(()=>{
    connectionSuccess=false; 
    console.log("Connection failed")
    initServer();
  }, 1000);
} catch (e:any) {
  console.log(e);
}
