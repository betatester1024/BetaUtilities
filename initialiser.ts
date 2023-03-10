import {loopy} from './wordListHandle';
import {WS} from './wsHandler';
// import { cnc } from './database';
import { updateServer } from './server';
import { updateActive } from './messageHandle';
import { initUsers} from './updateuser';
import {WebH} from './webHandler';
import { DB } from './database';
import {pushEvents} from './server';
import {DBGarbageCollect} from './accessControl'
let rooms = ["xkcd", "test", "bots", "ai", "room", "srs", "memes"];
let nicks = ["BetaUtilities", "BetaUtilities_TEST", 
             "BetaUtilities", "BetaOS_Systems", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities",
             "BetaUtilities"]
export let sysRooms = [];//["main_support", "secondary_support","room3"];
export function init() {
  
  let sockets = [];
  updateServer();
  initUsers();
  for (let i=0; i<rooms.length; i++) {
    sockets.push(new WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], rooms[i], i==0));
    updateActive(rooms[i], true);
  }
  
  DB.findOne({fieldName:"ROOMS"}).then((obj:{rooms:string[]})=>{
    sysRooms = obj.rooms;
    for (let i=0; i<sysRooms.length; i++) {
      pushEvents.push([]);
      webHandlers[i] = new WebH(sysRooms[i]);
    }
    console.log("WebHandlers loaded. Sysrooms:", sysRooms)
  });
  console.log("WSHandlers loaded.");
  // cnc();
  loopy();
  setInterval(()=>{DBGarbageCollect()}, 10000);
}
// export let currHandler:WebH;
export let webHandlers:WebH[] = [];


init();