"use strict";
var import_server = require("./server");
var import_database = require("./database");
var import_supportRooms = require("./supportRooms");
(0, import_server.initServer)();
(0, import_database.DBMaintenance)();
import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("main_support"));
//# sourceMappingURL=index.js.map
