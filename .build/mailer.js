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
var mailer_exports = {};
__export(mailer_exports, {
  mail: () => mail
});
module.exports = __toCommonJS(mailer_exports);
var import_courier = require("@trycourier/courier");
const courier = (0, import_courier.CourierClient)({ authorizationToken: process.env["authToken"] });
async function mail() {
  const { requestId } = await courier.send({
    message: {
      to: {
        email: "betatester1025@protonmail.com"
      },
      content: {
        title: "This is a test ",
        body: "Self-test one oh one"
      },
      routing: {
        method: "single",
        channels: ["email"]
      }
    }
  });
  console.log(requestId);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mail
});
//# sourceMappingURL=mailer.js.map
