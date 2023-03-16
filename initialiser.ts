import {loopy} from './wordListHandle';
import {WS} from './wsHandler';
// import { cnc } from './database';
import { updateServer } from './server';
import { updateActive } from './messageHandle';
import { initUsers} from './updateuser';
import {WebH} from './webHandler';
import { DB } from './database';
import {pushEvents, hidEvents, pushUserEvents, hidUserEvents, users, hidUsers} from './server';
import {DBGarbageCollect} from './accessControl'
let rooms = ["xkcd", "test", "bots", "ai", "room", "srs", "memes", "music"];
let nicks = ["BetaUtilities", "BetaUtilities_TEST", 
             "BetaUtilities", "BetaOS_Systems", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities",
             "BetaUtilities"]
export let sysRooms:string[] = [];//["main_support", "secondary_support","room3"];
export let hidRooms:string[] = [];
export function init() {
  
  let sockets = [];
  updateServer();
  initUsers();
  for (let i=0; i<rooms.length; i++) {
    sockets.push(new WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], rooms[i], i==0));
    webHandlers.push(null);
    updateActive(rooms[i], true);
  }
  DB.findOne({fieldName:"ROOMS"}).then((obj:{rooms:string[], hidRooms:string[]})=>{
    // sysRooms = obj.rooms;
    let i=0;
    for (; i<obj.rooms.length; i++) {
      webHandlers[i] = new WebH(obj.rooms[i]);
    }
    for (let j=0; j<obj.hidRooms.length; j++) {
      hidRooms.push("HIDDEN|"+obj.hidRooms[j])
      hidEvents.push([]);
      hidUserEvents.push([]);
      hidUsers.push([])
      // console.log("thing")
      webHandlers[i+j] = new WebH(obj.hidRooms[j], true);
    }
    // hidRooms = obj.hidRooms;
    console.log("WebHandlers loaded. Sysrooms:", sysRooms, "hidden rooms:", hidRooms)
  });
  // cnc();
  loopy();
  setInterval(()=>{DBGarbageCollect()}, 10000);
}
// export let currHandler:WebH;
export let webHandlers:WebH[] = [];


init();