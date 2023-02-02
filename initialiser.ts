import {loopy} from './wordListHandle';
import {WS} from './index';

export let rooms = ["xkcd", "test", "bots", "r"];
let nicks = ["BetaUtilities_TS", "BetaUtilities_TS_TEST", 
             "BetaUtilities_TS_BOTS", "BetaUtilities_TS_R"]
export function init() {
  
  let sockets = [];
  for (let i=0; i<rooms.length; i++) {
    sockets.push(new WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], i==0));
  }
  loopy();
}