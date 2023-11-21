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
var unstable_exports = {};
__export(unstable_exports, {
  DBConnectFailure: () => DBConnectFailure,
  UPSINCESTR: () => UPSINCESTR,
  connectionSuccess: () => connectionSuccess
});
module.exports = __toCommonJS(unstable_exports);
var import_server = require("./server");
var import_database = require("./database");
var import_supportRooms = require("./supportRooms");
var import_logging = require("./logging");
var import_consts = require("./consts");
var import_wsHandler = require("./betautilities/wsHandler");
var import_webHandler = require("./betautilities/webHandler");
var import_wordler = require("./betautilities/wordler");
const fs = require("fs");
let connectionSuccess = true;
let DBConnectFailure = null;
const localEuphRooms = [];
const { exec } = require("child_process");
require("dotenv").config();
const localtunnel = require("localtunnel");
(async () => {
  const tunnel = await localtunnel({ port: 3e3, subdomain: "betaos" });
  console.log("Tunnelling at", tunnel.url);
  tunnel.on("close", () => {
    console.log("WARNING: Tunnel is closed!");
  });
})();
let timedOutQ = false;
let UPSINCESTR = "";
try {
  if (connectionSuccess)
    (0, import_database.connectDB)().then((err) => {
      if (!connectionSuccess)
        return;
      if (process.env["branch"] == "unstable" && (!process.env["promptInstances"] || process.env["promptInstances"] != "0")) {
        let readline = require("readline");
        let rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        let timeout;
        rl.question("Confirm start extra instance? ", (answer) => {
          clearTimeout(timeout);
          rl.close();
          answer = answer.trim().toLowerCase();
          if (timedOutQ)
            return;
          if (answer != "y" && answer != "yes")
            init(false);
          else {
            init(true);
          }
        });
        timeout = setTimeout(() => {
          init(false);
        }, 3e4);
      } else
        init(process.env["branch"] != "unstable");
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
async function init(startBots) {
  if (startBots)
    console.log("Starting EuphBots...");
  (0, import_server.initServer)();
  (0, import_database.DBMaintenance)();
  (0, import_wordler.serverUpdate)();
  let now = new Date(Date.now());
  UPSINCESTR = "----------------------Systems restarted at " + now.toLocaleString("en-US", { timeZone: "America/New_York" }) + "-------------------";
  (0, import_logging.log)(UPSINCESTR);
  import_consts.uDB.findOne({ fieldName: "ROOMS" }).then((obj) => {
    console.log(obj);
    if (startBots)
      for (let i = 0; i < obj.euphRooms.length; i++) {
        import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("EUPH_ROOM", obj.euphRooms[i]));
        new import_wsHandler.WS("wss://euphoria.io/room/" + obj.euphRooms[i] + "/ws", "BetaUtilities" + (process.env["branch"] == "unstable" ? "-U" : ""), obj.euphRooms[i], !(obj.euphRooms[i] == "test" || obj.euphRooms[i] == "bots"));
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DBConnectFailure,
  UPSINCESTR,
  connectionSuccess
});
//# sourceMappingURL=index.js.map
