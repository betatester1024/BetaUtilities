const DATALOGGING = true;
// Copyright (c) 2023 BetaOS
import {WebSocket} from 'ws';
import {DB} from './database';
import {replyMessage} from './messageHandle';
import { updateActive } from './messageHandle';
import {systemLog} from './misc';
const fs = require('fs');

// const { getUserInfo } = require("@replit/repl-auth")
const Database = require("@replit/database")
import {validate} from './accessControl';

export class WebH 
{
  static CALLTIMEOUT = 30000;
  nick:string;
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
    }, WebH.CALLTIMEOUT);
  }

  clearCallReset() {
    if (this.callReset) clearTimeout(this.callReset);
    this.callStatus=-1;
  }

  resetCall(this:WebH, data:any) {
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

  sendMsg(msg:string, user:string) {
    validate(msg, "", "bMsg", "", null, "");
    this.incrRunCt();
  }
  
  onOpen() {
    systemLog("BetaUtilities open");
    WebH.resetTime =1000;
  }

  initNick() {
    // if (!this.setNickQ) this.changeNick(this.nick)
    // this.setNickQ = true;
  }

  changeNick(nick:string) {
    // this.socket.send(`{"type": "nick", "data": {"name": "${nick}"},"id": "1"}`);
  }

  onMessage(msg:string, snd:string) {
      let data = ""
      if (DATALOGGING) fs.writeFileSync('./msgLog.txt', fs.readFileSync('./msgLog.txt').toString()+((`(${this.roomName})[${snd}] ${msg}\n`)));
      msg = msg.trim().toLowerCase();
      // Required methods
      // !kill
      if (msg == "!kill @" + this.nick.toLowerCase()) {
        this.sendMsg("/me crashes", data);
        
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
        (msg.match("!ping @" + this.nick.toLowerCase()) ||
         msg.match("!help @" + this.nick.toLowerCase()))) 
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
    systemLog("Closed");
  }

  
  constructor() {
    this.nick = "BetaOS_System";
    this.replyMessage = replyMessage;
    this.roomName = "OnlineSUPPORT";
  }
}
