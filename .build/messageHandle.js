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
  rooms: () => rooms,
  updateActive: () => updateActive
});
module.exports = __toCommonJS(messageHandle_exports);
var import_wsHandler = require("./wsHandler");
var import_misc = require("./misc");
var import_wordListHandle = require("./wordListHandle");
var import_database = require("./database");
const serviceKey = process.env["serviceKey"];
const serviceResponse = process.env["serviceResponse"];
let DATE = new Date();
let VERSION = "ServiceVersion STABLE 1.5271 | Build-time: " + DATE.toUTCString();
const HELPTEXT2 = `Press :one: to reboot services. Press :two: to play wordle! Press :three: to toggle ANTISPAM.\\n\\n Press :zero: to exit support at any time.`;
let workingUsers = [];
let leetlentCt = 1;
let wordleCt = 1;
let STARTTIME = Date.now();
let rooms = [];
function updateActive(roomID, activeQ) {
  let idx = rooms.indexOf(roomID);
  if (idx < 0 && activeQ)
    rooms.push(roomID);
  else if (idx >= 0 && !activeQ)
    rooms.splice(idx, 1);
}
function replyMessage(msg, sender, data) {
  msg = msg.toLowerCase();
  if (msg.match("@" + this.nick.toLowerCase())) {
    this.incrPingCt();
  }
  if (msg == "!debugwordle") {
    (0, import_misc.systemLog)(import_wordListHandle.validWords[import_wordListHandle.todayWordID] + " " + import_wordListHandle.todayLeetCODE.join(""));
    return "> See console <";
  }
  if (msg == "!conjure @" + this.nick.toLowerCase()) {
    if (this.socket)
      setTimeout(() => {
        this.socket.close();
      }, 120);
    return "/me r\xF6lls b\xFF and spontaneously combusts";
  }
  if (msg == "!reboot @" + this.nick.toLowerCase()) {
    if (this.socket)
      setTimeout(() => {
        this.socket.close();
      }, 120);
    return "/me is rebooting";
  }
  if (msg.match(/!testfeature/gimu))
    return "@" + sender;
  if (msg.match("^!uptime @" + this.nick.toLowerCase() + "$")) {
    this.clearCallReset();
    return (0, import_misc.getUptimeStr)(STARTTIME) + " (Total uptime: " + (0, import_misc.getUptimeStr)() + ")";
  }
  if (msg == "!issue" || msg == "!bug" || msg == "!feature") {
    return "https://github.com/betatester1024/BetaUtilities/issues/new/choose";
  }
  import_database.DB.findOne({ fieldName: "WORKINGUSERS" }).then((obj) => {
    let match3 = msg.match("^!work @(.*)$");
    let workingUsers2 = obj.working;
    if (match3 || msg == "!work") {
      if (match3 && workingUsers2.indexOf(norm(match3[1].toLowerCase())) >= 0) {
        this.delaySendMsg("This user is already supposed to be working!", data, 0);
        return;
      } else if (match3) {
        workingUsers2.push(norm(match3[1].toLowerCase()));
        (0, import_misc.systemLog)("WORKACTIVATE in room: " + this.roomName + " by " + sender);
        this.delaySendMsg("Will scream at @" + norm(match3[1]), data, 0);
      } else if (workingUsers2.indexOf(norm(sender.toLowerCase())) < 0) {
        workingUsers2.push(norm(sender.toLowerCase()));
        this.changeNick("WorkBot V2");
        setTimeout(() => this.changeNick(this.nick), 10);
      } else {
        this.delaySendMsg("Wait, you're already in the work- GET TO WORK.", data, 0);
        return;
      }
    }
    match3 = msg.match("^!play @(.*)$");
    if (match3 || msg == "!play") {
      if (match3 && workingUsers2.indexOf(norm(match3[1].toLowerCase())) < 0) {
        this.delaySendMsg("This user was not working in the first place.", data, 0);
        return;
      } else if (match3) {
        workingUsers2.splice(workingUsers2.indexOf(norm(match3[1].toLowerCase())), 1);
        this.delaySendMsg("They're off the hook... for now.", data, 0);
      } else {
        workingUsers2.splice(workingUsers2.indexOf(norm(sender.toLowerCase())), 1);
        this.delaySendMsg("You're off the hook... for now.", data, 0);
      }
    }
    if (workingUsers2.indexOf(norm(sender.toLowerCase())) >= 0) {
      this.changeNick("WorkBot V2");
      this.delaySendMsg("GET TO WORK.", data, 0);
      this.changeNick(this.nick);
    }
    ;
    import_database.DB.updateOne(
      { fieldName: "WORKINGUSERS" },
      {
        $set: { working: workingUsers2 },
        $currentDate: { lastModified: true }
      }
    );
  });
  import_database.DB.findOne({ fieldName: "SLEEPINGUSERS" }).then((obj) => {
    let match3 = msg.match("^!sleep @(.*)$");
    let sleepingUsers = obj.sleeping;
    if (match3 || msg == "!sleep") {
      if (match3 && sleepingUsers.indexOf(norm(match3[1].toLowerCase())) >= 0) {
        this.delaySendMsg("This user is already supposed to be sleeping!", data, 0);
        return;
      } else if (match3) {
        sleepingUsers.push(norm(match3[1].toLowerCase()));
        (0, import_misc.systemLog)("SLEEPACTIVATE in room: " + this.roomName + " by " + sender);
        this.delaySendMsg("Will scream at @" + norm(match3[1]), data, 0);
      } else if (sleepingUsers.indexOf(norm(sender.toLowerCase())) < 0) {
        sleepingUsers.push(norm(sender.toLowerCase()));
        this.changeNick("SleepBot V2");
        setTimeout(() => this.changeNick(this.nick), 10);
      } else {
        this.delaySendMsg("Wait, you're already in the- GO TO SLEEP", data, 0);
        return;
      }
    }
    match3 = msg.match("^!wake @(.*)$");
    if (match3 || msg == "!wake") {
      if (match3 && sleepingUsers.indexOf(norm(match3[1].toLowerCase())) < 0) {
        this.delaySendMsg("This user was not sleeping in the first place.", data, 0);
        return;
      } else if (match3) {
        sleepingUsers.splice(sleepingUsers.indexOf(norm(match3[1].toLowerCase())), 1);
        this.delaySendMsg("They're off the hook... for now.", data, 0);
      } else {
        sleepingUsers.splice(sleepingUsers.indexOf(norm(sender.toLowerCase())), 1);
        this.delaySendMsg("You're off the hook... for now.", data, 0);
      }
    }
    if (sleepingUsers.indexOf(norm(sender.toLowerCase())) >= 0) {
      this.changeNick("SleepBot V2");
      this.delaySendMsg("GO TO SLEEP.", data, 0);
      this.changeNick(this.nick);
    }
    ;
    import_database.DB.updateOne(
      { fieldName: "SLEEPINGUSERS" },
      {
        $set: { sleeping: sleepingUsers },
        $currentDate: { lastModified: true }
      }
    );
  });
  if (msg == "!renick") {
    this.changeNick(this.nick);
    return ":white_check_mark:";
  }
  if (msg == "!leet") {
    this.changeNick(this.nick);
    return "https://euphoria.leet.nu/room/" + this.roomName;
  }
  if (msg == "!instant") {
    this.changeNick(this.nick);
    return "https://instant.leet.nu/room/" + this.roomName;
  }
  if (msg.match("!version[ ]+@" + this.nick.toLowerCase())) {
    return VERSION;
  }
  let match2 = msg.match("@" + this.nick.toLowerCase() + " !mitoseto &([a-z0-9]+) as @(.+)");
  if (match2) {
    (0, import_misc.systemLog)(match2);
    let newNick = match2[2] == null ? "BetaUtilities" : match2[2];
    if (rooms.indexOf(match2[1]) >= 0)
      return "We're already in this room!";
    try {
      new import_wsHandler.WS("wss://euphoria.io/room/" + match2[1] + "/ws", newNick, match2[1], false);
    } catch (e) {
      (0, import_misc.systemLog)(e);
    }
    updateActive(match2[1], true);
    return "Sent @" + newNick + " to &" + match2[1];
  }
  if (msg.match("^!runstats [ ]*@" + this.nick.toLowerCase())) {
    this.displayStats(data);
    return "Loading...";
  }
  if (msg.match(/^!potato$/))
    return "potato.io";
  if (msg == "!rating @" + this.nick.toLowerCase()) {
    import_database.DB.findOne({ fieldName: "RATING" }).then(
      (obj) => {
        let r = "Current @" + this.nick + " rating - " + (obj.SUM / obj.COUNT).toFixed(2);
        this.delaySendMsg(r, data, 0);
      }
    );
  }
  if (msg == "!status" || msg == "!status @" + this.nick.toLowerCase()) {
    return "Status-tracker: https://betatester1024.repl.co/status";
  }
  if (msg == "!systemhome" || msg == "!systemhome @" + this.nick.toLowerCase()) {
    return "https://betatester1024.repl.co";
  }
  if (msg == "!syslog" || msg == "!syslog @" + this.nick.toLowerCase()) {
    return "https://betatester1024.repl.co/syslog";
  }
  if (msg.match("^!die$")) {
    if (this.socket)
      setTimeout(() => {
        this.socket.close();
      }, 120);
    this.delaySendMsg("/me crashes", data, 100);
    return "aaaaghhh! death! blood! i'm dying!";
  }
  if (msg == "!activerooms @" + this.nick.toLowerCase()) {
    let str = "/me is in: ";
    for (let j = 0; j < rooms.length - 1; j++) {
      str += "&" + rooms[j] + ", ";
    }
    str += (rooms.length > 1 ? "and " : "") + "&" + rooms[rooms.length - 1] + "!";
    return str;
  }
  if (msg == "!pong" || msg == "!pong @" + this.nick.toLowerCase()) {
    this.delaySendMsg(":egg:", data, 1500);
    return "ping!";
  }
  if (msg.match("(!help[ ]+@" + this.nick.toLowerCase() + "$|^[ ]+!help[ ]+$)|!contact @" + this.nick.toLowerCase()) != null) {
    if (this.transferOutQ)
      return "Due to spamming concerns, please start your call in another room like &test or &bots! \\nThank you for your understanding.";
    if (this.callStatus == 6)
      return "You're currently on hold! A moment, please.";
    this.callStatus = 0;
    this.bumpCallReset(data);
    return "Welcome to BetaOS Services! Press :one: to connect! Press :zero: to end call at any time.";
  }
  if (this.callStatus != -1 && (msg == "zero" || msg == "0" || msg == ":zero:")) {
    this.clearCallReset();
    this.callStatus = -1;
    return "[CALLEND] Thank you for calling BetaOS services!";
  }
  if (this.callStatus == 0 && (msg == "2" || msg == ":two:" || msg == "two")) {
    this.bumpCallReset(data);
    this.callStatus = 3;
    return "Are you sure you would like to proceed? Press :two: to continue.";
  }
  if (this.callStatus == 3 && (msg == "2" || msg == ":two" || msg == "two")) {
    this.clearCallReset();
    this.callStatus = -1;
    let encr = process.env["SystemEncrypted"];
    if (!encr)
      encr = "Cannot find SystemEncrypted string!";
    return encr;
  }
  let exp = /^((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/;
  let exp2 = /^!unblock[ ]+((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/;
  if (msg.length > 1e4)
    return "ERROR: Your message is way too long.";
  let match = this.callStatus == 2 ? msg.match(exp) : msg.match(exp2);
  if (match) {
    this.callStatus = -1;
    this.clearCallReset();
    if (match[1].substring(0, 4) == "https://")
      return "https://womginx.betatester1024.repl.co/main/" + match[1] + "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";
    else
      return "https://womginx.betatester1024.repl.co/main/https://" + match[1] + "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";
  }
  if (this.callStatus == 0 && (msg == ":one:" || msg == "one" || msg == "1")) {
    this.bumpCallReset(data);
    this.callStatus = 1;
    return "Welcome to BetaOS Services! Enter :one: to inquire about our services. Enter :two: to speak to a manager. Composez le :three: pour service en fran\xE7ais. Press :four: for direct access to the code. Press :five: to unblock a link manually. Press :six: for more information about the creator. Press :seven: to enter your access code. Press :eight: to provide feedback on our calling services! Press :nine: for more options. \\n\\nPress :zero: to end call at any time.";
  }
  if (this.callStatus == 1 && (msg == ":one:" || msg == "one" || msg == "1")) {
    this.clearCallReset();
    return "Important commands: !ping, !help, !pause, !restore, !kill, !pong, !uptime, !uuid. \\n Bot-specific commands: see https://betatester1024.repl.co/about!";
  }
  if (this.callStatus == 1 && (msg == ":two:" || msg == "two" || msg == "2")) {
    this.delaySendMsg("/me crashes", data, 3e3);
    this.clearCallReset();
    setTimeout(() => {
      this.errorSocket();
    }, 3e3);
    this.callStatus = 99;
    return "Connecting you to a human now.";
  }
  if (this.callStatus == 1 && (msg == ":three:" || msg == "three" || msg == "3")) {
    this.clearCallReset();
    this.delaySendMsg("/me est en panne D:", data, 500);
    setTimeout(() => {
      this.errorSocket();
    }, 500);
    this.callStatus = 99;
    return "Bienvenue aux syst\xE8mes B\xE9taOS. T\xE9l\xE9chargement en cours des commandes disponibles, un moment SVP.";
  }
  if (msg == "!src @" + this.nick.toLowerCase() || this.callStatus == 1 && (msg == ":four:" || msg == "four" || msg == "4")) {
    this.clearCallReset();
    this.callStatus = -1;
    return "> Source code: https://replit.com/@betatester1024/betatester1024/";
  }
  if (this.callStatus == 1 && (msg == ":five:" || msg == "five" || msg == "5")) {
    this.bumpCallReset(data);
    this.callStatus = 2;
    return "We're listening.";
  }
  if (msg == "!creatorinfo" || this.callStatus == 1 && (msg == ":six:" || msg == "six" || msg == "6")) {
    this.clearCallReset();
    this.callStatus = -1;
    return "BetaUtilities, created by @betatester1024.\\nVersion: " + VERSION + "\\nHosted on repl.it free hosting; Only online when the creator is. \\nUnblockers forked by @betatester1024 and should be able to automatically come online.\\n:white_check_mark: BetaOS services ONLINE";
  }
  if (this.callStatus == 1 && (msg == ":seven:" || msg == "seven" || msg == "7")) {
    this.bumpCallReset(data);
    this.callStatus = 7;
    return "We're listening.";
  }
  if (this.callStatus == 7) {
    this.callStatus = -1;
    if (msg == serviceKey) {
      if (!serviceResponse)
        throw "NO RESPONSE";
      else
        return serviceResponse;
    } else
      return "AccessRequest Failed";
  }
  if (this.callStatus == 1 && (msg == ":nine:" || msg == "nine" || msg == "9")) {
    this.clearCallReset();
    this.callStatus = 6;
    this.callReset = setTimeout(() => {
      let r = "/me We are currently experiencing high call volumes. Response times may be higher than average.";
      if (Math.random() > 0.9)
        this.sendMsg(r, data);
      this.callReset = setTimeout(() => {
        this.sendMsg(HELPTEXT2, data);
        this.bumpCallReset(data);
        this.callStatus = 5;
      }, Math.random() * 5e3 + 2e3);
    }, Math.random() * 15e3 + 5e3);
    return "You've been put on hold. Press :one: to scream into the phone. Press :zero: to exit support at any time.";
  }
  if (this.callStatus == 6 && (msg == ":one:" || msg == "one" || msg == "1")) {
    this.callStatus = 5;
    this.bumpCallReset(data);
    let r = HELPTEXT2;
    this.delaySendMsg(r, data, 200);
    return "Alright, alright. Give me a second.";
  }
  if (this.callStatus == 1 && (msg == ":eight:" || msg == "eight" || msg == "8")) {
    this.callStatus = 4;
    this.bumpCallReset(data);
    return "Please rate our services from one to five.";
  }
  if (this.callStatus == 4) {
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
    import_database.DB.findOne({ fieldName: "RATING" }).then((obj) => {
      import_database.DB.updateOne({ fieldName: "RATING" }, {
        $set: {
          SUM: obj.SUM + dv,
          COUNT: obj.COUNT + 1
        },
        $currentDate: { lastModified: true }
      });
    });
    this.callStatus = -1;
    return "Thank you for providing a rating! Enter !rating @" + this.nick + " to get current rating.";
  }
  if (this.callStatus == 5 && (msg == "one" || msg == "1" || msg == ":one:")) {
    this.clearCallReset();
    if (this.socket)
      setTimeout(() => {
        this.socket.close();
      }, 120);
    return "/me reboots";
  }
  if (msg == "!wordle" || this.callStatus == 5 && (msg == "two" || msg == "2" || msg == ":two:")) {
    this.clearCallReset();
    this.callStatus = 8;
    return "Enter any 5-letter word. Press :one: for help on the game itself. Press :two: to try leetlen't! Press :zero: to exit.";
  }
  if (msg == "!leetlent" || msg == "!leetlen't" || this.callStatus == 8 && (msg == "two" || msg == "2" || msg == ":two:")) {
    this.callStatus = 10;
    return "Enter any 5-letter sequence of characters. Based on leet.nu/leetle.";
  }
  if (msg == "!antispam @" + this.nick.toLowerCase() || this.callStatus == 5 && (msg == "three" || msg == "3" || msg == ":three:")) {
    this.bumpCallReset(data);
    this.callStatus = 9;
    this.confirmcode = Math.floor(Math.random() * 1e4);
    return "[SYSWARN] Are you sure? Enter " + this.confirmcode + " to confirm.";
  }
  if (this.callStatus == 9 && msg == this.confirmcode.toString()) {
    this.bypass = !this.bypass;
    this.callTimes = [];
    this.clearCallReset();
    if (this.bypass)
      setTimeout(() => {
        this.bypass = false;
        this.callTimes = [];
        this.sendMsg("/me has automatically re-enabled ANTISPAM", data);
      }, 30 * 60 * 1e3);
    return "ANTISPAM is currently: " + (this.bypass ? "OFF" : "ON");
  }
  if (this.callStatus == 8 && msg.match("^[a-z]{5}$")) {
    if (import_wordListHandle.allWords.indexOf(msg) >= 0) {
      let correctWord = import_wordListHandle.validWords[import_wordListHandle.todayWordID].split("");
      let out = "";
      if (msg == import_wordListHandle.validWords[import_wordListHandle.todayWordID]) {
        setTimeout(() => {
          this.resetCall(data);
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
  if (this.callStatus == 10 && msg.match("^[a-z0-9]{5}$")) {
    let out = "";
    if (msg == import_wordListHandle.todayLeetCODE.join("")) {
      setTimeout(() => {
        this.resetCall(data);
      }, 200);
      setTimeout(() => {
        leetlentCt = 1;
      }, 200);
      return "Correct uh- character sequence! You won in: " + leetlentCt + " moves!";
    }
    for (let i = 0; i < 5; i++) {
      if (msg.charAt(i) == import_wordListHandle.todayLeetCODE[i])
        out += "\u{1F7E9}";
      else if (import_wordListHandle.todayLeetCODE.indexOf(msg.charAt(i)) >= 0)
        out += "\u{1F7E8}";
      else
        out += "\u{1F7E5}";
    }
    leetlentCt++;
    return out;
  }
  if (this.callStatus == 8 && (msg == "one" || msg == "1" || msg == ":one:")) {
    return "Enter any 5-letter word. Green tiles mean the letter is positionned in the correct location, yellow tiles mean the letter is positionned incorrectly but the letter exists in the word at least once, and red means that the letter does not exist in the word. You currently have infinite guesses.";
  }
  if (msg.match("@" + this.nick.toLowerCase() + "$")) {
    return "Yes?";
  } else
    return "";
}
function norm(str) {
  return str.replaceAll(" ", "");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  replyMessage,
  rooms,
  updateActive
});
//# sourceMappingURL=messageHandle.js.map
