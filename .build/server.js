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
var server_exports = {};
__export(server_exports, {
  initServer: () => initServer
});
module.exports = __toCommonJS(server_exports);
var import_consts = require("./consts");
const express = require("express");
const app = express();
const crypto = require("crypto");
const parse = require("co-body");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
var RateLimit = require("express-rate-limit");
async function initServer() {
  var limiter = RateLimit({
    windowMs: 10 * 1e3,
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429
  });
  app.use(limiter);
  app.use(new cookieParser());
  app.get("/", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/index.html");
  });
  app.get("/login", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/login.html");
  });
  app.get("/signup", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/signup.html");
  });
  app.get("*/favicon.ico", (req, res) => {
    res.sendFile(import_consts.K.rootDir + "/favicon.ico");
  });
  app.get("/*.js", (req, res) => {
    res.sendFile(import_consts.K.jsDir + req.url);
  });
  app.get("/*.css", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + req.url);
  });
  app.get("/*", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "404.html");
  });
  app.post("/server", urlencodedParser, async (req, res) => {
    var body = await parse.json(req);
    if (!body)
      res.end(JSON.stringify({ status: "ERROR", data: null }));
    makeRequest(body.action, body.token, body.data, (s, d, token) => {
      res.cookie("sessionID", token, { maxAge: 1e3 * 60 * 60 * 24 * 30, httpOnly: true, secure: true });
      res.end(JSON.stringify({ status: s, data: d }));
    });
  });
  app.listen(import_consts.K.port, () => {
    console.log(`BetaUtilities V2 listening on port ${import_consts.K.port}`);
  });
}
function makeRequest(action, token, data, callback) {
  switch (action) {
    case "test":
      callback("SUCCESS", { abc: "def", def: 5 }, token ? token : "");
      break;
    case "login":
      data = data;
      console.log(data);
      validateLogin(data.user, data.pass, callback, token);
      break;
    case "signup":
      data = data;
      signup(data.user, data.pass, callback, token);
      break;
    case "tokenReq":
      break;
    default:
      callback("ERROR", null, token ? token : "");
  }
  return;
}
const argon2 = require("argon2");
async function validateLogin(user, pwd, callback, token) {
  let start = Date.now();
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token ? token : "");
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token ? token : "");
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: { $eq: user } });
  if (!usrInfo) {
    callback("ERROR", { error: "No such user!" }, token ? token : "");
    return;
  } else if (await argon2.verify(usrInfo.pwd, pwd)) {
    let uuid = crypto.randomUUID();
    await import_consts.K.authDB.insertOne({ fieldName: "Token", associatedUser: user, token: uuid });
    callback("SUCCESS", { perms: usrInfo.permLevel }, uuid);
    console.log("Completed in " + (Date.now() - start) + "ms");
    return;
  } else {
    callback("ERROR", { error: "Password is invalid!" }, token ? token : "");
    return;
  }
}
async function signup(user, pwd, callback, token) {
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token ? token : "");
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token ? token : "");
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user });
  if (usrInfo) {
    callback("ERROR", { error: "User is registered" }, token ? token : "");
    return;
  } else {
    let hash = await argon2.hash(pwd);
    let uuid = crypto.randomUUID();
    await import_consts.K.authDB.insertOne({ fieldName: "UserData", user, pwd: hash, permLevel: 1 });
    await import_consts.K.authDB.insertOne({ fieldName: "Token", associatedUser: user, token: uuid });
    callback("SUCCESS", { perms: 1 }, uuid);
    return;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initServer
});
//# sourceMappingURL=server.js.map
