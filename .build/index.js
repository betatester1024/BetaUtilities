"use strict";
var import_server = require("./server");
var import_database = require("./database");
var import_supportRooms = require("./supportRooms");
(0, import_server.initServer)();
(0, import_database.DBMaintenance)();
new import_supportRooms.Room("EUPH_ROOM");
//# sourceMappingURL=index.js.map
