import {WS} from './wsHandler';
//import {rooms} from './initialiser'
import {getUptimeStr} from './misc';
import {allWords, validWords, todayLeetCODE, todayWordID} from './wordListHandle';
const serviceKey = process.env['serviceKey'];
const serviceResponse = process.env['serviceResponse'];
let DATE = new Date();

let VERSION = "ServiceVersion STABLE 1.5271 | Build-time: "+
  DATE.toUTCString();
const HELPTEXT2 = `Press :one: to reboot services. Press :two: to play wordle! Press :three: to toggle ANTISPAM.\\n\\n Press :zero: to exit support at any time.`;

let leetlentCt= 1;
let wordleCt = 1;
let STARTTIME = Date.now();
export let rooms:string[] = [];
export function updateActive(roomID:string, activeQ:boolean) {
  let idx = rooms.indexOf(roomID);
  if (idx<0 && activeQ) rooms.push(roomID);
  else if (idx>=0 && !activeQ) rooms.splice(idx, 1); // remove at idx. (supposedly.)
}

export function replyMessage(this:WS, msg:string, sender:string, data:any):string {
  msg = msg.toLowerCase();
  if (msg.match ("@"+this.nick.toLowerCase())) {
    this.incrPingCt();
  }
  if (msg == "!debugwordle") {
    console.log(validWords[todayWordID], todayLeetCODE.join(""));
    return "> See console <"
  }
  if (msg == "!conjure @" + this.nick.toLowerCase()) {
    setTimeout(()=>{this.socket.close()}, 120);
    return "/me rölls bÿ and spontaneously combusts";
  }
  if (msg == "!reboot @" + this.nick.toLowerCase()) {
    setTimeout(()=>{this.socket.close()}, 120);
    return "/me is rebooting";
  }
  if (msg.match(/!testfeature/gimu)) return "@" + sender;
  if (msg.match("^!uptime @" + this.nick.toLowerCase() + "$")) {
    this.clearCallReset();
    return getUptimeStr(STARTTIME)+" (Total uptime: "+getUptimeStr()+")";
  }

  if (msg.match("!version[ ]+@"+this.nick.toLowerCase())) {return VERSION;}
  let match2  = msg.match("@"+this.nick.toLowerCase()+" !mitoseto &([a-z0-9]+) as @(.+)");
  if (match2) {
    console.log(match2);
    let newNick = match2[2]==null?"BetaUtilities":match2[2];
    if (rooms.indexOf(match2[1])>=0) return "We're already in this room!";
    try  {new WS("wss://euphoria.io/room/" + match2[1] + "/ws", newNick, match2[1], false);}
    catch (e) {console.log(e)}
    updateActive(match2[1], true);
    return "Sent @"+newNick+" to &"+match2[1];
  }
  if (msg.match("^!runstats [ ]*@" + this.nick.toLowerCase())) {
    this.displayStats(data);
    return "Loading..."
  }
  if (msg.match(/^!potato$/)) return "potato.io";
  if (msg == "!rating @" + this.nick.toLowerCase()) {
    WS.db.get("SUM").then((value:number) => {
      WS.db.get("CT").then((value2:number) => {
        let r = "Current @" + this.nick + " rating - " + (value / value2).toFixed(2);
        this.delaySendMsg(r, data, 0);
      })
    }); return "";
  }
  if (msg == "!status @"+this.nick.toLowerCase()) {
    return "Status-tracker: https://BetaUtils.betatester1024.repl.co";
  }
  if (msg.match("^!die$")) {
    setTimeout(()=>{this.socket.close()}, 120);
    this.delaySendMsg("/me crashes", data, 100)
    return "aaaaghhh! death! blood! i'm dying!";
  }
  if (msg == "!activerooms @"+this.nick.toLowerCase()) {
    let str = "/me is in: ";
    for (let j = 0; j < rooms.length - 1; j++) { str += "&" + rooms[j] + ", "; }
    str += (rooms.length>1?"and ":"")+"&" + rooms[rooms.length - 1] + "!";
    return str;
  }
  if (msg == "!pong"||msg=="!pong @"+this.nick.toLowerCase()) {
    this.delaySendMsg(":egg:", data, 1500);
    return "ping!";
  }
  if (msg.match("(!help[ ]+@" + this.nick.toLowerCase() + "$|^[ ]+!help[ ]+$)|!contact @"+this.nick.toLowerCase()) != null) {
    if (this.callStatus == 6) return "You're currently on hold! A moment, please."
    this.callStatus = 0;
    this.bumpCallReset(data);
    return "Welcome to BetaOS Services! Press :one: to connect! Press :zero: to end call at any time.";
  }
  if (this.callStatus != -1 && (msg == "zero" || msg == "0" || msg == ":zero:")) {
    this.clearCallReset();
    this.callStatus = -1;
    return "[CALLEND] Thank you for calling BetaOS services!"
  }
  if (this.callStatus == 0 && (msg == "2" || msg == ":two:" || msg == "two")) {
    this.bumpCallReset(data);
    this.callStatus = 3;
    return "Are you sure you would like to proceed? Press :two: to continue.";
  }
  if (this.callStatus == 3 && (msg == "2" || msg == ":two" || msg == "two")) {
    this.clearCallReset();
    this.callStatus = -1;
    let encr = process.env['SystemEncrypted'];
    if (!encr) encr = "Cannot find SystemEncrypted string!";
    return encr;
  }
  
  let exp = /^((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/
  let exp2 = /^!unblock[ ]+((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/
  let match = this.callStatus == 2 ? msg.match(exp) : msg.match(exp2);
  if (match) {
    this.callStatus = -1;
    this.clearCallReset();
    if (match[1].substring(0, 4) == "https://")
      return "https://womginx.betatester1024.repl.co/main/" + match[1] +
        "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";
    else
      return "https://womginx.betatester1024.repl.co/main/https://" + match[1] +
        "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";

  }
  if (this.callStatus == 0 &&(msg == ":one:" || msg == "one" || msg == "1")) {
    this.bumpCallReset(data);
    this.callStatus = 1;
    return "Welcome to BetaOS Services! Enter :one: to inquire about our services. " +
      "Enter :two: to speak to a manager. " +
      "Composez le :three: pour service en français. " +
      "Press :four: for direct access to the code. " +
      "Press :five: to unblock a link manually. " +
      "Press :six: for more information about the creator. " +
      "Press :seven: to enter your access code. " +
      "Press :eight: to provide feedback on our calling services! " +
      "Press :nine: for more options. \\n\\n" +
      "Press :zero: to end call at any time.";
  }
  if (
    this.callStatus == 1 &&(msg == ":one:" || msg == "one" || msg == "1")) {
    this.clearCallReset();
    return (
      "Important commands: !ping, !help, !pause, !restore, !kill, !pong, !uptime, !uuid. \\n " +
      "Bot-specific commands: !unblock <LINK>; !potato, !src @" +
      this.nick +
      " !runStats !testfeature, !creatorinfo, !version, !activeRooms, !die, !contact, !antispam, !rating, !wordle, !leetlent. \\n"+
      " @"+this.nick+" !mitoseTo &ROOMNAME as @NICK to send BetaUtilities to any room. !status @"+this.nick+" to get the system status."
    );
  }
  if (this.callStatus == 1 && (msg == ":two:" || msg == "two" || msg == "2")) {
    this.delaySendMsg("/me crashes", data, 3000);
    this.clearCallReset();
    setTimeout(()=>{this.errorSocket()}, 3000)
    this.callStatus = 99;
    return "Connecting you to a human now.";
  }
  if (this.callStatus == 1 && (msg == ":three:" || msg == "three" || msg == "3")) {
    this.clearCallReset();
    this.delaySendMsg("/me est en panne D:", data, 500)
    setTimeout(()=>{this.errorSocket()}, 500)
    this.callStatus = 99;
    return "Bienvenue aux systèmes BétaOS. Téléchargement en cours des commandes disponibles, un moment SVP.";
  }
  if (msg == "!src @"+this.nick.toLowerCase() || this.callStatus == 1 && (msg == ":four:" || msg == "four" || msg == "4")) {
    this.clearCallReset();
    this.callStatus = -1;
    return "> Source code: https://replit.com/@betatester1024/BetaUtils#index.ts"
  }
  if (this.callStatus == 1 && (msg == ":five:" || msg == "five" || msg == "5")) {
    this.bumpCallReset(data);
    this.callStatus = 2;
    return "We're listening."
  }
  if (msg == "!creatorinfo" || this.callStatus == 1 && (msg == ":six:" || msg == "six" || msg == "6")) {
    this.clearCallReset();
    this.callStatus = -1;
    return "BetaUtilities, created by @betatester1024.\\nVersion: " + VERSION + "\\n" +
      "Hosted on repl.it free hosting; Only online when the creator is. \\n" +
      "Unblockers forked by @betatester1024 and should be able to automatically come online.\\n" +
      ":white_check_mark: BetaOS services ONLINE";
  }
  if (this.callStatus == 1 && (msg == ":seven:" || msg == "seven" || msg == "7")) {
    this.bumpCallReset(data);
    this.callStatus = 7;
    return "We're listening."
  }
  if (this.callStatus == 7) {
    this.callStatus = -1;
    if (msg == serviceKey) {
      if (!serviceResponse) throw "NO RESPONSE";
      else return serviceResponse;
    }
    else return "AccessRequest Failed"
  }
  if (this.callStatus == 1 && (msg == ":nine:" || msg == "nine" || msg == "9")) {
    this.clearCallReset();
    this.callStatus = 6;
    this.callReset = setTimeout(() => {
      let r = "/me We are currently experiencing high call volumes. Response times may be higher than average."
      if (Math.random() > 0.9) this.sendMsg(r, data,)
      this.callReset = setTimeout(() => {
        this.sendMsg(HELPTEXT2, data)
        this.bumpCallReset(data);
        this.callStatus = 5; 
      }, Math.random() * 5000 + 2000); // + 2-7 seconds
    }, Math.random() * 15000 + 5000); // hold times: 5-20 seconds
    return "You've been put on hold. Press :one: to scream into the phone. Press :zero: to exit support at any time.";
  }
  if (this.callStatus == 6 && (msg == ":one:"||msg=="one"||msg=="1")) {
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
    if (msg == ":one:" || msg == "one" || msg == "1") dv = 1;
    else if (msg == ":two:" || msg == "two" || msg == "2") dv = 2;
    else if (msg == ":three:" || msg == "three" || msg == "3") dv = 3;
    else if (msg == ":four:" || msg == "four" || msg == "4") dv = 4;
    else if (msg == ":five:" || msg == "five" || msg == "5") dv = 5;
    else {return "I don't think you entered that right."}
    WS.db.get("SUM").then((value:number) => {
      WS.db.get("CT").then((value2:number) => {
        WS.db.set("SUM", value + dv);
        WS.db.set("CT", value2 + 1);
      })
    });
    this.callStatus = -1;
    return "Thank you for providing a rating! Enter !rating @"+this.nick+" to get current rating.";
  }
  if (this.callStatus == 5 && (msg == "one" || msg == "1" || msg == ":one:")) {
    this.clearCallReset();
    setTimeout(()=>{this.socket.close()}, 120);
    return "/me reboots";
  }
  if (msg == "!wordle"||this.callStatus == 5 && (msg == "two" || msg == "2" || msg == ":two:")) {
    this.clearCallReset();
    this.callStatus = 8;
    return "Enter any 5-letter word. Press :one: for help on the game itself. Press :two: to try leetlen't! Press :zero: to exit.";
  }
  if (msg == "!leetlent" ||msg == "!leetlen't"|| this.callStatus == 8 && (msg == "two" || msg == "2" || msg == ":two:")) {
    this.callStatus = 10;
    return "Enter any 5-letter sequence of characters. Based on leet.nu/leetle.";
  }
  if (msg == "!antispam @"+this.nick.toLowerCase()
  ||  this.callStatus == 5 && (msg == "three" || msg == "3" || msg == ":three:")) {
    this.bumpCallReset(data);
    this.callStatus = 9;
    this.confirmcode = Math.floor(Math.random()*10000);
    return "[SYSWARN] Are you sure? Enter "+ this.confirmcode+" to confirm."; 
  }
  if (this.callStatus == 9 && msg == this.confirmcode.toString()) {
    this.bypass = !this.bypass
    this.callTimes = [];
    this.clearCallReset();
    if (this.bypass) setTimeout(()=> {
      this.bypass = false;
      this.callTimes = [];
      this.sendMsg("/me has automatically re-enabled ANTISPAM", data)
    }, 5*60*1000)
    return "ANTISPAM is currently: "+(this.bypass?"OFF":"ON");
  }
  if (this.callStatus == 8 && msg.match("^[a-z]{5}$")) {
    if (allWords.indexOf(msg)>=0) {
      let correctWord = validWords[todayWordID].split("");
      let out = "";
      if (msg == validWords[todayWordID]) {
        setTimeout(()=>{this.resetCall(data)}, 200);
        setTimeout(()=>{wordleCt = 1;}, 200);
        return "Correct word! You won in: "+wordleCt+" moves!";
      }
      for (let i=0; i<5; i++) {
        if (msg.charAt(i) == correctWord[i]) out += "🟩";
        else if (correctWord.indexOf(msg.charAt(i))>=0) out += "🟨";
        else out += "🟥"
      }
      wordleCt++;
      return out;
    }
    else return "That's not a word!";
  }
  if (this.callStatus == 10 && msg.match("^[a-z0-9]{5}$")) {
    // if (allWords.indexOf(content)>=0) {
      let out = "";
      if (msg == todayLeetCODE.join("")) {
        setTimeout(()=>{this.resetCall(data)}, 200);
        setTimeout(()=>{leetlentCt = 1;}, 200);
        return "Correct uh- character sequence! You won in: "+leetlentCt+" moves!";
      }
      for (let i=0; i<5; i++) {
        if (msg.charAt(i) == todayLeetCODE[i]) out += "🟩";
        else if (todayLeetCODE.indexOf(msg.charAt(i))>=0) out += "🟨";
        else out += "🟥"
      }
      leetlentCt++;
      return out;
    // }
    // else return "Something went terribly wrong.";
  }
  if (this.callStatus == 8 && (msg == "one" || msg == "1" || msg == ":one:")) {
    return "Enter any 5-letter word. Green tiles mean the letter is positionned in the correct location, yellow tiles mean the letter is positionned incorrectly but the letter exists in the word at least once, and red means that the letter does not exist in the word. You currently have infinite guesses."
  }
  
  if (msg.match("@" + this.nick.toLowerCase() + "$")) {
    return "Yes?";
  }

  else return "";
}
