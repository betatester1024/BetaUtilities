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
  sendMail: () => sendMail
});
module.exports = __toCommonJS(mailer_exports);
var nodemailer = require("nodemailer");
let fs = require("fs");
function sendMail() {
  let transporter = nodemailer.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    auth: {
      user: "betaos.services@gmail.com",
      pass: process.env["emlpwd"]
    }
  });
  var mailOptions = {
    from: '"BetaOS System AutoMailer" <betaos.services@gmail.com>',
    to: "betatester1025@protonmail.com",
    subject: "This is a test.",
    text: "Testing.",
    html: fs.readFileSync("./mailtemplate.html")
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: " + info.response);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sendMail
});
//# sourceMappingURL=mailer.js.map
