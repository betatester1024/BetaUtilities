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
  app.get("/config", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/config.html");
  });
  app.get("/account", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/config.html");
  });
  app.get("/logout", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/logout.html");
  });
  app.get("/accountDel", (req, res) => {
    res.sendFile(import_consts.K.frontendDir + "/delAcc.html");
  });
  app.get("*/favicon.ico", (req, res) => {
    res.sendFile(import_consts.K.rootDir + "/favicon.ico");
  });
  app.get("/*.js*", (req, res) => {
    res.sendFile(import_consts.K.jsDir + req.url);
  });
  app.get("/*.ts", (req, res) => {
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
    makeRequest(body.action, req.cookies.sessionID, body.data, (s, d, token) => {
      if (body.action == "login" || body.action == "logout" || body.action == "delAcc" || body.action == "signup")
        res.cookie("sessionID", token ? token : "", { maxAge: 1e3 * 60 * 60 * 24 * 30, httpOnly: true, secure: true, sameSite: "Strict" });
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
      callback("SUCCESS", { abc: "def", def: 5 }, token);
      break;
    case "login":
      data = data;
      validateLogin(data.user, data.pass, callback, token);
      break;
    case "signup":
      data = data;
      signup(data.user, data.pass, callback, token);
      break;
    case "userRequest":
      userRequest(callback, token);
      break;
    case "updateuser":
      data = data;
      updateUser(data.user, data.oldPass, data.pass, callback, token);
      break;
    case "delAcc":
      data = data;
      delAcc(data.user, data.pass, callback, token);
      break;
    case "logout":
      logout(callback, token);
      break;
    default:
      callback("ERROR", { error: "Unknown command string!" }, token);
  }
  return;
}
const argon2 = require("argon2");
async function validateLogin(user, pwd, callback, token) {
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token);
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token);
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: { $eq: user } });
  if (!usrInfo) {
    callback("ERROR", { error: "No such user!" }, token);
    return;
  } else if (await argon2.verify(usrInfo.pwd, pwd)) {
    let uuid = crypto.randomUUID();
    let userData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user });
    await import_consts.K.authDB.insertOne({ fieldName: "Token", associatedUser: user, token: uuid, expiry: Date.now() + import_consts.K.expiry[userData.permLevel] });
    callback("SUCCESS", { perms: usrInfo.permLevel }, uuid);
    return;
  } else {
    callback("ERROR", { error: "Password is invalid!" }, token);
    return;
  }
}
async function signup(user, pwd, callback, token) {
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token);
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token);
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user });
  if (usrInfo) {
    callback("ERROR", { error: "User is registered" }, token);
    return;
  } else {
    let hash = await argon2.hash(pwd, import_consts.K.hashingOptions);
    await import_consts.K.authDB.insertOne({ fieldName: "UserData", user, pwd: hash, permLevel: 1 });
    validateLogin(user, pwd, callback, token);
    return;
  }
}
async function userRequest(callback, token) {
  let tokenData = await import_consts.K.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    callback("ERROR", { error: "Your session could not be found!" }, "");
    return;
  }
  let userData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", { error: "Your session has expired!" }, "");
    return;
  }
  callback("SUCCESS", { user: tokenData.associatedUser, perms: userData.permLevel, expiry: tokenData.expiry }, token);
}
async function logout(callback, token) {
  await import_consts.K.authDB.deleteOne({ fieldName: "Token", token });
  callback("SUCCESS", null, "");
}
async function updateUser(user, oldPass, newPass, callback, token) {
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token);
    return;
  }
  if (oldPass.length == 0 || newPass.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token);
    return;
  }
  let tokenData = await import_consts.K.authDB.findOne({ fieldName: "Token", token });
  if (!tokenData) {
    callback("ERROR", { error: "Cannot update user information: EYour session could not be found!" }, "");
    return;
  }
  let userData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: tokenData.associatedUser });
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", { error: "Cannot update user information: Your session has expired!" }, "");
    return;
  } else if (await argon2.verify(userData.pwd, oldPass)) {
    let uuid = crypto.randomUUID();
    await import_consts.K.authDB.updateOne(
      { fieldName: "UserData", user: tokenData.associatedUser },
      { $set: { pwd: await argon2.hash(newPass, import_consts.K.hashingOptions) } }
    );
    callback("SUCCESS", { perms: userData.permLevel }, uuid);
    return;
  } else {
    callback("ERROR", { error: "Cannot update user information: password is invalid!" }, token);
    return;
  }
}
async function delAcc(user, pass, callback, token) {
  if (!user.match(import_consts.K.userRegex)) {
    callback("ERROR", { error: "Invalid user string!" }, token);
    return;
  }
  if (pass.length == 0) {
    callback("ERROR", { error: "No password provided!" }, token);
    return;
  }
  let usrInfo = await import_consts.K.authDB.findOne({ fieldName: "UserData", user: { $eq: user } });
  if (!usrInfo) {
    callback("ERROR", { error: "No such user!" }, token);
    return;
  } else if (await argon2.verify(usrInfo.pwd, pass)) {
    let userData = await import_consts.K.authDB.findOne({ fieldName: "UserData", user });
    await import_consts.K.authDB.deleteOne({ fieldName: "Token", token });
    await import_consts.K.authDB.deleteOne({ fieldName: "UserData", user });
    callback("SUCCESS", null, "");
    return;
  } else {
    callback("ERROR", { error: "Cannot delete account. Password is invalid!" }, token);
    return;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initServer
});
//# sourceMappingURL=server.js.map
