"use strict";
var import_server = require("./server");
var import_database = require("./database");
var import_supportRooms = require("./supportRooms");
var import_logging = require("./logging");
var import_consts = require("./consts");
var import_wsHandler = require("./wsHandler");
(0, import_logging.log)("Systems restarted");
try {
  (0, import_database.connectDB)().then((thing) => {
    console.log(thing);
    (0, import_server.initServer)();
    (0, import_database.DBMaintenance)();
    import_consts.uDB.findOne({ fieldName: "ROOMS" }).then((obj) => {
      for (let i = 0; i < obj.euphRooms.length; i++) {
        import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("EUPH_ROOM", obj.euphRooms[i]));
        new import_wsHandler.WS("wss://euphoria.io/room/" + obj.euphRooms[i] + "/ws", "BetaUtilities", obj.euphRooms[i], false);
      }
      for (let i = 0; i < obj.rooms.length; i++) {
        import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("ONLINE_SUPPORT", obj.rooms[i]));
      }
      for (let i = 0; i < obj.hidRooms.length; i++) {
        import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("HIDDEN_SUPPORT", obj.hidRooms[i]));
      }
    });
  });
} catch (e) {
  console.log(e);
}
//# sourceMappingURL=index.js.map
