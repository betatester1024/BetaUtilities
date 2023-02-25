import {loopy} from './wordListHandle';
import {WS} from './wsHandler';
// import { cnc } from './database';
import { updateServer } from './server';
import { updateActive } from './messageHandle';
import { initUsers} from './updateuser';
let rooms = ["xkcd", "test", "bots", "ai", "room", "srs"];
let nicks = ["BetaUtilities", "BetaUtilities_TEST", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities",
             "BetaUtilities"]
export function init() {
  
  let sockets = [];
  updateServer();
  initUsers();
  for (let i=0; i<rooms.length; i++) {
    sockets.push(new WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], rooms[i], i==0));
    updateActive(rooms[i], true);
  }
  // cnc();
  loopy();
}



init();