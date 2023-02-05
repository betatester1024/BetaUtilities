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
  init: () => init
});
module.exports = __toCommonJS(initialiser_exports);
var import_wordListHandle = require("./wordListHandle");
var import_index = require("./index");
var import_messageHandle = require("./messageHandle");
let rooms = ["xkcd", "test", "bots", "ai"];
let nicks = [
  "BetaUtilities",
  "BetaUtilities_TEST",
  "BetaUtilities_BOTS",
  "BetaUtilities_AI"
];
function init() {
  let sockets = [];
  for (let i = 0; i < rooms.length; i++) {
    sockets.push(new import_index.WS("wss://euphoria.io/room/" + rooms[i] + "/ws", nicks[i], rooms[i], i == 0));
    (0, import_messageHandle.updateActive)(rooms[i], true);
  }
  (0, import_wordListHandle.loopy)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  init
});
//# sourceMappingURL=initialiser.js.map