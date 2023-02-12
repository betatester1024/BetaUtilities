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
var import_server = require("./server");
let rooms = ["xkcd", "test", "bots", "ai", "err", "room", "srs", "rpg", "a", "b", "memes"];
let nicks = [
  "BetaUtilities",
  "BetaUtilities_TEST",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities",
  "BetaUtilities"
];
function init() {
  let sockets = [];
  (0, import_server.updateServer)();
  (0, import_wordListHandle.loopy)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  init
});
//# sourceMappingURL=initialiser.js.map
