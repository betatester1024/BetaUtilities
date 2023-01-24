// CopyRight (c) 2023 BetaOS
///<reference path="messageHandler.js"/>
console.log("Loading.")
import { replyMessage } from './messageHandler.js';
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
      } else if (msg.match("(!ping @" + SYSTEMNICK.toLowerCase() + "$|^!ping$)", "gmiu")) {
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
      } else if (msg == "!help"){
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