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
var messageHandle_exports = {};
__export(messageHandle_exports, {
  replyMessage: () => replyMessage,
  uptime: () => uptime,
  wordleUpdate: () => wordleUpdate
});
module.exports = __toCommonJS(messageHandle_exports);
var import_wsHandler = require("./wsHandler");
var import_logging = require("../logging");
var import_cuebot = require("./cuebot");
var import_wordler = require("./wordler");
var import_consts = require("../consts");
var import_supportRooms = require("../supportRooms");
const fs = require("fs");
const serviceKey = process.env["serviceKey"];
const serviceResponse = process.env["serviceResponse"];
let DATE = new Date();
let VERSION = "ServiceVersion BETA 2.5671 | Build-time: " + DATE.toUTCString();
const HELPTEXT2 = `Press :one: to reboot services. Press :two: to play wordle! Press :three: to toggle ANTISPAM.\\n\\n Press :zero: to exit support at any time.`;
let workingUsers = [];
let leetlentCt = 1;
let wordleCt = 1;
let STARTTIME = Date.now();
function replyMessage(hnd, msg, sender, data) {
  msg = msg.toLowerCase();
  if (msg.match("@" + hnd.nick.toLowerCase())) {
    hnd.incrPingCt();
  }
  (0, import_cuebot.cueBot)(hnd, msg, sender, data);
  if (msg == "!debugwordle") {
    (0, import_logging.systemLog)(import_wordler.validWords[import_wordler.todayWordID] + " " + import_wordler.todayLeetCODE.join(""));
    return "> See console <";
  }
  if (msg == "!branch") {
    return process.env["branch"];
  }
  if (msg == "!acquirecake") {
    return ":cake:";
  }
  if (msg == "!conjure @" + hnd.nick.toLowerCase()) {
    if (hnd.socket)
      setTimeout(() => {
        hnd.socket.close();
      }, 120);
    else
      hnd.delaySendMsg("/me reboots", data, 200);
    return "/me r\xF6lls b\xFF and spontaneously combusts";
  }
  if (msg == "!reboot @" + hnd.nick.toLowerCase()) {
    if (hnd.socket)
      setTimeout(() => {
        hnd.socket.close();
      }, 120);
    else
      hnd.delaySendMsg("/me reboots", data, 200);
    return "/me is rebooting";
  }
  let imgMatch = msg.match(/!unblockimg (.*)/);
  if (imgMatch) {
    return "https://external-content.duckduckgo.com/iu/?u=" + encodeURIComponent(imgMatch[1]);
  }
  if (msg.match(/!pasteit!?/gimu))
    return "https://betatester1024.repl.co/paste";
  if (msg.match("^!uptime @" + hnd.nick.toLowerCase() + "$")) {
    hnd.clearCallReset();
    getUptimeStr(STARTTIME).then((value) => {
      getUptimeStr().then((value2) => {
        hnd.delaySendMsg(value + " (Total uptime: " + value2 + ")", data, 0);
      });
    });
    return "";
  }
  let match_r = msg.match(/preview\.redd\.it\/(.*\.(jpg|png|jpeg|gif|bmp))/igmu);
  if (match_r) {
    return match_r[0].replace("preview.redd.it", "i.redd.it");
  }
  if (msg == "!issue" || msg == "!bug" || msg == "!feature") {
    return "https://github.com/betatester1024/BetaUtilities/issues/new/choose";
  }
  if (msg.match(/(\W|^)ass(\W|$)/) && Math.random() < 0.2) {
    hnd.delaySendMsg("arse*", data, 0);
  }
  if (msg.match(/(\W|^)asses(\W|$)/) && Math.random() < 0.2) {
    hnd.delaySendMsg("arses*", data, 0);
  }
  if (msg.match(/(\W|^)asshole(s?)(\W|$)/) && Math.random() < 0.2) {
    hnd.delaySendMsg("arsehole*", data, 0);
  }
  if (msg.match(/(\W|^)dumbass(es?)(\W|$)/) && Math.random() < 0.2) {
    hnd.delaySendMsg("fucking imbecile*", data, 0);
  }
  if (msg.match(/(\W|^)asshat(s?)(\W|$)/) && Math.random() < 0.2) {
    hnd.delaySendMsg("fucking imbecile*", data, 0);
  }
  import_consts.uDB.findOne({ fieldName: "WORKINGUSERS" }).then((obj) => {
    let match3 = msg.match("^!work @(.*)$");
    let workingUsers2 = obj.working;
    if (match3 || msg == "!work") {
      if (match3 && workingUsers2.indexOf(norm(match3[1].toLowerCase())) >= 0) {
        hnd.delaySendMsg("This user is already supposed to be working!", data, 0);
        return;
      } else if (match3) {
        workingUsers2.push(norm(match3[1].toLowerCase()));
        (0, import_logging.systemLog)("WORKACTIVATE in room: " + hnd.roomName + " by " + sender);
        hnd.delaySendMsg("Will scream at @" + norm(match3[1]), data, 0);
      } else if (workingUsers2.indexOf(norm(sender.toLowerCase())) < 0) {
        workingUsers2.push(norm(sender.toLowerCase()));
        hnd.changeNick("WorkBot V2");
        setTimeout(() => hnd.changeNick(hnd.nick), 200);
      } else {
        hnd.delaySendMsg("Wait, you're already in the work- GET TO WORK.", data, 0);
        return;
      }
    }
    match3 = msg.match("^!play @(.*)$");
    if (match3 || msg == "!play") {
      if (match3 && workingUsers2.indexOf(norm(match3[1].toLowerCase())) < 0) {
        hnd.delaySendMsg("This user was not working in the first place.", data, 0);
        return;
      } else if (match3) {
        workingUsers2.splice(workingUsers2.indexOf(norm(match3[1].toLowerCase())), 1);
        hnd.delaySendMsg("They're off the hook... for now.", data, 0);
      } else {
        workingUsers2.splice(workingUsers2.indexOf(norm(sender.toLowerCase())), 1);
        hnd.delaySendMsg("You're off the hook... for now.", data, 0);
      }
    }
    if (workingUsers2.indexOf(norm(sender.toLowerCase())) >= 0) {
      hnd.changeNick("WorkBot V2");
      hnd.delaySendMsg("GET TO WORK.", data, 0);
      setTimeout(() => hnd.changeNick(hnd.nick), 200);
    }
    ;
    import_consts.uDB.updateOne(
      { fieldName: "WORKINGUSERS" },
      {
        $set: { working: workingUsers2 },
        $currentDate: { lastModified: true }
      }
    );
  });
  import_consts.uDB.findOne({ fieldName: "SLEEPINGUSERS" }).then((obj) => {
    let match3 = msg.match("^!sleep @(.*)$");
    let sleepingUsers = obj.sleeping;
    if (match3 || msg == "!sleep") {
      if (match3 && sleepingUsers.indexOf(norm(match3[1].toLowerCase())) >= 0) {
        hnd.delaySendMsg("This user is already supposed to be sleeping!", data, 0);
        return;
      } else if (match3) {
        sleepingUsers.push(norm(match3[1].toLowerCase()));
        (0, import_logging.systemLog)("SLEEPACTIVATE in room: " + hnd.roomName + " by " + sender);
        hnd.delaySendMsg("Will scream at @" + norm(match3[1]), data, 0);
      } else if (sleepingUsers.indexOf(norm(sender.toLowerCase())) < 0) {
        sleepingUsers.push(norm(sender.toLowerCase()));
        hnd.changeNick("SleepBot V2");
        setTimeout(() => hnd.changeNick(hnd.nick), 200);
      } else {
        hnd.delaySendMsg("Wait, you're already in the- GO TO SLEEP", data, 0);
        return;
      }
    }
    match3 = msg.match("^!wake @(.*)$");
    if (match3 || msg == "!wake") {
      if (match3 && sleepingUsers.indexOf(norm(match3[1].toLowerCase())) < 0) {
        hnd.delaySendMsg("This user was not sleeping in the first place.", data, 0);
        return;
      } else if (match3) {
        sleepingUsers.splice(sleepingUsers.indexOf(norm(match3[1].toLowerCase())), 1);
        hnd.delaySendMsg("They're off the hook... for now.", data, 0);
      } else {
        sleepingUsers.splice(sleepingUsers.indexOf(norm(sender.toLowerCase())), 1);
        hnd.delaySendMsg("You're off the hook... for now.", data, 0);
      }
    }
    if (sleepingUsers.indexOf(norm(sender.toLowerCase())) >= 0) {
      hnd.changeNick("SleepBot V2");
      hnd.delaySendMsg("GO TO SLEEP.", data, 0);
      setTimeout(() => hnd.changeNick(hnd.nick), 200);
    }
    ;
    import_consts.uDB.updateOne(
      { fieldName: "SLEEPINGUSERS" },
      {
        $set: { sleeping: sleepingUsers },
        $currentDate: { lastModified: true }
      }
    );
  });
  let match4 = msg.match("^!about @(.+)");
  if (match4 && match4[1]) {
    import_consts.authDB.findOne({ fieldName: "AboutData", user: { $eq: norm(match4[1]).toLowerCase() } }).then((obj) => {
      if (obj && obj.about)
        hnd.delaySendMsg("About @" + norm(match4[1]) + ": " + obj.about.replaceAll(/\\/gm, "\\\\").replaceAll(/"/gm, '\\"'), data, 0);
      else
        hnd.delaySendMsg("No information about @" + norm(match4[1]), data, 0);
    });
    return "";
  }
  match4 = msg.match("^!about set (.+)");
  if (match4) {
    import_consts.authDB.updateOne(
      { fieldName: "AboutData", user: { $eq: norm(sender.toLowerCase()) } },
      {
        $set: { about: match4[1] },
        $currentDate: { lastModified: true }
      },
      { upsert: true }
    );
    return "Set information for @" + norm(sender);
  }
  let match = msg.match("^!remind(me | +@[^ ]+ )(in )?()()([0-9.]+\\s*d)?\\s*([0-9.]+\\s*h)?\\s*([0-9.]+\\s*m)?\\s*([0-9.]+\\s*s)?(.+)");
  if (match) {
    console.log(match);
    let remindUser = match[1];
    let remindMsg = match[9];
    console.log(match[4] + "," + match[5] + "," + match[6] + "," + match[7] + "," + match[8]);
    let exp4 = Date.now();
    if (match[5])
      exp4 += Number(match[5].split("d")[0]) * 1e3 * 60 * 60 * 24;
    if (match[6])
      exp4 += Number(match[6].split("h")[0]) * 1e3 * 60 * 60;
    if (match[7])
      exp4 += Number(match[7].split("m")[0]) * 1e3 * 60;
    if (match[8])
      exp4 += Number(match[8].split("s")[0]) * 1e3;
    if (exp4 == Date.now()) {
      return "No reminder time provided! Syntax: !remindme 1d2h3m4s message OR !remind @user 1d2h3m4s message";
    }
    import_consts.uDB.insertOne({
      fieldName: "TIMER",
      expiry: exp4,
      notifyingUser: remindUser == "me " ? norm(sender) : remindUser.slice(2, remindUser.length - 1),
      msg: remindMsg,
      author: remindUser == "me " ? null : norm(sender)
    });
    return "Will remind " + (remindUser == "me " ? "you" : remindUser.slice(2, remindUser.length - 1)) + " in " + ((exp4 - Date.now()) / 6e4).toFixed(2) + "min";
  } else if (msg.match(/^!remind/)) {
    return "Syntax: !remindme 1d2h3m4s message OR !remind @user 1d2h3m4s message";
  }
  if (msg == "!renick") {
    hnd.changeNick(hnd.nick);
    return ":white_check_mark:";
  }
  if (msg == "!leet") {
    hnd.changeNick(hnd.nick);
    return "https://euphoria.leet.nu/room/" + hnd.roomName;
  }
  if (msg == "!instant") {
    hnd.changeNick(hnd.nick);
    return "https://instant.leet.nu/room/" + hnd.roomName;
  }
  let tellMatch = msg.match("^!yell (@[^ ]+ .*)");
  if (tellMatch) {
    hnd.changeNick(sender);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    return "!tell " + tellMatch[1].toUpperCase();
  }
  if (msg.match("!version[ ]+@" + hnd.nick.toLowerCase())) {
    return VERSION;
  }
  let match2 = msg.match("@" + hnd.nick.toLowerCase() + " !mitoseto &([a-z0-9]+) as @(.+)");
  if (match2) {
    (0, import_logging.systemLog)(match2);
    let newNick = match2[2] == null ? "BetaUtilities" : match2[2];
    if (import_supportRooms.supportHandler.mitoseable(match2[1]))
      return "We're already in this room!";
    try {
      new import_wsHandler.WS("wss://euphoria.io/room/" + match2[1] + "/ws", newNick, match2[1], false);
    } catch (e) {
      (0, import_logging.systemLog)(e);
    }
    import_supportRooms.supportHandler.addRoom(new import_supportRooms.Room("EUPH_ROOM", match2[1]));
    return "Sent @" + newNick + " to &" + match2[1];
  }
  if (msg.match("^!runstats [ ]*@" + hnd.nick.toLowerCase())) {
    hnd.displayStats(data);
    return "Loading...";
  }
  if (msg == "!docs @" + hnd.nick.toLowerCase()) {
    return "https://betatester1024.repl.co/commands?nick=BetaUtilities";
  }
  if (msg.match(/^!potato$/))
    return "potato.io";
  if (msg == "!rating @" + hnd.nick.toLowerCase()) {
    import_consts.uDB.findOne({ fieldName: "RATING" }).then(
      (obj) => {
        let r = "Current @" + hnd.nick + " rating - " + (obj.SUM / obj.COUNT).toFixed(2);
        hnd.delaySendMsg(r, data, 0);
      }
    );
  }
  if (msg == "!enablelogging" || msg == "!enablelogging @" + hnd.nick.toLowerCase()) {
    hnd.DATALOGGING = true;
    return "Enabled message logging.";
  }
  if (msg == "!disablelogging" || msg == "!disablelogging @" + hnd.nick.toLowerCase()) {
    hnd.DATALOGGING = false;
    return "Disabled message logging.";
  }
  if (msg == "!status" || msg == "!status @" + hnd.nick.toLowerCase()) {
    return "Status-tracker: https://betatester1024.repl.co/status";
  }
  if (msg == "!systemhome" || msg == "!systemhome @" + hnd.nick.toLowerCase()) {
    return "https://betatester1024.repl.co";
  }
  if (msg == "!syslog" || msg == "!syslog @" + hnd.nick.toLowerCase()) {
    return "https://betatester1024.repl.co/syslog";
  }
  if (msg.match("^!die$")) {
    if (hnd.socket)
      setTimeout(() => {
        hnd.socket.close();
      }, 120);
    else
      hnd.delaySendMsg("/me reboots", data, 200);
    hnd.delaySendMsg("/me crashes", data, 100);
    return "aaaaghhh! death! blood! i'm dying!";
  }
  if (msg == "!activerooms @" + hnd.nick.toLowerCase()) {
    let str = "/me is in: ";
    let euphRooms = [];
    return str + import_supportRooms.supportHandler.listAllRooms().join(", ") + "!";
  }
  if (msg == "!pong" || msg == "!pong @" + hnd.nick.toLowerCase()) {
    hnd.delaySendMsg(":egg:", data, 1500);
    return "ping!";
  }
  if (msg.match("(!help[ ]+@" + hnd.nick.toLowerCase() + "$|^[ ]+!help[ ]+$)|!contact @" + hnd.nick.toLowerCase()) != null) {
    if (hnd.transferOutQ)
      return "Due to spamming concerns, please start your call in another room like &test or &bots! \\nThank you for your understanding.\\n Enter !help @" + hnd.nick + " -FORCE to enter the help-menu here.";
    if (hnd.callStatus == 6)
      return "You're currently on hold! A moment, please.";
    hnd.callStatus = 0;
    hnd.bumpCallReset(data);
    return "Welcome to BetaOS Services! Press :one: to connect! Press :zero: to end call at any time.";
  }
  if (msg == "!help @" + hnd.nick.toLowerCase() + " -force") {
    hnd.callStatus = 0;
    hnd.bumpCallReset(data);
    return "Welcome to BetaOS Services! Press :one: to connect! Press :zero: to end call at any time.";
  }
  if (hnd.callStatus != -1 && (msg == "zero" || msg == "0" || msg == ":zero:")) {
    hnd.clearCallReset();
    hnd.callStatus = -1;
    return "[CALLEND] Thank you for calling BetaOS services!";
  }
  if (hnd.callStatus == 0 && (msg == "2" || msg == ":two:" || msg == "two")) {
    hnd.bumpCallReset(data);
    hnd.callStatus = 3;
    return "Are you sure you would like to proceed? Press :two: to continue.";
  }
  if (hnd.callStatus == 0 && msg == "*#0*#") {
    hnd.clearCallReset();
    hnd.callStatus = -1;
    return "System - BetaOS_OnboardHelpline | Version" + VERSION;
  }
  if (hnd.callStatus == 3 && (msg == "2" || msg == ":two" || msg == "two")) {
    hnd.clearCallReset();
    hnd.callStatus = -1;
    let encr = process.env["SystemEncrypted"];
    if (!encr)
      encr = "Cannot find SystemEncrypted string!";
    return encr;
  }
  let exp = /^((?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/;
  let exp2 = /^!unblock[ ]+((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/;
  let exp3 = /^!unblock[ ]+((?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/;
  if (msg.length > 1e4)
    return "ERROR: Your message is way too long.";
  match = hnd.callStatus == 2 ? msg.match(exp) : msg.match(exp2);
  if (match) {
    hnd.callStatus = -1;
    hnd.clearCallReset();
    if (msg.match(exp3))
      match = msg.match(exp3);
    return "https://womginx.betatester1024.repl.co/main/https://" + match[1] + "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";
  }
  if (hnd.callStatus == 0 && (msg == ":one:" || msg == "one" || msg == "1")) {
    hnd.bumpCallReset(data);
    hnd.callStatus = 1;
    return "Welcome to BetaOS Services! Enter :one: to inquire about our services. Enter :two: to speak to a manager. Composez le :three: pour service en fran\xE7ais. Press :four: for direct access to the code. Press :five: to unblock a link manually. Press :six: for more information about the creator. Press :seven: to enter your access code. Press :eight: to provide feedback on our calling services! Press :nine: for more options. \\n\\nPress :zero: to end call at any time.";
  }
  if (hnd.callStatus == 1 && (msg == ":one:" || msg == "one" || msg == "1")) {
    hnd.clearCallReset();
    return "Important commands: !ping, !help, !pause, !restore, !kill, !pong, !uptime, !uuid. \\n Bot-specific commands: see https://betatester1024.repl.co/commands?nick=BetaUtilities";
  }
  if (hnd.callStatus == 1 && (msg == ":two:" || msg == "two" || msg == "2")) {
    hnd.delaySendMsg("/me crashes", data, 3e3);
    hnd.clearCallReset();
    setTimeout(() => {
      hnd.errorSocket();
    }, 3e3);
    hnd.callStatus = 99;
    return "Connecting you to a human now.";
  }
  if (hnd.callStatus == 1 && (msg == ":three:" || msg == "three" || msg == "3")) {
    hnd.clearCallReset();
    hnd.delaySendMsg("/me est en panne D:", data, 500);
    setTimeout(() => {
      hnd.errorSocket();
    }, 500);
    hnd.callStatus = 99;
    return "Bienvenue aux syst\xE8mes B\xE9taOS. T\xE9l\xE9chargement en cours des commandes disponibles, un moment SVP.";
  }
  if (msg == "!src @" + hnd.nick.toLowerCase() || hnd.callStatus == 1 && (msg == ":four:" || msg == "four" || msg == "4")) {
    hnd.clearCallReset();
    hnd.callStatus = -1;
    return "> Source code: https://replit.com/@betatester1024/betatester1024/";
  }
  if (hnd.callStatus == 1 && (msg == ":five:" || msg == "five" || msg == "5")) {
    hnd.bumpCallReset(data);
    hnd.callStatus = 2;
    return "We're listening.";
  }
  if (msg == "!creatorinfo" || hnd.callStatus == 1 && (msg == ":six:" || msg == "six" || msg == "6")) {
    hnd.clearCallReset();
    hnd.callStatus = -1;
    return "BetaUtilities, created by @betatester1024.\\nVersion: " + VERSION + "\\nHosted on repl.it free hosting; Only online when the creator is. \\nUnblockers forked by @betatester1024 and should be able to automatically come online.\\n:white_check_mark: BetaOS services ONLINE";
  }
  if (hnd.callStatus == 1 && (msg == ":seven:" || msg == "seven" || msg == "7")) {
    hnd.bumpCallReset(data);
    hnd.callStatus = 7;
    return "We're listening.";
  }
  if (hnd.callStatus == 7) {
    hnd.callStatus = -1;
    if (msg == serviceKey) {
      if (!serviceResponse)
        throw "NO RESPONSE";
      else
        return serviceResponse;
    } else
      return "AccessRequest Failed";
  }
  if (hnd.callStatus == 1 && (msg == ":nine:" || msg == "nine" || msg == "9")) {
    hnd.clearCallReset();
    hnd.callStatus = 6;
    hnd.callReset = setTimeout(() => {
      let r = "/me We are currently experiencing high call volumes. Response times may be higher than average.";
      if (Math.random() > 0.9)
        hnd.sendMsg(r, data);
      hnd.callReset = setTimeout(() => {
        hnd.sendMsg(HELPTEXT2, data);
        hnd.bumpCallReset(data);
        hnd.callStatus = 5;
      }, Math.random() * 5e3 + 2e3);
    }, Math.random() * 15e3 + 5e3);
    return "You've been put on hold. Press :one: to scream into the phone. Press :zero: to exit support at any time.";
  }
  if (hnd.callStatus == 6 && (msg == ":one:" || msg == "one" || msg == "1")) {
    hnd.callStatus = 5;
    hnd.bumpCallReset(data);
    let r = HELPTEXT2;
    hnd.delaySendMsg(r, data, 200);
    return "Alright, alright. Give me a second.";
  }
  if (hnd.callStatus == 1 && (msg == ":eight:" || msg == "eight" || msg == "8")) {
    hnd.callStatus = 4;
    hnd.bumpCallReset(data);
    return "Please rate our services from one to five.";
  }
  if (hnd.callStatus == 4) {
    let dv = 0;
    if (msg == ":one:" || msg == "one" || msg == "1")
      dv = 1;
    else if (msg == ":two:" || msg == "two" || msg == "2")
      dv = 2;
    else if (msg == ":three:" || msg == "three" || msg == "3")
      dv = 3;
    else if (msg == ":four:" || msg == "four" || msg == "4")
      dv = 4;
    else if (msg == ":five:" || msg == "five" || msg == "5")
      dv = 5;
    else {
      return "I don't think you entered that right.";
    }
    import_consts.uDB.findOne({ fieldName: "RATING" }).then((obj) => {
      import_consts.uDB.updateOne({ fieldName: "RATING" }, {
        $set: {
          SUM: obj.SUM + dv,
          COUNT: obj.COUNT + 1
        },
        $currentDate: { lastModified: true }
      });
    });
    hnd.callStatus = -1;
    return "Thank you for providing a rating! Enter !rating @" + hnd.nick + " to get current rating.";
  }
  if (hnd.callStatus == 5 && (msg == "one" || msg == "1" || msg == ":one:")) {
    hnd.clearCallReset();
    if (hnd.socket)
      setTimeout(() => {
        hnd.socket.close();
      }, 120);
    else
      hnd.delaySendMsg("/me reboots", data, 200);
    return "/me reboots";
  }
  if (msg == "!wordle" || hnd.callStatus == 5 && (msg == "two" || msg == "2" || msg == ":two:")) {
    hnd.clearCallReset();
    hnd.callStatus = 8;
    return "Enter any 5-letter word. Press :one: for help on the game itself. Press :two: to try leetlen't! Press :zero: to exit.";
  }
  if (msg == "!leetlent" || msg == "!leetlen't" || hnd.callStatus == 8 && (msg == "two" || msg == "2" || msg == ":two:")) {
    hnd.callStatus = 10;
    return "Enter any 5-letter sequence of characters. Based on leet.nu/leetle.";
  }
  if (msg == "!antispam @" + hnd.nick.toLowerCase() || hnd.callStatus == 5 && (msg == "three" || msg == "3" || msg == ":three:")) {
    hnd.bumpCallReset(data);
    hnd.callStatus = 9;
    hnd.confirmcode = Math.floor(Math.random() * 1e4);
    return "[SYSWARN] Are you sure? Enter " + hnd.confirmcode + " to confirm.";
  }
  if (hnd.callStatus == 9 && msg == hnd.confirmcode.toString()) {
    hnd.bypass = !hnd.bypass;
    hnd.callTimes = [];
    hnd.clearCallReset();
    if (hnd.bypass)
      setTimeout(() => {
        hnd.bypass = false;
        hnd.callTimes = [];
        hnd.sendMsg("/me has automatically re-enabled ANTISPAM", data);
      }, 30 * 60 * 1e3);
    return "ANTISPAM is currently: " + (hnd.bypass ? "OFF" : "ON");
  }
  if (hnd.callStatus == 8 && msg.match("^[a-z]{5}$")) {
    if (import_wordler.allWords.indexOf(msg) >= 0) {
      let correctWord = import_wordler.validWords[import_wordler.todayWordID].split("");
      let out = "";
      if (msg == import_wordler.validWords[import_wordler.todayWordID]) {
        setTimeout(() => {
          hnd.resetCall(data);
        }, 200);
        setTimeout(() => {
          wordleCt = 1;
        }, 200);
        return "Correct word! You won in: " + wordleCt + " moves!";
      }
      for (let i = 0; i < 5; i++) {
        if (msg.charAt(i) == correctWord[i])
          out += "\u{1F7E9}";
        else if (correctWord.indexOf(msg.charAt(i)) >= 0)
          out += "\u{1F7E8}";
        else
          out += "\u{1F7E5}";
      }
      wordleCt++;
      return out;
    } else
      return "That's not a word!";
  }
  if (hnd.callStatus == 10 && msg.match("^[a-z0-9]{5}$")) {
    let out = "";
    if (msg == import_wordler.todayLeetCODE.join("")) {
      setTimeout(() => {
        hnd.resetCall(data);
      }, 200);
      setTimeout(() => {
        leetlentCt = 1;
      }, 200);
      return "Correct uh- character sequence! You won in: " + leetlentCt + " moves!";
    }
    for (let i = 0; i < 5; i++) {
      if (msg.charAt(i) == import_wordler.todayLeetCODE[i])
        out += "\u{1F7E9}";
      else if (import_wordler.todayLeetCODE.indexOf(msg.charAt(i)) >= 0)
        out += "\u{1F7E8}";
      else
        out += "\u{1F7E5}";
    }
    leetlentCt++;
    return out;
  }
  if (hnd.callStatus == 8 && (msg == "one" || msg == "1" || msg == ":one:")) {
    return "Enter any 5-letter word. Green tiles mean the letter is positionned in the correct location, yellow tiles mean the letter is positionned incorrectly but the letter exists in the word at least once, and red means that the letter does not exist in the word. You currently have infinite guesses.";
  }
  if (msg.match("@" + hnd.nick.toLowerCase() + "$")) {
    return "hello!";
  } else
    return "";
}
function norm(str) {
  str = str.replaceAll(/ /gm, "");
  str = str.replaceAll(/\\/gm, "\\\\");
  str = str.replaceAll(/"/gm, '\\"');
  return str.replaceAll(" ", "");
}
function wordleUpdate() {
}
async function uptime(token) {
  let time = await import_consts.uDB.findOne({ fieldName: "UPTIME" });
  return { status: "SUCCESS", data: { up: Date.now() - STARTTIME, total: time.uptime }, token };
}
async function getUptimeStr(STARTTIME2 = -1) {
  if (STARTTIME2 < 0) {
    let time = await import_consts.uDB.findOne({ fieldName: "UPTIME" });
    return formatTime(time.uptime);
  }
  let timeElapsed = Date.now() - STARTTIME2;
  let date = new Date(STARTTIME2);
  var usaTime = date.toLocaleString("en-US", { timeZone: "America/New_York" });
  console.log("USA time: " + usaTime);
  return `/me has been up since ${date.toUTCString()} / EST: ${usaTime} | Time elapsed: ${formatTime(timeElapsed)}`;
}
function formatTime(ms) {
  let seconds = ms / 1e3;
  const days = Math.floor(seconds / 3600 / 24);
  seconds = seconds % (3600 * 24);
  const hours = Math.floor(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds);
  seconds = seconds % 60;
  return (days == 0 ? "" : days + " day" + (days == 1 ? "" : "s") + ", ") + format(hours) + ":" + format(minutes) + ":" + format(seconds);
}
function format(n) {
  return n < 10 ? "0" + n : n;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  replyMessage,
  uptime,
  wordleUpdate
});
//# sourceMappingURL=messageHandle.js.map
