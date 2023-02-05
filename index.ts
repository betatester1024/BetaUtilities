// Copyright (c) 2023 BetaOS
import {WebSocket} from 'ws';
import {init} from './initialiser'
import {replyMessage} from './messageHandle';
import { updateActive } from './messageHandle';
const Database = require("@replit/database")

// we have a front-end!
const express = require('express');
const app = express();
const port = 4000;
import {rooms} from './messageHandle';

app.get('/', (req:any, res:any) => {
  let str = "BetaUtilities is is in: ";
  for (let j = 0; j < rooms.length - 1; j++) { 
    str += `<a href="https://euphoria.io/room/${rooms[j]}"> &${rooms[j]}</a>,` ; 
  }
  str += `and <a href="https://euphoria.io/room/${rooms[rooms.length-1]}"> &${rooms[rooms.length-1]}</a>!`;
  res.send(str);
  console.log("Accessed.")
})
app.listen(port, () => {
  console.log(`Success! Your application is running on port ${port}.`);
});
 
export class WS 
{
  static CALLTIMEOUT = 5000;
  url:string
  nick:string;
  socket: WebSocket;
  pausedQ=false;
  roomName:string;
  pauser:string|null = null;
  failedQ = false;
  callTimes:number[]=[];
  callReset:NodeJS.Timeout|null = null;
  callStatus=-1;
  transferOutQ = false; // is a room that one should recommend transferring out?
  bypass = false;
  confirmcode = -1;
  static db = new Database();
  static toSendInfo(msg: string, data:any=null) {
    if (data) return `{"type":"send", "data":{"content":"${msg}","parent":"${data["data"]["id"]}"}}`;
    else return `{"type":"send", "data":{"content":"${msg}"}`;
  }

  incrRunCt() {
    WS.db.get("RUNCOUNT").then((value:number) => { WS.db.set("RUNCOUNT", value + 1) });
  }
  incrPingCt() {
    WS.db.get("PINGCOUNT").then((value:number) => { WS.db.set("PINGCOUNT", value + 1) });
  }

  displayStats(data:any) {
    WS.db.get("RUNCOUNT").then((value:number) => {
      let RUNCOUNT = value;
      WS.db.get("PINGCOUNT").then((value2:number) => {
        let PINGCOUNT = value2;
        this.delaySendMsg("Run count: "+RUNCOUNT+"\\nPing count: "+PINGCOUNT, data, 0);
      })
    });
  }

  bumpCallReset(data:any)
  {
    if (this.callReset) 
      clearTimeout(this.callReset);
    this.callReset = setTimeout(() => {
      this.resetCall(data); 
    }, WS.CALLTIMEOUT);
  }

  clearCallReset() {
    if (this.callReset) clearTimeout(this.callReset);
    this.callStatus=-1;
  }

  resetCall(this:WS, data:any) {
    if (this.callStatus >= 0) {
      this.sendMsg("[CALLEND] Disconnected from BetaOS Services", data);
    }
    this.callStatus= -1;
  }

  replyMessage(msg:string, sender:string, data:any):string
  {
    return ""
  };

  delaySendMsg(msg:string, data:any, delay:number) {
    if (delay == 0) this.sendMsg(msg, data) // instant send
    else {
      setTimeout(()=>{
      this.sendMsg(msg, data)}, delay);
    }
    this.incrRunCt();
  }

  sendMsg(msg:string, data:any) {
    this.socket.send(WS.toSendInfo(msg, data))
  }
  
  onOpen() {
    console.log("Open in "+this.socket.url);
    app.get('/', (req:any, res:any) => {
    res.send("Open in "+this.socket.url)
    })
  }

  initNick() {
    this.changeNick(this.nick)
  }

  changeNick(nick:string) {
    this.socket.send(`{"type": "nick", "data": {"name": "${nick}"},"id": "1"}`);
  }

