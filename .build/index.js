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
var betatester1024_exports = {};
__export(betatester1024_exports, {
  DBConnectFailure: () => DBConnectFailure,
  connectionSuccess: () => connectionSuccess
});
module.exports = __toCommonJS(betatester1024_exports);
var import_server = require("./server");
var import_database = require("./database");
var import_supportRooms = require("./supportRooms");
var import_logging = require("./logging");
var import_consts = require("./consts");
var import_wsHandler = require("./betautilities/wsHandler");
var import_webHandler = require("./betautilities/webHandler");
var import_wordler = require("./betautilities/wordler");
var import_mailer = require("./mailer");
let connectionSuccess = true;
let DBConnectFailure = null;
const { exec } = require("child_process");
try {
  (0, import_mailer.authorize)().then(() => {
    console.log("authorised");
  }).catch(console.error);
  if (connectionSuccess)
    (0, import_database.connectDB)().then((thing) => {
      console.log(thing);
      if (!connectionSuccess)
        return;
      (0, import_server.initServer)();
      (0, import_database.DBMaintenance)();
      (0, import_wordler.serverUpdate)();
      (0, import_logging.log)("Systems restarted");
      import_consts.uDB.findOne({ fieldName: "ROOMS" }).then((obj) => {
        console.log(obj);
        for (let i = 0; i < obj.euphRooms.length; i++) {
          import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("EUPH_ROOM", obj.euphRooms[i]));
          new import_wsHandler.WS("wss://euphoria.io/room/" + obj.euphRooms[i] + "/ws", "BetaUtilities", obj.euphRooms[i], false);
          (0, import_logging.log)("Connected euph_room") + obj.euphRooms[i];
          console.log("Connected euph_room", obj.euphRooms[i]);
        }
        for (let i = 0; i < obj.rooms.length; i++) {
          new import_webHandler.WebH(obj.rooms[i], false);
          console.log("Loaded support room", obj.rooms[i]);
        }
        for (let i = 0; i < obj.hidRooms.length; i++) {
          new import_webHandler.WebH(obj.hidRooms[i], true);
          console.log("Loaded hidden support room", obj.hidRooms[i]);
        }
      });
    });
  DBConnectFailure = setTimeout(() => {
    connectionSuccess = false;
    console.log("Connection failed");
    (0, import_logging.log)("Services failed. Rebooting now.");
    (0, import_server.initServer)();
    (0, import_wordler.serverUpdate)();
    setTimeout(() => {
      exec("kill 1");
    }, 1e4);
  }, 29e3);
} catch (e) {
  console.log(e);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DBConnectFailure,
  connectionSuccess
});
//# sourceMappingURL=index.js.map
