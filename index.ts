import {initServer} from './server';
import {DBMaintenance, connectDB, client} from './database';
import {supportHandler, Room} from './supportRooms'
import {log} from './logging';
import {uDB} from './consts';
import {WS} from './betautilities/wsHandler';
import {WebH} from './betautilities/webHandler';
import { serverUpdate } from './betautilities/wordler';
export let connectionSuccess = true;
export let DBConnectFailure:any = null;
import {sendMail} from './mailer';
const localEuphRooms = [
  // "bots", "room", "memes", "music", "srs"
]
const { exec } = require("child_process");

try {
  // sendMail();
  if (connectionSuccess)
  connectDB().then((thing:any)=>{
    console.log(thing)
    if (!connectionSuccess) return;
    initServer();
    DBMaintenance();
    serverUpdate();
    log("Systems restarted");
    uDB.findOne({fieldName:"ROOMS"}).then((obj:{euphRooms:string[], rooms:string[], hidRooms:string[]})=>{
      console.log(obj);
      for (let i=0; i<obj.euphRooms.length; i++) {
        supportHandler.addRoom(new Room("EUPH_ROOM", obj.euphRooms[i]));
        new WS("wss://euphoria.io/room/" + obj.euphRooms[i] +"/ws", "BetaUtilities", obj.euphRooms[i], false)
        log("Connected euph_room")+obj.euphRooms[i];
        console.log("Connected euph_room", obj.euphRooms[i]);
      }
      for (let i=0; i<localEuphRooms.length; i++) {
        supportHandler.addRoom(new Room("EUPH_ROOM", localEuphRooms[i]));
        new WS("wss://euphoria.io/room/" + localEuphRooms[i] +"/ws", "BetaUtilities", localEuphRooms[i], false)
        log("Connected euph_room")+localEuphRooms[i];
        console.log("Connected euph_room", localEuphRooms[i]);
      }
      for (let i=0; i<obj.rooms.length; i++) {
        new WebH(obj.rooms[i], false);
        //supportHandler.addRoom(new Room("ONLINE_SUPPORT", obj.rooms[i]));
        console.log("Loaded support room", obj.rooms[i]);
      }
      for (let i=0; i<obj.hidRooms.length; i++) {
        new WebH(obj.hidRooms[i], true);
        // supportHandler.addRoom(new Room("HIDDEN_SUPPORT", obj.hidRooms[i]));
        console.log("Loaded hidden support room", obj.hidRooms[i]);
      }
    })
  });
  DBConnectFailure = setTimeout(()=>{
    connectionSuccess=false; 
    console.log("Connection failed")
    log("Services failed. Rebooting now.")
    initServer();
    serverUpdate();
    setTimeout(()=>{exec("kill 1")}, 10000);
  }, 29000);
} catch (e:any) {
  console.log(e);
}
