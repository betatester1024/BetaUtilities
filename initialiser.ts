import {loopy} from './wordListHandle';
import {WS} from './index';
import { updateServer } from './server';
import { updateActive } from './messageHandle';
let rooms = ["xkcd", "test", "bots", "ai", "err", "room", "srs", "rpg", "a", "b", "memes"];
let nicks = ["BetaUtilities", "BetaUtilities_TEST", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities", 
             "BetaUtilities", "BetaUtilities",
             "BetaUtilities"]
export function init() {
  
  let sockets = [];
  updateServer();
  // for (let i=0; i<rooms.length; i++) {
  //   sockets.push(new WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], rooms[i], i==0));
  //   updateActive(rooms[i], true);
  // }
  
  loopy();
}