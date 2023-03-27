"use strict";
var import_server = require("./server");
var import_database = require("./database");
var import_supportRooms = require("./supportRooms");
(0, import_server.initServer)();
(0, import_database.DBMaintenance)();
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("ONLINE_SUPPORT", "main_support"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("HIDDEN_SUPPORT", "sec_support"));
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("EUPH_ROOM", "support3"));
//# sourceMappingURL=index.js.map
