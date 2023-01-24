// CopyRight (c) 2023 BetaOS
///<reference path="messageHandler.js"/>
console.log("Loading.")
const WebSocket = require('ws');
const serviceKey = process.env['serviceKey'];
const serviceResponse = process.env['serviceResponse']
let DATE = new Date();
let VERSION = "ServiceVersion Latest 0.6471 | Build-time: "+DATE.toLocaleTimeString()+", "+DATE.toLocaleDateString();
let setNickQ = [];
let sockets = [null, null, null];
let rooms = ["bots", "test", "xkcd", ""]
let SYSTEMNICK = "BetaUtilities";
let PAUSEDQ = [false, false, false];
let PAUSER = [null, null, null];
let STARTTIME = [-1, -1, -1];
let RUNCOUNT = 0;
let PINGCOUNT = 0;
const Database = require("@replit/database");
const db = new Database();
let CALLSTATUS = [-1, -1, -1];
let CALLRESET = [-1, -1, -1];
let FAILEDQ = [false, false, false];
let CALLTIMES = [];
const CALLTIMEOUT = 30000;
console.log("BetaOS services loading.");

function startSocket(i) {
  sockets[i] = new WebSocket("wss://euphoria.io/room/" + rooms[i] + "/ws");
  setNickQ[i] = false;
  sockets[i].onopen = function(e) {
    console.log("[open] Connection established");
    STARTTIME[i] = Date.now();
  };

  sockets[i].onmessage = function(event) {
    // console.log(`[message] Data received from server: ${event.data}`);
    let data = JSON.parse(event.data);
    console.log(data["type"]);
    if (data["type"] == "ping-event") {
      let reply =
        `{"type": "ping-reply","data": {"time":` +
        data["data"]["time"] +
        `},"id":"0"}`;
      sockets[i].send(reply);
    }
    if (!setNickQ[i]) {
      let nickreply =
        `
      {"type": "nick", "data": {"name": "` +
        SYSTEMNICK +
        `"},"id": "1"}`;
      sockets[i].send(nickreply);
      db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      setNickQ[i] = true;
    } // setNickQ
    if (data["type"] == "send-event") {
      // check whether the message contents match the pattern

      let msg = data["data"]["content"].toLowerCase().trim();
      let snd = data["data"]["sender"]["name"];
      // Required methods
      if (msg == "!kill @" + SYSTEMNICK.toLowerCase()) {
        let reply =
          `{"type":"send", "data":{"content":"/me crashes",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
        sockets[i].close(1000, "!killed by user.");
      } else if (PAUSEDQ[i] && msg == "!restore @" + SYSTEMNICK.toLowerCase()) {
        let reply =
          `{"type":"send", "data":{"content":"/me has been unpaused",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
        PAUSER[i] = null;
        PAUSEDQ[i] = false;
      } else if (msg == "!pause @" + SYSTEMNICK.toLowerCase()) {
        let reply =
          `{"type":"send", "data":{"content":"/me has been paused",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });

        reply =
          `{"type":"send", "data":
          {"content":
            "Enter !kill @` +
          SYSTEMNICK.toLowerCase() +
          ` to kill this bot, or enter !restore @` +
          SYSTEMNICK.toLowerCase() +
          ` to restore it."
          ,"parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
        PAUSER[i] = snd;
        PAUSEDQ[i] = true;
      } else if (
        PAUSEDQ[i] &&
        (msg.match("!ping @" + SYSTEMNICK.toLowerCase(), "gmiu") ||
          msg.match("!help @" + SYSTEMNICK.toLowerCase(), "gmiu"))
      ) {
        let reply =
          `{"type":"send", "data":{"content":"/me has been paused by @` +
          PAUSER[i] +
          `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
        return;
      } else if (msg.match("^!ping$", "gmiu")) {
        let reply2 =
          `{"type":"send", "data":{"content":"` +
          "pang!" +
          `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        setTimeout(()=>{sockets[i].send(reply2)}, 1000);
        let reply3 =
          `{"type":"send", "data":{"content":"` +
          "FUCK" +
          `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        setTimeout(()=>{sockets[i].send(reply3)}, 1500);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
        db.get("PINGCOUNT").then((value) => { db.set("PINGCOUNT", value + 1) });
      } else if (msg.match("!ping @" + SYSTEMNICK.toLowerCase() + "$")) {
        let reply3 =
          `{"type":"send", "data":{"content":"` +
          ":white_check_mark: BetaOS services ONLINE" +
          `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply3);
      }else if (msg == "!help"){
          let reply =
          `{"type":"send", "data":{"content":"Enter !help @`+SYSTEMNICK+` for help!",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      } else if (!PAUSEDQ[i]) {
        let outStr = replyMessage(msg.trim(), snd, data, i);
        if (FAILEDQ[i] && outStr != "") outStr = "/me is rebooting."
        if (outStr == "") return;
        if (true) {
          CALLTIMES.push(Date.now());
          setTimeout(() => { CALLTIMES.shift(); console.log("CLEAR"); }, 60*5*1000)
        }
        if ((CALLTIMES.length >= 5 && CALLSTATUS[i] == -1) || CALLTIMES.length >= 7) {
          // if (i == 2)
            if (CALLTIMES.length < 10) {
              outStr = i==2?"[ANTISPAM] Consider moving to &bots or &test for large-scale testing. Thank you for your understanding.\\n" + outStr
                : "[ANTISPAM] SpamWarn";
            } else {
              outStr = "[ANTISPAM] You have reached a hard rate-limit. Please calm down!"
              PAUSEDQ[i] = true;
              PAUSER[i] = "ANTISPAM_INTERNAL";
              CALLSTATUS[i] = -1;
            }
        }
        let reply =
          `{"type":"send", "data":{"content":"` +
          outStr +
          `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      }
    } // send-event received
  };

  sockets[i].onclose = function(event) {
    if (event.code != 1000) {
      console.log(i);
      setTimeout(() => { startSocket(i) }, 1000);
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.log("[close] Connection died");
    }
  };

  sockets[i].onerror = function(error) {
    console.log(error);
  };
}

function formatTime(ms) {
  // 1- Convert to seconds:
  let seconds = ms / 1000;
  // 2- Extract hours:
  const days = parseInt(seconds / 3600 / 24);
  seconds = seconds % (3600 * 24);
  const hours = parseInt(seconds / 3600); // 3,600 seconds in 1 hour
  seconds = seconds % 3600; // seconds remaining after extracting hours
  // 3- Extract minutes:
  const minutes = parseInt(seconds / 60); // 60 seconds in 1 minute
  // 4- Keep only seconds not extracted to minutes:
  seconds = parseInt(seconds);
  seconds = seconds % 60;
  return (
    days +
    " day(s), " +
    hours +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    (seconds < 10 ? "0" + seconds : seconds)
  );
}

function format(n) {
  return n < 10 ? "0" + n : n;
}

function resetCall(data, i, messageQ = true) {
  console.log(CALLSTATUS[i])
  if (CALLSTATUS[i] >= 0 && messageQ) {
    let reply =
      `{"type":"send", "data":
        {"content":
          "[Support has hung up the phone.]"
        ,"parent":"` +
      data["data"]["id"] +
      `"}}`; 
    sockets[i].send(reply);
  }
  CALLSTATUS[i] = -1;
}

function socketclose(i) {
  PAUSEDQ[i] = false;
  PAUSER[i] = null;
  CALLSTATUS[i] = -1;
  CALLRESET[i] = -1;
  let nickreply =
    `
  {"type": "nick", "data": {"name": "` +
    SYSTEMNICK +
    "[Error]" +
    `"},"id": "1"}`;
  sockets[i].send(nickreply);
  db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
  FAILEDQ[i] = true;
  setTimeout(() => {
    console.log(i);
    let nickreply =
      `
    {"type": "nick", "data": {"name": "` +
      SYSTEMNICK +
      `"},"id": "1"}`;
    sockets[i].send(nickreply);
    db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
    FAILEDQ[i] = false;
  }, 5000);
}

for (let i = 0; i < sockets.length; i++) {
  startSocket(i);
  db.list().then(keys => { console.log(keys) })
}
function loopy() {
  console.log(Date.now());
  setTimeout(loopy, 10000);
}

loopy()

const fs = require('fs')
let todayWordID = 0;
let allWords = [];
let validWords = [];
fs.readFile('wordfile.txt', (err, data) => {
    if (err) throw err;
 
  validWords = data.toString().split("\n");
  const str = DATE.toLocaleDateString();
  todayWordID = str.hashCode()%validWords.length;
  console.log(validWords[todayWordID])
})

fs.readFile('allwords.txt', (err, data) => {
    if (err) throw err;
 
  allWords = data.toString().split("\n");
})



String.prototype.hashCode = function() {
  var hash = 0,
    i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
// let todayWord = 


function replyMessage(content, sender, data, i) {
  content = content.toLowerCase();
  if (content.match ("@"+SYSTEMNICK.toLowerCase())) {
    db.get("PINGCOUNT").then((value) => { db.set("PINGCOUNT", value + 1) });
  }
  console.log(content);
  if (content == "!conjure @" + SYSTEMNICK.toLowerCase()) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me rölls bÿ and spontaneously combusts";
  }
  if (content == "!reboot @" + SYSTEMNICK.toLowerCase()) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me is rebooting";
  }
  if (content.match(/^!testfeature$/gimu)) return "@" + sender;
  if (content.match("^!uptime @" + SYSTEMNICK.toLowerCase() + "$", "gmiu")) {
    let timeElapsed = Date.now() - STARTTIME[i];
    let date = new Date(Date.now());
    return (
      "/me has been up since " +
      date.getFullYear() +
      "-" +
      format(date.getMonth() + 1) +
      "-" +
      format(date.getDate()) +
      " (It's been " +
      formatTime(timeElapsed) +
      ")"
    );
  }
  if (content.match("!version[ ]+@"+SYSTEMNICK.toLowerCase())) {
    console.log("AAAAA")
    return VERSION;
  }
  if (content.match("(!help[ ]+@" + SYSTEMNICK.toLowerCase() + "$|^[ ]+!help[ ]+$)|!contact", "gmiu") != null) {
    if (CALLSTATUS[i] == 6) return "You're currently on hold! A moment, please."
    CALLSTATUS[i] = 0;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    return "Welcome to BetaOS support! Press :one: to connect! Press :zero: to end call at any time.";
  }
  if (CALLSTATUS[i] == 0 && (content == "2" || content == ":two:" || content == "two")) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 3;
    return "Are you sure you would like to proceed? Press :two: to continue.";
  }
  if (CALLSTATUS[i] == 3 && (content == "2" || content == ":two" || content == "two")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    const encr = process.env['SystemEncrypted'];
    console.log(encr);
    return encr;
  }
  if (content.match("^!runstats [ ]*@" + SYSTEMNICK.toLowerCase(), "gimu")) {
    console.log("match")
    db.get("RUNCOUNT").then((value) => {
      RUNCOUNT = value;
      db.get("PINGCOUNT").then((value2) => {
        PINGCOUNT = value2;
        let reply =
          `{"type":"send", "data":
          {"content":
            "`+ "Run count: " + RUNCOUNT + "\\nPing count: " + PINGCOUNT + `"
          ,"parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
      })
    });
    return "Loading..."
  }
  if (content.match(/^!potato$/)) return "potato.io";

  if (content.match("^!src @" + SYSTEMNICK.toLowerCase() + "$", "guim"))
    return (
      "!tell @betatester1024 user @" +
      data["data"]["sender"]["name"] +
      " requests source-code access."
    );
  let exp = /^((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/
  let exp2 = /^!unblock [ ]+((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/
  let match = CALLSTATUS[i] == 2 ? content.match(exp, "i") : content.match(exp2, "i");
  if (match) {
    CALLSTATUS[i] = -1;
    clearTimeout(CALLRESET[i]);
    if (match[1].substring(0, 4) == "https://")
      return "https://womginx.betatester1024.repl.co/main/" + match[1] +
        "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";
    else
      return "https://womginx.betatester1024.repl.co/main/https://" + match[1] +
        "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";

  }
  if (content == "!rating @" + SYSTEMNICK.toLowerCase()) {
    db.get("SUM").then((value) => {
      db.get("CT").then((value2) => {
        let r = "Current @" + SYSTEMNICK + " rating - " + (value / value2).toFixed(2);
        let reply =
          `{"type":"send", "data":{"content":"` + r + `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        console.log(reply);
        sockets[i].send(reply);
      })
    }); return "";
  }
  if (content.match("^!die$", "gmiu")) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "aaaaghhh! death! blood! i'm dying!";
  }
  if (content == "!activerooms @"+SYSTEMNICK.toLowerCase()) {
    let str = "/me is in: ";
    for (let j = 0; j < sockets.length - 1; j++) { str += "&" + rooms[j] + ", "; }
    str += "and &" + rooms[sockets.length - 1] + "!";
    return str;
  }
  if (content == "!pong"||content=="!pong @"+SYSTEMNICK.toLowerCase()) {
    let reply =
      `{"type":"send", "data":{"content":"` +
      "FUCK" +
      `",
    "parent":"` +
      data["data"]["id"] +
      `"}}`;
    setTimeout(()=>{sockets[i].send(reply)}, 1000);
    return "pang!";
  }
  if (
    CALLSTATUS[i] == 0 &&
    (content == ":one:" || content == "one" || content == "1")
  ) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 1;
    return "Welcome to the BetaOS Call services! Enter :one: to inquire about our services. " +
      "Enter :two: to speak to a manager. " +
      "Composez le :three: pour service en français. " +
      "Press :four: for direct access to the code. " +
      "Press :five: to unblock a link manually. " +
      "Press :six: for more information about the creator. " +
      "Press :seven: to enter your access code. " +
      "Press :eight: to provide feedback on our calling services! " +
      "Press :nine: for more options. \\n" +
      "Press :zero: to end call at any time.";
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":one:" || content == "one" || content == "1")
  ) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return (
      "Important commands: !ping, !help, !pause, !restore, !kill, !pong, !uptime, !uuid. \\n " +
      "Bot-specific commands: !unblock <LINK>; !potato, !src @" +
      SYSTEMNICK.toLowerCase() +
      "; !runStats !testfeature, !creatorinfo, !version, !activeRooms, !die "
    );
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":two:" || content == "two" || content == "2")
  ) {
    // calling the manager doesn't work.
    clearTimeout(CALLRESET[i]);
    setTimeout(() => {
      let reply =
        `{"type":"send", "data":{"content":"/me crashes",
      "parent":"` +
        data["data"]["id"] +
        `"}}`;
      sockets[i].send(reply);
      db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      socketclose(i);
    }, 3000);
    CALLSTATUS[i] = 99;
    return "Connecting you to a human now.";
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":three:" || content == "three" || content == "3")
  ) {
    clearTimeout(CALLRESET[i]);
    setTimeout(() => {
      let reply =
        `{"type":"send", "data":{"content":"/me est en panne D:",
      "parent":"` +
        data["data"]["id"] +
        `"}}`;
      sockets[i].send(reply);
      db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      socketclose(i);
    }, 500);
    CALLSTATUS[i] = 99;
    return "Bienvenue aux systèmes BétaOS. Téléchargement en cours des commandes disponibles, un moment SVP.";
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":four:" || content == "four" || content == "4")
  ) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return "> Source code: https://replit.com/@betatester1024/BetaUtilities#index.js"
  }
  if (CALLSTATUS[i] == 1 && (content == ":five:" || content == "five" || content == "5")) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 2;
    return "We're listening."
  }
  if (content == "!creatorinfo" || CALLSTATUS[i] == 1 && (content == ":six:" || content == "six" || content == "6")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return "BetaUtilities, created by @betatester1024.\\nVersion: " + VERSION + "\\n" +
      "Hosted on repl.it free hosting; Only online when the creator is. \\n" +
      "Unblockers forked by @betatester1024 and should be able to automatically come online.\\n" +
      ":white_check_mark: BetaOS services ONLINE";
  }
  if (CALLSTATUS[i] == 1 && (content == ":seven:" || content == "seven" || content == "7")) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 7;
    return "We're listening."
  }
  if (CALLSTATUS[i] == 7) {
    CALLSTATUS[i] = -1;
    if (content == serviceKey) return serviceResponse;
    else return "AccessRequest Failed"
  }
  if (CALLSTATUS[i] == 1 && (content == ":nine:" || content == "nine" || content == "9")) {
    CALLSTATUS[i] = 6;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      let r = "/me We are currently experiencing high call volumes. Response times may be higher than average."
      let reply =
        `{"type":"send", "data":{"content":"` + r + `",
      "parent":"` +
        data["data"]["id"] +
        `"}}`;
      sockets[i].send(reply);
      CALLRESET[i] = setTimeout(() => {
        let r = `Press :one: to reboot services. Press :two: to play wordle!`;
        let reply =
          `{"type":"send", "data":{"content":"` + r + `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        console.log(reply);
        sockets[i].send(reply);
        CALLSTATUS[i] = 5;
      }, Math.random() * 5000 + 2000);
    }, Math.random() * 15000 + 5000);
    return "You've been put on hold. Press :zero: to exit support at any time.";
  }
  if (CALLSTATUS[i] == 1 && (content == ":eight:" || content == "eight" || content == "8")) {
    CALLSTATUS[i] = 4;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    return "Please rate our services from one to five.";
  }
  if (CALLSTATUS[i] == 4) {
    let dv = 0;
    if (content == ":one:" || content == "one" || content == "1") dv = 1;
    if (content == ":two:" || content == "two" || content == "2") dv = 2;
    if (content == ":three:" || content == "three" || content == "3") dv = 3;
    if (content == ":four:" || content == "four" || content == "4") dv = 4;
    if (content == ":five:" || content == "five" || content == "5") dv = 5;

    db.get("SUM").then((value) => {
      db.get("CT").then((value2) => {
        db.set("SUM", value + dv);
        db.set("CT", value2 + 1);
      })
    });
    CALLSTATUS[i] = -1;
    return "Thank you for providing a rating! ";
  }
  if (CALLSTATUS[i] == 5 && (content == "one" || content == "1" || content == ":one:")) {
    clearTimeout(CALLRESET[i]);
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me reboots";
  }
  if (content == "!wordle"||CALLSTATUS[i] == 5 && (content == "two" || content == "2" || content == ":two:")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = 8;
    return "Enter any 5-letter word. Press :zero: to exit.";
  }
  if (CALLSTATUS[i] == 8 && content.match("^[a-z]{5}$")) {
    if (allWords.indexOf(content)>=0) {
      let correctWord = validWords[todayWordID].split("");
      let out = "";
      if (content == validWords[todayWordID]) return "Correct word!"
      for (let i=0; i<5; i++) {
        if (content.charAt(i) == correctWord[i]) out += "🟩";
        else if (correctWord.indexOf(content.charAt(i))>=0) out += "🟨";
        else out += "🟥"
      }
      return out;
    }
    else return "That's not a word!";
  }
  if (CALLSTATUS[i] != -1 && (content == "zero" || content == "0" || content == ":zero:")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return "[CALLEND] Thank you for calling BetaOS services!"
  }
  if (content.match("@" + SYSTEMNICK.toLowerCase() + "$", "gmiu")) {
    return "Yes?";
  }

  else return "";
}