"use strict";
var import_server = require("./server");
var import_database = require("./database");
var import_supportRooms = require("./supportRooms");
var import_logging = require("./logging");
(0, import_logging.log)("Systems restarted", true);
(0, import_server.initServer)();
(0, import_database.DBMaintenance)();
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("ONLINE_SUPPORT", "main_support"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("ONLINE_SUPPORT", "betaos"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("ONLINE_SUPPORT", "betatester1024"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("ONLINE_SUPPORT", "xkcd"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("ONLINE_SUPPORT", "____----"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("HIDDEN_SUPPORT", "sec_support"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("HIDDEN_SUPPORT", "HIDSUPPORT"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("EUPH_ROOM", "support3"));
//# sourceMappingURL=index.js.map
