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
  initUsers: () => initUsers,
  updateUser: () => updateUser
});
module.exports = __toCommonJS(updateuser_exports);
var import_database = require("./database");
var bcrypt = require("bcrypt");
const DB = import_database.database.collection("SystemAUTH");
function initUsers() {
  updateUser("betatester1024", process.env["betatester1024"], 3);
  updateUser("user", "pass", 1);
}
function updateUser(username, pwd, access = -1) {
  DB.updateOne(
    { fieldName: "UserData", user: username },
    {
      $set: {
        passHash: bcrypt.hashSync(pwd, 8)
      },
      $currentDate: { lastModified: true }
    },
    { upsert: true }
  );
  if (access >= 0)
    DB.updateOne(
      { fieldName: "UserData", user: username },
      {
        $set: {
          permLevel: access
        },
        $currentDate: { lastModified: true }
      },
      { upsert: true }
    );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initUsers,
  updateUser
});
//# sourceMappingURL=updateuser.js.map
