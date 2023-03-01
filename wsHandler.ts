const DATALOGGING = false;
// Copyright (c) 2023 BetaOS
import {WebSocket} from 'ws';
import {DB} from './database';
import {replyMessage} from './messageHandle';
import { updateActive } from './messageHandle';
import {systemLog} from './misc';

// const { getUserInfo } = require("@replit/repl-auth")
const Database = require("@replit/database")


export class WS 
{
  static CALLTIMEOUT = 30000;
  url:string
  nick:string;
  setNickQ: boolean = false;
  socket: WebSocket;
  pausedQ=false;
  roomName:string;
  static FAILSAFETIMEOUT:NodeJS.Timeout|null = null;
  pauser:string|null = null;
  failedQ = false;
  callTimes:number[]=[];
  callReset:NodeJS.Timeout|null = null;
  callStatus=-1;
  transferOutQ = false; // is a room that one should recommend transferring out?
  bypass = false;
  confirmcode = -1;
  // static db = new Database();
  static toSendInfo(msg: string, data:any=null) {
    if (data) return `{"type":"send", "data":{"content":"${msg}","parent":"${data["data"]["id"]}"}}`;
    else return `{"type":"send", "data":{"content":"${msg}"}`;
  }

  incrRunCt() {
    DB.findOne({fieldName: "COUNTERS"}).then(
    (obj: {runCt:number})=>{
      DB.updateOne({fieldName:"COUNTERS"}, 
        {
          $set: {'runCt': obj.runCt+1},
          $currentDate: { lastModified: true }
        })
    });
  }
  incrPingCt() {
    DB.findOne({fieldName: "COUNTERS"}).then(
    (obj: {pingCt:number})=>{
      DB.updateOne({fieldName:"COUNTERS"}, 
        {
          $set: {'pingCt': obj.pingCt+1},
          $currentDate: { lastModified: true }
        })
    });
  }

  displayStats(data:any) {
    DB.findOne({fieldName: "COUNTERS"}).then(
      (obj: {runCt:number, pingCt: number}) => {
        this.delaySendMsg("Run count: "+obj.runCt+"\\nPing count: "+obj.pingCt, data, 0);
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
    this.incrRunCt();
  }
  
  onOpen() {
    systemLog(("BetaUtilities open in "+this.socket.url));
    WS.FAILSAFETIMEOUT =setTimeout(()=>{WS.resetTime =1000;}, 10000);
  }

  initNick() {
    if (!this.setNickQ) this.changeNick(this.nick)
    this.setNickQ = true;
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
      if (DATALOGGING) systemLog((`(${this.roomName})[${snd}] ${msg}`));
      // Required methods
      // !kill
      if (msg == "!kill @" + this.nick.toLowerCase()) {
        this.sendMsg("/me crashes", data);
        setTimeout(()=>{
          this.socket.close(1000, "!killed by user.");
        }, 100);
      }
        
      // !restore
      else if (this.pausedQ && msg == "!restore @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been unpaused", data);   
        updateActive(this.roomName, true);
        this.pauser = null;
        this.callTimes = [];
        this.pausedQ = false;
      } 
        
      // !pause
      else if (msg == "!pause @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been paused", data)
        updateActive(this.roomName, false);
        let reply = "Enter !kill @"+this.nick+" to kill this bot, "+
          "or enter !restore @"+this.nick+" to restore it.";
        this.sendMsg(reply, data);
        this.pauser = snd;
        this.pausedQ = true;
      } 
      // check paused and pings
      else if (this.pausedQ &&
        (msg.match("!ping @" + this.nick.toLowerCase(), "gmiu") ||
         msg.match("!help @" + this.nick.toLowerCase(), "gmiu"))) 
      {
        this.sendMsg("/me has been paused by @"+this.pauser, data);
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

  static resetTime = 1000;
  onClose(event:any) {
    if (WS.FAILSAFETIMEOUT) {
      clearTimeout(WS.FAILSAFETIMEOUT);
      WS.FAILSAFETIMEOUT = null;
    }
    // systemLog(("Perished in:"+this.roomName);
    if (event != 1000 && event!=1006) {
      updateActive(this.roomName, false);
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ)
        updateActive(this.roomName, true);
      }, 1000);
    } else {
      updateActive(this.roomName, false);
      if (event==1000) return;
      WS.resetTime*=1.5;
      if (WS.resetTime > 30000) {
        WS.resetTime = 30000;
        return;
      }
      setTimeout(()=>{
        new WS(this.url, this.nick, this.roomName, this.transferOutQ)
        updateActive(this.roomName, true);
      }, WS.resetTime);
      
      systemLog(("Retrying in: "+Math.round(WS.resetTime/1000)+" seconds"));
      let dateStr = (new Date()).toLocaleDateString("en-US", {timeZone:"EST"})+"/"+(new Date()).toLocaleTimeString("en-US", {timeZone:"EST"});
      systemLog(("[close] Connection at "+this.url+" was killed at "+dateStr));
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
    this.socket.on('error', (e)=>{
      this.socket.close(1000, "");
      // systemLog(("ERROR for room-ID: "+this.roomName)
      updateActive(this.roomName, false);
    })
    this.replyMessage = replyMessage;
    
  }
}
