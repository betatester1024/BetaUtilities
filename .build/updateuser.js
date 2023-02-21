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
var updateuser_exports = {};
__export(updateuser_exports, {
  updateuser: () => updateuser
});
module.exports = __toCommonJS(updateuser_exports);
var import_wsHandler = require("./wsHandler");
var bcrypt = require("bcrypt");
function updateuser() {
  import_wsHandler.WS.db.set("betatester1024", bcrypt.hashSync(process.env["betatester1024"], 8));
  import_wsHandler.WS.db.set("betatester1024^PERM", "2");
  import_wsHandler.WS.db.set("user", bcrypt.hashSync("pass", 8));
  import_wsHandler.WS.db.set("user^PERM", "1");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateuser
});
//# sourceMappingURL=updateuser.js.map
