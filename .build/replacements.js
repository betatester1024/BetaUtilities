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
var replacements_exports = {};
__export(replacements_exports, {
  replacements: () => replacements
});
module.exports = __toCommonJS(replacements_exports);
let replacements = [
  { from: ":one:", to: "counter_1" },
  { from: ":two:", to: "counter_2" },
  { from: ":three:", to: "counter_3" },
  { from: ":four:", to: "counter_4" },
  { from: ":five:", to: "counter_5" },
  { from: ":six:", to: "counter_6" },
  { from: ":seven:", to: "counter_7" },
  { from: ":eight:", to: "counter_8" },
  { from: ":nine:", to: "counter_9" },
  { from: ":zero:", to: "counter_0" },
  { from: ":white_check_mark:", to: "check_circle" },
  { from: ":info:", to: "info" },
  { from: ":confirm:", to: "check" },
  { from: ":warn:", to: "warning" },
  { from: ":error:", to: "error" },
  { from: ":egg:", to: "egg_alt" }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  replacements
});
//# sourceMappingURL=replacements.js.map
