"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var initialiser_exports = {};
__export(initialiser_exports, {
  hidRooms: () => hidRooms,
  init: () => init,
  sysRooms: () => sysRooms,
  webHandlers: () => webHandlers
});
module.exports = __toCommonJS(initialiser_exports);
var import_wordListHandle = require("./wordListHandle");
var import_wsHandler = require("./wsHandler");
var import_server = require("./server");
var import_messageHandle = require("./messageHandle");
var import_updateuser = require("./updateuser");
var import_webHandler = require("./webHandler");
var import_database = require("./database");
var import_server2 = require("./server");
var import_accessControl = require("./accessControl");
let rooms = ["xkcd", "test", "bots", "ai", "room", "srs", "memes", "music"];
let nicks = [
  "BetaUtilities",
  "BetaUtilities_TEST",
  "BetaUtilities",
  "BetaOS_Systems",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities"
];
let sysRooms = [];
let hidRooms = [];
function init() {
  let sockets = [];
  (0, import_server.updateServer)();
  (0, import_updateuser.initUsers)();
  for (let i = 0; i < rooms.length; i++) {
    sockets.push(new import_wsHandler.WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], rooms[i], i == 0));
    webHandlers.push(null);
    (0, import_messageHandle.updateActive)(rooms[i], true);
  }
  import_database.DB.findOne({ fieldName: "ROOMS" }).then((obj) => {
    let i = 0;
    for (; i < obj.rooms.length; i++) {
      webHandlers[i] = new import_webHandler.WebH(obj.rooms[i]);
    }
    for (let j = 0; j < obj.hidRooms.length; j++) {
      hidRooms.push("HIDDEN|" + obj.hidRooms[j]);
      import_server2.hidEvents.push([]);
      import_server2.hidUserEvents.push([]);
      import_server2.hidUsers.push([]);
      webHandlers[i + j] = new import_webHandler.WebH(obj.hidRooms[j], true);
    }
    console.log("WebHandlers loaded. Sysrooms:", sysRooms, "hidden rooms:", hidRooms);
  });
  (0, import_wordListHandle.loopy)();
  setInterval(() => {
    (0, import_accessControl.DBGarbageCollect)();
  }, 1e4);
}
let webHandlers = [];
init();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hidRooms,
  init,
  sysRooms,
  webHandlers
});
//# sourceMappingURL=initialiser.js.map
