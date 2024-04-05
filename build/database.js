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
var database_exports = {};
__export(database_exports, {
  DBMaintenance: () => DBMaintenance,
  client: () => client,
  connectDB: () => connectDB,
  database: () => database
});
module.exports = __toCommonJS(database_exports);
var import_consts = require("./consts");
var import_wsHandler = require("./betautilities/wsHandler");
var import_index = require("./index");
var import_index2 = require("./index");
const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://SystemLogin:${process.env["dbPwd"]}@betaos-datacluster00.d8o7x8n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
async function connectDB() {
  try {
    await client.connect();
    clearTimeout(import_index2.DBConnectFailure);
    return null;
  } catch (e) {
    console.log(e);
    return e;
  }
}
const database = client.db("BetaOS-Database01");
async function DBMaintenance() {
  let items = await import_consts.authDB.find({ fieldName: "Token" }).toArray();
  for (let i = 0; i < items.length; i++) {
    if (!items[i].expiry || items[i].expiry < Date.now()) {
      console.log("Token from " + items[i].associatedUser + " has expired");
      await import_consts.authDB.deleteOne(items[i]);
    }
  }
  let items2 = await import_consts.msgDB.find({ fieldName: "MSG" }).toArray();
  for (let i = 0; i < items2.length; i++) {
    if (!items2[i].expiry || items2[i].expiry < Date.now()) {
      console.log("Message from " + items2[i].sender + " in room " + items2[i].room + " has expired");
      await import_consts.msgDB.deleteOne(items2[i]);
      await import_consts.msgDB.updateOne(
        { fieldName: "RoomInfo", room: items2[i].room },
        {
          $set: {
            minCt: items2[i].msgID,
            minThreadID: items2[i].threadID
          }
        }
      );
    }
  }
  ;
  if (import_index.botsStarted) {
    import_consts.uDB.find({ fieldName: "TIMER" }).toArray().then(
      (objs) => {
        for (let i = 0; i < objs.length; i++) {
          if (Date.now() > objs[i].expiry || objs[i].expiry == null) {
            console.log("NOTIFYING", objs[i]);
            import_consts.uDB.deleteOne({ fieldName: "TIMER", expiry: objs[i].expiry });
            import_wsHandler.WS.notifRoom.socket.send(
              import_wsHandler.WS.toSendInfo("!tell " + objs[i].notifyingUser + " You are reminded of: " + objs[i].msg.replaceAll(/\\/gm, "\\\\").replaceAll(/"/gm, '\\"') + ". This reminder sent by " + (objs[i].author ?? "yourself, probably."))
            );
          }
        }
      }
    );
  }
  setTimeout(DBMaintenance, 1e3);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DBMaintenance,
  client,
  connectDB,
  database
});
//# sourceMappingURL=database.js.map
