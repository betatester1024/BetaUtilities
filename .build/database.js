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
  DB: () => DB,
  database: () => database
});
module.exports = __toCommonJS(database_exports);
const { MongoClient } = require("mongodb");
const uri = "mongodb://SystemLogin:" + process.env["dbPwd"] + "@ac-rz8jdrl-shard-00-00.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-01.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-02.d8o7x8n.mongodb.net:27017/?ssl=true&replicaSet=atlas-3yyxq8-shard-0&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db("BetaOS-Database01");
const DB = database.collection("BetaUtilities");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DB,
  database
});
//# sourceMappingURL=database.js.map
