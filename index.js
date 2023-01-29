// CopyRight (c) 2023 BetaOS
////<reference path="messageHandler.js"/>
console.log("Loading.")
const WebSocket = require('ws');
const serviceKey = process.env['serviceKey'];
const serviceResponse = process.env['serviceResponse']
let DATE = new Date();
let VERSION = "ServiceVersion STABLE 1.5271 | Build-time: "+DATE.toLocaleTimeString()+", "+DATE.toLocaleDateString();
let setNickQ = [];
let sockets = [];
let rooms = ["xkcd", "test", "bots", "r"]
let SYSTEMNICK = ["BetaUtilities", "BETAUTILITIES_TEST", "BetaUtilities_BOTS", "BetaUtilities"];
let CONFIRMCODE = 0;
const HELPTEXT2 = `Press :one: to reboot services. Press :two: to play wordle! Press :three: to toggle ANTISPAM.`;
let BYPASS = [];
let PAUSEDQ = [];
let PAUSER = [];
let STARTTIME = [];
let RUNCOUNT = 0;
let PINGCOUNT = 0;
const Database = require("@replit/database");
const db = new Database();
let CALLSTATUS = [];
let CALLRESET = [];
let FAILEDQ = [];
let CALLTIMES = [];
const CALLTIMEOUT = 30000;
let leetleCt = 1, wordleCt = 1;
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
        SYSTEMNICK[i] +
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
      if (msg == "!kill @" + SYSTEMNICK[i].toLowerCase()) {
        let reply =
          `{"type":"send", "data":{"content":"/me crashes",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
        sockets[i].close(1000, "!killed by user.");
      } else if (PAUSEDQ[i] && msg == "!restore @" + SYSTEMNICK[i].toLowerCase()) {
        let reply =
          `{"type":"send", "data":{"content":"/me has been unpaused",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
        PAUSER[i] = null;
        CALLTIMES[i] = [];
        PAUSEDQ[i] = false;
      } else if (msg == "!pause @" + SYSTEMNICK[i].toLowerCase()) {
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
          SYSTEMNICK[i]+
          ` to kill this bot, or enter !restore @` +
          SYSTEMNICK[i]+
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
        (msg.match("!ping @" + SYSTEMNICK[i].toLowerCase(), "gmiu") ||
          msg.match("!help @" + SYSTEMNICK[i].toLowerCase(), "gmiu"))
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
      } else if (msg.match("!ping @" + SYSTEMNICK[i].toLowerCase() + "$")) {
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
          `{"type":"send", "data":{"content":"Enter !help @`+SYSTEMNICK[i]+` for help!",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
        db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      } else if (!PAUSEDQ[i]) {
        let outStr = replyMessage(msg.trim(), snd, data, i);
        if (FAILEDQ[i] && outStr != "") outStr = "/me is rebooting."
        if (outStr == "") return;
        if (!BYPASS[i]) {
          CALLTIMES[i].push(Date.now());
          setTimeout(() => { CALLTIMES[i].shift(); console.log("CLEAR"); }, 60*5*1000)
        }
        if (!BYPASS[i] && ((CALLTIMES[i].length >= 5 && CALLSTATUS[i] == -1) || CALLTIMES[i].length >= 7)) {
          // if (i == 2)
            if (CALLTIMES[i].length < 10) {
              outStr = i==0?outStr+"\\n[ANTISPAM] Consider moving to &bots or &test for large-scale testing. Thank you for your understanding."
                : outStr+" [ANTISPAM WARNING]";
            } else {
              outStr = outStr+"\\n[ANTISPAM] Automatically paused @"+SYSTEMNICK[i];
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
          "[CALLEND] Disconnected from BetaOS Services"
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
    SYSTEMNICK[i] +
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
      SYSTEMNICK[i] +
      `"},"id": "1"}`;
    sockets[i].send(nickreply);
    db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
    FAILEDQ[i] = false;
  }, 5000);
}

for (let i = 0; i < rooms.length; i++) {
  sockets[i] = null;
  startSocket(i);
  db.list().then(keys => { console.log(keys) })
  BYPASS[i] = false;
  PAUSEDQ[i] = false;
  PAUSER[i] = null;
  STARTTIME[i] = -1;
  CALLSTATUS[i] = -1;
  CALLRESET[i] = -1;
  FAILEDQ[i] = false;
  CALLTIMES[i] = [];
  setNickQ[i] = false;
}
function updateTime() {
  console.log(Date.now());
  setTimeout(updateTime, 10000);
}