  onMessage(dat:string) {
    let data = JSON.parse(dat);
    if (data["type"] == "ping-event") {
      let reply = `{"type": "ping-reply","data": {"time":${data["data"]["time"]}},"id":"0"}`;
      this.socket.send(reply);
      setTimeout(this.initNick.bind(this), 3000);
    }
    if (data["type"] == "send-event") {
      // check whether the message contents match the pattern

      let msg = data["data"]["content"].toLowerCase().trim();
      let snd = data["data"]["sender"]["name"];
      console.log(`[${this.roomName}][${snd}] ${msg}`);
      // Required methods
      // !kill
      if (msg == "!kill @" + this.nick.toLowerCase()) {
        this.sendMsg("/me crashes", data);
        setTimeout(()=>{this.socket.close(1000, "!killed by user.");}, 100);
      }
        
      // !restore
      else if (this.pausedQ && msg == "!restore @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been unpaused", data);        
        this.pauser = null;
        this.callTimes = [];
        this.pausedQ = false;
      } 
        
      // !pause
      else if (msg == "!pause @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been paused", data)
        

        let reply = "Enter !kill @"+this.nick+" to kill this bot, "+
          "or enter !restore @"+this.nick+" to restore it.";
        this.delaySendMsg(reply, data, 0);
        this.pauser = snd;
        this.pausedQ = true;
      } 
      // check paused and pings
      else if (this.pausedQ &&
        (msg.match("!ping @" + this.nick.toLowerCase(), "gmiu") ||
         msg.match("!help @" + this.nick.toLowerCase(), "gmiu"))) 
      {
        this.delaySendMsg("/me has been paused by @"+this.pauser, data, 0);
        return;
      } 
      // general unpaused ping
      else if (msg == "!ping") {
        this.sendMsg("Pong!", data)
        this.incrPingCt();
      } 

      // self-specific unpaused ping
      else if (msg.match("!ping @" + this.nick.toLowerCase() + "$")) {
        this.sendMsg(":white_check_mark: BetaOS services ONLINE", data)
        this.incrPingCt();
      }
        
      // general unpaused help
      else if (msg == "!help"){
        this.sendMsg("Enter !help @"+this.nick+" for help!", data);
      } 
      
      // send to messageHandle to process messages.
      else if (!this.pausedQ) {
        let outStr = this.replyMessage(msg.trim(), snd, data);
        if (this.failedQ && outStr != "") outStr = "/me is rebooting."
        if (outStr == "") return;
        if (!this.bypass) {
          this.callTimes.push(Date.now());
          setTimeout(() => {this.callTimes.shift();}, 60*5*1000) // five minutes.
        }
        if (!this.bypass && this.callTimes.length >= 5) {
          // if (i == 2)
            if (this.callTimes.length < 10) {
              outStr = this.transferOutQ?outStr+"\\n[ANTISPAM] Consider moving to &bots or &test for large-scale testing. Thank you for your understanding."
                : outStr+" [ANTISPAM WARNING]";
            } else {
              outStr = outStr+"\\n[ANTISPAM] Automatically paused @"+this.nick;
              this.pausedQ = true;
              this.pauser = "BetaOS_ANTISPAM";
              this.resetCall(data);
            }
        }
        this.sendMsg(outStr, data);
      }
    }
  }

  errorSocket() {
    this.pausedQ = false;
    this.pauser = null;
    this.changeNick(this.nick + "[Error]")
    this.incrRunCt();
    this.failedQ = true;
    setTimeout(() => {
      this.changeNick(this.nick)
      this.incrRunCt();
      updateActive(this.roomName, true);
      this.failedQ = false;
    }, 5000);
    updateActive(this.roomName, false);
  } // socketclose

  onClose(event:number) {
    console.log(event)
    if (event != 1000) {
      updateActive(this.roomName, false);
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ)
        updateActive(this.roomName, true);
      }, 1000);
    } else {
      updateActive(this.roomName, false);
      console.log("[close] Connection at "+this.url+" was killed");
    }
  }

  
  constructor(url:string, nick:string, roomName:string, transferQ:boolean) {
    this.nick = nick;
    this.url=url;
    this.roomName = roomName;
    this.socket = new WebSocket(url);
    this.transferOutQ=transferQ;
    this.socket.on('open', this.onOpen.bind(this));
    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.replyMessage = replyMessage
  }
}


init();