import {loopy} from './wordListHandle';
import {WS} from './index';
import { updateActive } from './messageHandle';
let rooms = ["xkcd", "test", "bots", "ai"];
let nicks = ["BetaUtilities", "BetaUtilities_TEST", 
             "BetaUtilities_BOTS", "BetaUtilities_AI"]
export function init() {
  
  let sockets = [];
  for (let i=0; i<rooms.length; i++) {
    sockets.push(new WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], rooms[i], i==0));
    updateActive(rooms[i], true);
  }
  loopy();
}