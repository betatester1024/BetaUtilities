const DATALOGGING = true;
// Copyright (c) 2023 BetaOS
// import {WebSocket} from 'ws';
import {uDB} from '../consts';
import {replyMessage} from './messageHandle';
// import { updateActive } from './messageHandle';
import {systemLog} from '../logging';
import {supportHandler, sendMsg_B, Room, pseudoConnection} from '../supportRooms';
const fs = require('fs');

// const { getUserInfo } = require("@replit/repl-auth")
// import {validate} from './accessControl';

export class WebH 
{
  connection:pseudoConnection;
  static CALLTIMEOUT = 30000;
  nick:string;
  displayNick:string;
  pausedQ=false;
  roomName:string;
  hiddenQ: boolean;
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
    uDB.findOne({fieldName: "COUNTERS"}).then(
    (obj: {runCt:number})=>{
      uDB.updateOne({fieldName:"COUNTERS"}, 
        {
          $set: {'runCt': obj.runCt+1},
          $currentDate: { lastModified: true }
        })
    });
  }
  incrPingCt() {
    uDB.findOne({fieldName: "COUNTERS"}).then(
    (obj: {pingCt:number})=>{
      uDB.updateOne({fieldName:"COUNTERS"}, 
        {
          $set: {'pingCt': obj.pingCt+1},
          $currentDate: { lastModified: true }
        })
    });
  }

  displayStats(data:any) {
    uDB.findOne({fieldName: "COUNTERS"}).then(
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
    return "";
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
    if (msg.length==0) return;
    sendMsg_B(msg, this.roomName, data.parent);
    this.incrRunCt();
  }
  
  onOpen() {
    // systemLog("BetaUtilities open");
    WebH.resetTime =1000;
  }

  initNick() {
    // if (!this.setNickQ) this.changeNick(this.nick)
    // this.setNickQ = true;
  }

  changeNick(nick:string) {
    this.displayNick=nick;
    console.log("nick changed to",nick)
    // this.socket.send(`{"type": "nick", "data": {"name": "${nick}"},"id": "1"}`);
  }

  onMessage(msg:string, snd:string) {
      let data = {parent:msg.data.id};
      if (DATALOGGING) fs.writeFileSync('betautilities/msgLog.txt', fs.readFileSync('betautilities/msgLog.txt').toString()+((`(${this.roomName})[${snd}] ${msg}\n`)));
      msg = msg.data.content.toLowerCase().replaceAll(/(\s|^)((@betaos)|(@betautilities)|(@system))(\s|$)/gimu, " @"+this.nick.toLowerCase()+" ").trim()
      // Required methods
      // !kill
      // console.log("received" +msg);
      if (msg == "!kill @" + this.nick.toLowerCase()) {
        this.sendMsg("/me crashes", data);
        this.delaySendMsg("/me restarts", data, 200);
      }
        
      // !restore
      else if (this.pausedQ && msg == "!restore @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been unpaused", data);   
        // if (!this.hiddenQ) updateActive(this.roomName, true);
        this.pauser = null;
        this.callTimes = [];
        this.pausedQ = false;
      } 
        
      // !pause
      else if (msg == "!pause @" + this.nick.toLowerCase()) {
        this.sendMsg("/me has been paused", data)
        // if (!this.hiddenQ) updateActive(this.roomName, false);
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
        // if (!this.bypass) {
        //   this.callTimes.push(Date.now());
        //   setTimeout(() => {this.callTimes.shift();}, 60*5*1000) // five minutes.
        // }
        // if (!this.bypass && this.callTimes.length >= 5) {
        //   // if (i == 2)
        //     if (this.callTimes.length < 10) {
        //       outStr = this.transferOutQ?outStr+"\\n[ANTISPAM] Consider moving to &bots or &test for large-scale testing. Thank you for your understanding."
        //         : outStr+" [ANTISPAM WARNING]";
        //     } else {
        //       outStr = outStr+"\\n[ANTISPAM] Automatically paused @"+this.nick;
        //       this.pausedQ = true;
        //       this.pauser = "BetaOS_ANTISPAM";
        //       this.resetCall(data);
        //     }
        // }
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
      // supportHandler.createRoom(this.hiddenQ?"HIDDEN_SUPPORT":"ONLINE_SUPPORT", this.roomName);
      this.failedQ = false;
    }, 5000);
    // supportHandler.deleteRoom(this.hiddenQ?"HIDDEN_SUPPORT":"ONLINE_SUPPORT", this.roomName);
  } // socketclose

  static resetTime = 1000;
  onClose(event:any) {
    systemLog("Closed");
  }

  
  constructor(roomName: string, hiddenQ = false) {
    this.nick = "BetaOS_System";
    this.displayNick="BetaOS_System";
    this.replyMessage = (msg:string, sender:string, data:any) => {
      // if (filter.clean(msg)!= msg) return "Stop that. "
      return replyMessage(this, msg, sender, data)
    };
    this.hiddenQ = hiddenQ;
    if (roomName.length > 21) return;
    this.roomName = roomName;
    supportHandler.addRoom(new Room(hiddenQ?"HIDDEN_SUPPORT":"ONLINE_SUPPORT", this.roomName, this));
    supportHandler.addConnection(new pseudoConnection(), roomName, "[SYSINTERNAL]", true);
  }
}

// var Filter = require('bad-words'),filter = new Filter();