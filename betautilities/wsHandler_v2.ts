import {WebSocket} from 'ws';
import {updateActive} from '../supportRooms';

export class WS_V2
{
  socket:WebSocket;
  static FAILSAFETIMEOUT:NodeJS.Timeout|null = null;
  roomName:string;
  nick:string;
  url:string;
  static sockets:WebSocket[];
  static resetTime:number = 500;
  
  onOpen() {
    console.log("BetaUtilities open in "+this.socket.url);
    WS_V2.FAILSAFETIMEOUT =setTimeout(()=>{WS_V2.resetTime =1000;}, 10000);
  }

  onClose(event:any) {
    // console.log("socket closed")
    WS_V2.sockets.splice(WS_V2.sockets.indexOf(this), 1);
    if (WS_V2.FAILSAFETIMEOUT) {
      clearTimeout(WS_V2.FAILSAFETIMEOUT);
      WS_V2.FAILSAFETIMEOUT = null;
    }
    // systemLog(("Perished in:"+this.roomName);
    if (event != 1000 && event!=1006) {
      updateActive(this.roomName, false);
      console.log("!killed in &"+this.roomName);
      setTimeout(() => {
        new WS(this.url, this.nick, this.roomName, this.transferOutQ)
        updateActive(this.roomName, true);
      }, 1000);
    } else {
      updateActive(this.roomName, false);
      if (event==1000) return;
      WS_V2.resetTime*=1.5;
      if (WS_V2.resetTime > 30000) {
        WS_V2.resetTime = 30000;
        return;
      }
      setTimeout(()=>{
        new WS(this.url, this.nick, this.roomName, this.transferOutQ)
        updateActive(this.roomName, true);
      }, WS_V2.resetTime);
      
      console.log(("Retrying in: "+Math.round(WS_V2.resetTime/1000)+" seconds"));
      let dateStr = (new Date()).toLocaleDateString("en-US", {timeZone:"EST"})+"/"+(new Date()).toLocaleTimeString("en-US", {timeZone:"EST"});
      console.log(("[close] Connection at "+this.url+" was killed at "+dateStr));
    }
  }

  constructor(url:string, nick:string, roomName:string, transferQ:boolean) {
    this.nick = nick;
    // if (roomName == "bots") WS_V2.notifRoom = this;
    WS_V2.sockets.push(this);
    // console.log(WS_V2.sockets);
    this.url=url;
    this.roomName = roomName;
    this.socket = new WebSocket(url);
    // this.transferOutQ=transferQ;
    this.socket.on('open', this.onOpen.bind(this));
    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.socket.on('error', (e:any)=>{
      this.socket.close(1000, "");
      // systemLog(("ERROR for room-ID: "+this.roomName)
      updateActive(this.roomName, false);
    })
    // this.replyMessage = (msg:string, sender:string, data:any) => {
      // return replyMessage(this, msg, sender, data);
    // }
  }
}