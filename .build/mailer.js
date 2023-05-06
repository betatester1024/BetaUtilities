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
async function mail(email, token2) {
  const { requestId } = await courier.send({
    message: {
      to: {
        email
      },
      content: {
        title: "Password Reset Request",
        body: "Click the following link to reset your password: https://www.example.com/reset-password?token=" + token2
      },
      routing: {
        method: "single",
        channels: ["email"]
      }
    }
  });
  console.log(requestId);
}
const token = generateTokenForUser();
mail(userEmail, token);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mail
});
//# sourceMappingURL=mailer.js.map