updateTime()

const fs = require('fs')
let todayWordID = 0;
let todayLeetCODE = [];
let charSet = "0123456789abcdefghijklmnopqrstuvwxyz";
let allWords = [];
let validWords = [];
fs.readFile('wordfile.txt', (err, data) => {
    if (err) throw err;
  // console.log(data.toString())
  validWords = data.toString().split("\n");
  const str = DATE.getHours()+"/"+DATE.toLocaleDateString();
  todayWordID = Math.abs(str.hashCode())%validWords.length;
  console.log(str.hashCode(), validWords[todayWordID])
  for (let i=0; i<5; i++) {
    todayLeetCODE[i] = charSet[Math.floor((str.hashCode()%Math.pow(10, 5))/Math.pow(10, i))%charSet.length];
  } // for(i)
  console.log(todayLeetCODE);
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
  if (content.match ("@"+SYSTEMNICK[i].toLowerCase())) {
    db.get("PINGCOUNT").then((value) => { db.set("PINGCOUNT", value + 1) });
  }
  console.log(content);
  if (content == "!conjure @" + SYSTEMNICK[i].toLowerCase()) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me rölls bÿ and spontaneously combusts";
  }
  if (content == "!reboot @" + SYSTEMNICK[i].toLowerCase()) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me is rebooting";
  }
  if (content.match(/^!testfeature$/gimu)) return "@" + sender;
  if (content.match("^!uptime @" + SYSTEMNICK[i].toLowerCase() + "$", "gmiu")) {
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
  if (content.match("!version[ ]+@"+SYSTEMNICK[i].toLowerCase())) {
    console.log("AAAAA")
    return VERSION;
  }
  if (content.match("(!help[ ]+@" + SYSTEMNICK[i].toLowerCase() + "$|^[ ]+!help[ ]+$)|!contact", "gmiu") != null) {
    if (CALLSTATUS[i] == 6) return "You're currently on hold! A moment, please."
    CALLSTATUS[i] = 0;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    return "Welcome to BetaOS Services! Press :one: to connect! Press :zero: to end call at any time.";
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
  if (content.match("^!runstats [ ]*@" + SYSTEMNICK[i].toLowerCase(), "gimu")) {
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

  if (content.match("^!src @" + SYSTEMNICK[i].toLowerCase() + "$", "guim"))
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
  if (content == "!rating @" + SYSTEMNICK[i].toLowerCase()) {
    db.get("SUM").then((value) => {
      db.get("CT").then((value2) => {
        let r = "Current @" + SYSTEMNICK[i] + " rating - " + (value / value2).toFixed(2);
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
  if (content == "!activerooms @"+SYSTEMNICK[i].toLowerCase()) {
    let str = "/me is in: ";
    for (let j = 0; j < rooms.length - 1; j++) { str += "&" + rooms[j] + ", "; }
    str += "and &" + rooms[rooms.length - 1] + "!";
    return str;
  }
  if (content == "!pong"||content=="!pong @"+SYSTEMNICK[i].toLowerCase()) {
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
    return "Welcome to BetaOS Services! Enter :one: to inquire about our services. " +
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
      SYSTEMNICK[i].toLowerCase() +
      "; !runStats !testfeature, !creatorinfo, !version, !activeRooms, !die, !contact, !antispam, !rating, !wordle"
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
      if (Math.random() > 0.9) sockets[i].send(reply);
      CALLRESET[i] = setTimeout(() => {
        let reply =
          `{"type":"send", "data":{"content":"` + HELPTEXT2 + `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        console.log(reply);
        sockets[i].send(reply);
        clearTimeout(CALLRESET[i]);
        CALLRESET[i] = setTimeout(() => {
          resetCall(data, i);
        }, CALLTIMEOUT);
        CALLSTATUS[i] = 5;
      }, Math.random() * 5000 + 2000);
    }, Math.random() * 15000 + 5000);
    return "You've been put on hold. Press :one: to scream into the phone. Press :zero: to exit support at any time.";
  }
  if (CALLSTATUS[i] == 6 && (content == ":one:"||content=="one"||content=="1")) {
    CALLSTATUS[i] = 5;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    let r = "Alright, alright. Give me a second."
    let reply =`{"type":"send", "data":{"content":"`+r+`","parent":"`+data["data"]["id"]+`"}}`;
    sockets[i].send(reply);
    return HELPTEXT2;
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
    return "Thank you for providing a rating! Enter !rating @"+SYSTEMNICK[i]+" to get current rating.";
  }
  if (CALLSTATUS[i] == 5 && (content == "one" || content == "1" || content == ":one:")) {
    clearTimeout(CALLRESET[i]);
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me reboots";
  }
  if (content == "!wordle"||CALLSTATUS[i] == 5 && (content == "two" || content == "2" || content == ":two:")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = 8;
    return "Enter any 5-letter word. Press :one: for help on the game itself. Press :two: to try leetle! Press :zero: to exit.";
  }
  if (content == "!leetle" || CALLSTATUS[i] == 8 && (content == "two" || content == "2" || content == ":two:")) {
    CALLSTATUS[i] = 10;
    return "Enter any 5-letter sequence of characters. Based on leet.nu/leetle.";
  }
  if (content == "!antispam"||CALLSTATUS[i] == 5 && (content == "three" || content == "3" || content == ":three:")) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i, false);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 9;
    CONFIRMCODE =Math.floor(Math.random()*10000);
    return "[SYSWARN] Are you sure? Enter "+ CONFIRMCODE+" to confirm."; 
  }
  if (CALLSTATUS[i] == 9 && content == CONFIRMCODE) {
    BYPASS[i] = !BYPASS[i];
    CALLTIMES[i] = [];
    resetCall(data, i, false);
    if (BYPASS[i]) setTimeout(()=> {
      BYPASS[i] = false;
      CALLTIMES[i] = [];
      let reply =
        `{"type":"send", "data":{"content":"/me has automatically re-enabled ANTISPAM",
      "parent":"` +
        data["data"]["id"] +
        `"}}`;
      sockets[i].send(reply);
    }, 5*60*1000)
    return "ANTISPAM is currently: "+(BYPASS[i]?"OFF":"ON");
  }
  if (CALLSTATUS[i] == 8 && content.match("^[a-z]{5}$")) {
    if (allWords.indexOf(content)>=0) {
      let correctWord = validWords[todayWordID].split("");
      let out = "";
      if (content == validWords[todayWordID]) {
        setTimeout(()=>{resetCall(data, i, true)}, 200);
        setTimeout(()=>{wordleCt = 1;}, 200);
        return "Correct word! You won in: "+wordleCt+" moves!";
      }
      for (let i=0; i<5; i++) {
        if (content.charAt(i) == correctWord[i]) out += "🟩";
        else if (correctWord.indexOf(content.charAt(i))>=0) out += "🟨";
        else out += "🟥"
      }
      wordleCt++;
      return out;
    }
    else return "That's not a word!";
  }
  if (CALLSTATUS[i] == 10 && content.match("^[a-z0-9]{5}$")) {
    // if (allWords.indexOf(content)>=0) {
      let correctWord = validWords[todayWordID].split("");
      let out = "";
      if (content == todayLeetCODE.join("")) {
        setTimeout(()=>{resetCall(data, i, true)}, 200);
        setTimeout(()=>{leetleCt = 1;}, 200);
        return "Correct uh- character sequence! You won in: "+leetleCt+" moves!";
      }
      for (let i=0; i<5; i++) {
        if (content.charAt(i) == todayLeetCODE[i]) out += "🟩";
        else if (todayLeetCODE.indexOf(content.charAt(i))>=0) out += "🟨";
        else out += "🟥"
      }
      leetleCt++;
      return out;
    // }
    // else return "Something went terribly wrong.";
  }
  if (CALLSTATUS[i] == 8 && (content == "one" || content == "1" || content == ":one:")) {
    return "Enter any 5-letter word. Green tiles mean the letter is positionned in the correct location, yellow tiles mean the letter is positionned incorrectly but the letter exists in the word at least once, and red means that the letter does not exist in the word. You currently have infinite guesses."
  }
  if (CALLSTATUS[i] != -1 && (content == "zero" || content == "0" || content == ":zero:")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return "[CALLEND] Thank you for calling BetaOS services!"
  }
  if (content.match("@" + SYSTEMNICK[i].toLowerCase() + "$", "gmiu")) {
    return "Yes?";
  }

  else return "";
}