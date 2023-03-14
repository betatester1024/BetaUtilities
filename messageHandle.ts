import {WS} from './wsHandler';
const fs = require('fs');
//import {rooms} from './initialiser'
import {getUptimeStr, systemLog} from './misc';
import {allWords, validWords, todayLeetCODE, todayWordID} from './wordListHandle';
const serviceKey = process.env['serviceKey'];
import {DB, database} from './database';
const DB_USERS = database.collection('SystemAUTH')
const serviceResponse = process.env['serviceResponse'];
const DB3 = database.collection('BetaUtilities');
let DATE = new Date();

let VERSION = "ServiceVersion STABLE 1.5271 | Build-time: "+
  DATE.toUTCString();
const HELPTEXT2 = `Press :one: to reboot services. Press :two: to play wordle! Press :three: to toggle ANTISPAM.\\n\\n Press :zero: to exit support at any time.`;
let workingUsers:string[] = [];
let leetlentCt= 1;
let wordleCt = 1;
let STARTTIME = Date.now();
import {sysRooms} from './initialiser';
import {pushEvents} from './server';
// export let rooms:string[] = [];
export function updateActive(roomID:string, activeQ:boolean) {
  let idx = sysRooms.indexOf(roomID)
  if (idx<0 && activeQ) {
    sysRooms.push(roomID);
    pushEvents.push([]);
  }
  else if (idx>=0 && !activeQ) sysRooms.splice(idx, 1); // remove at idx. (supposedly.)
}

export function replyMessage(this:WS, msg:string, sender:string, data:any):string {
  msg = msg.toLowerCase();
  if (msg.match ("@"+this.nick.toLowerCase())) {
    this.incrPingCt();
  }
  if (msg == "!debugwordle") {
    systemLog(validWords[todayWordID]+" "+todayLeetCODE.join(""));
    return "> See console <"
  }
  if (msg == "!conjure @" + this.nick.toLowerCase()) {
    if (this.socket) setTimeout(()=>{this.socket.close()}, 120);
    else this.delaySendMsg("/me reboots", data, 200)
    return "/me rölls bÿ and spontaneously combusts";
  }
  if (msg == "!reboot @" + this.nick.toLowerCase()) {
    if (this.socket) setTimeout(()=>{this.socket.close()}, 120);
    else this.delaySendMsg("/me reboots", data, 200)
    return "/me is rebooting";
  }
  if (msg.match(/!testfeature/gimu)) return "@" + sender;
  if (msg.match("^!uptime @" + this.nick.toLowerCase() + "$")) {
    this.clearCallReset();
    return getUptimeStr(STARTTIME)+" (Total uptime: "+getUptimeStr()+")";
  }

  if (msg == "!issue" || msg == "!bug" || msg == "!feature") {
    return "https://github.com/betatester1024/BetaUtilities/issues/new/choose"
  }

  DB.findOne({fieldName:"WORKINGUSERS"}).then((obj:{working:string[]})=>{
    let match3 = msg.match("^!work @(.*)$");
    let workingUsers = obj.working;
    if (match3 || msg == "!work") { 
      // systemLog(workingUsers);
      if (match3 && workingUsers.indexOf(norm(match3[1].toLowerCase()))>=0){
        this.delaySendMsg("This user is already supposed to be working!", data, 0);
        return;
      }
      else if (match3){
        workingUsers.push(norm(match3[1].toLowerCase()));
        systemLog("WORKACTIVATE in room: "+this.roomName+" by "+sender);
        this.delaySendMsg("Will scream at @"+norm(match3[1]), data, 0);
      }
      else if (workingUsers.indexOf(norm(sender.toLowerCase()))<0) {
        workingUsers.push(norm(sender.toLowerCase()));
        this.changeNick("WorkBot V2");
        setTimeout(()=>this.changeNick(this.nick), 10);
      }
      else {
        this.delaySendMsg("Wait, you're already in the work- GET TO WORK.", data, 0);
        return;
      }
    }
    match3 = msg.match("^!play @(.*)$");
    
    if (match3 || msg == "!play") { 
      // systemLog(workingUsers);
      if (match3 && workingUsers.indexOf(norm(match3[1].toLowerCase()))<0){
        this.delaySendMsg("This user was not working in the first place.", data, 0);
        return;
      }
      else if (match3){
        workingUsers.splice(workingUsers.indexOf(norm(match3[1].toLowerCase())), 1);
        this.delaySendMsg("They're off the hook... for now.", data, 0);
      }
      else {
        workingUsers.splice(workingUsers.indexOf(norm(sender.toLowerCase())), 1);
        this.delaySendMsg("You're off the hook... for now.", data, 0);
      }
      
    }
    if (workingUsers.indexOf(norm(sender.toLowerCase()))>=0) {
      this.changeNick("WorkBot V2");
      this.delaySendMsg("GET TO WORK.", data, 0);
      this.changeNick(this.nick);
    };
    // systemLog(workingUsers);
    DB.updateOne({fieldName:"WORKINGUSERS"},
    {
      $set: {working: workingUsers},
      $currentDate: { lastModified: true }
    });
  })

  DB.findOne({fieldName:"SLEEPINGUSERS"}).then((obj:{sleeping:string[]})=>{
  let match3 = msg.match("^!sleep @(.*)$");
  let sleepingUsers = obj.sleeping;
  if (match3 || msg == "!sleep") { 
    // systemLog(workingUsers);
    if (match3 && sleepingUsers.indexOf(norm(match3[1].toLowerCase()))>=0){
      this.delaySendMsg("This user is already supposed to be sleeping!", data, 0);
      return;
    }  
    else if (match3){
      sleepingUsers.push(norm(match3[1].toLowerCase()));
      systemLog("SLEEPACTIVATE in room: "+this.roomName+" by "+sender);
      this.delaySendMsg("Will scream at @"+norm(match3[1]), data, 0);
    }
    else if (sleepingUsers.indexOf(norm(sender.toLowerCase()))<0) {
      sleepingUsers.push(norm(sender.toLowerCase()));
      this.changeNick("SleepBot V2");
      setTimeout(()=>this.changeNick(this.nick), 10);
    }
    else {
      this.delaySendMsg("Wait, you're already in the- GO TO SLEEP", data, 0);
      return;
    }
  }
  match3 = msg.match("^!wake @(.*)$");
  
  if (match3 || msg == "!wake") { 
    // systemLog(workingUsers);
    if (match3 && sleepingUsers.indexOf(norm(match3[1].toLowerCase()))<0){
      this.delaySendMsg("This user was not sleeping in the first place.", data, 0);
      return;
    }
    else if (match3){
      sleepingUsers.splice(sleepingUsers.indexOf(norm(match3[1].toLowerCase())), 1);
      this.delaySendMsg("They're off the hook... for now.", data, 0);
    }
    else {
      sleepingUsers.splice(sleepingUsers.indexOf(norm(sender.toLowerCase())), 1);
      this.delaySendMsg("You're off the hook... for now.", data, 0);
    }
    
  }
  if (sleepingUsers.indexOf(norm(sender.toLowerCase()))>=0) {
    this.changeNick("SleepBot V2");
    this.delaySendMsg("GO TO SLEEP.", data, 0);
    this.changeNick(this.nick);
  };
  // systemLog(workingUsers);
  DB.updateOne({fieldName:"SLEEPINGUSERS"},
  {
    $set: {sleeping: sleepingUsers},
    $currentDate: { lastModified: true }
  });
})

  let match4 = msg.match("^!about @(.+)");
  if (match4 && match4[1]) {
    DB_USERS.findOne({fieldName:"AboutData", user:{$eq:norm(match4[1]).toLowerCase()}})
      .then((obj:{about:string}) => {
      if (obj && obj.about) 
        this.delaySendMsg("About @"+norm(match4[1])+": "+
          obj.about.replaceAll(/\\/gm, "\\\\").replaceAll(/"/gm, "\\\""), data, 0);
      else this.delaySendMsg("No information about @"+norm(match4[1]), data, 0);
    });
    return "";
  }

  match4 = msg.match("^!about set (.+)");
  if (match4) {
    DB_USERS.updateOne({fieldName:"AboutData", user:{$eq:norm(sender.toLowerCase())}},
    {
      $set: {about: match4[1]},
      $currentDate: { lastModified: true }
    }, {upsert:true});
    return "Set information for @"+norm(sender);
  }

  let match = msg.match("^!remindme of (.+) in ([0-9.]+\\s*d)?\\s*([0-9.]+\\s*h)?\\s*([0-9.]+\\s*m)?\\s*([0-9.]+\\s*s)?")
  if (match) {
    let remindMsg = match[1];
    // console.log(match[1]+","+match[2]+","+match[3]+","+match[4]+","+match[5]);
    let exp = Date.now();
    if (match[2]) exp += Number(match[2].split("d")[0])*1000*60*60*24;
    if (match[3]) exp += Number(match[3].split("h")[0])*1000*60*60;
    if (match[4]) exp += Number(match[4].split("m")[0])*1000*60;
    if (match[5]) exp += Number(match[5].split("s")[0])*1000;
    if (exp == Date.now()) {
      return "No reminder time provided!"
    }
    DB3.insertOne({
      fieldName:"TIMER",
      expiry:exp, 
      notifyingUser:norm(sender), 
      msg:remindMsg
    });
    return "Will remind you.";
  }

  if (msg == "!renick") {
    this.changeNick(this.nick);
    return ":white_check_mark:";
  }

  if (msg == "!leet") {
    this.changeNick(this.nick);
    return "https://euphoria.leet.nu/room/"+this.roomName;
  }
  if (msg == "!instant") {
    this.changeNick(this.nick);
    return "https://instant.leet.nu/room/"+this.roomName;
  }

  if (msg.match("!version[ ]+@"+this.nick.toLowerCase())) {return VERSION;}
  let match2  = msg.match("@"+this.nick.toLowerCase()+" !mitoseto &([a-z0-9]+) as @(.+)");
  if (match2) {
    systemLog(match2);
    let newNick = match2[2]==null?"BetaUtilities":match2[2];
    if (sysRooms.indexOf(match2[1])>=0) return "We're already in this room!";
    try  {new WS("wss://euphoria.io/room/" + match2[1] + "/ws", newNick, match2[1], false);}
    catch (e) {systemLog((e))}
    updateActive(match2[1], true);
    return "Sent @"+newNick+" to &"+match2[1];
  }
  if (msg.match("^!runstats [ ]*@" + this.nick.toLowerCase())) {
    this.displayStats(data);
    return "Loading..."
  }
  if (msg.match(/^!potato$/)) return "potato.io";
  if (msg == "!rating @" + this.nick.toLowerCase()) {
    DB.findOne({fieldName: "RATING"}).then(
    (obj: {COUNT:number, SUM:number})=>{
      let r = "Current @" + this.nick + " rating - " + (obj.SUM / obj.COUNT).toFixed(2);
      this.delaySendMsg(r, data, 0);
    });

  }
  if (msg == "!enablelogging" || msg == "!enablelogging @"+this.nick.toLowerCase()) {
    this.DATALOGGING = true;
    return "Enabled message logging."
  }
  if (msg == "!disablelogging" || msg == "!disablelogging @"+this.nick.toLowerCase()) {
    this.DATALOGGING = false;
    return "Disabled message logging.";
  }
  if (msg == "!status" || msg == "!status @"+this.nick.toLowerCase()) {
    return "Status-tracker: https://betatester1024.repl.co/status";
  }
  if (msg == "!systemhome" || msg == "!systemhome @"+this.nick.toLowerCase()) {
    return "https://betatester1024.repl.co";
  }
  if (msg == "!syslog" || msg == "!syslog @"+this.nick.toLowerCase()) {
    return "https://betatester1024.repl.co/syslog";
  }
  if (msg.match("^!die$")) {
    if (this.socket) setTimeout(()=>{this.socket.close()}, 120);
    else this.delaySendMsg("/me reboots", data, 200)
    this.delaySendMsg("/me crashes", data, 100)
    return "aaaaghhh! death! blood! i'm dying!";
  }
  if (msg == "!activerooms @"+this.nick.toLowerCase()) {
    let str = "/me is in: ";
    let euphRooms = [];
    for (let i=0; i<sysRooms.length; i++) {
      if (!sysRooms[i].match("\\|")) euphRooms.push("&"+sysRooms[i]);
      else if (!data) {euphRooms.push("#"+sysRooms[i].match("\\|(.+)")[1]);}
    }
    for (let j = 0; j < euphRooms.length - 1; j++) { str += euphRooms[j] + ", "; }
    str += (euphRooms.length>1?"and ":"")+euphRooms[euphRooms.length - 1] + "!";
    return str;
  }
  if (msg == "!pong"||msg=="!pong @"+this.nick.toLowerCase()) {
    this.delaySendMsg(":egg:", data, 1500);
    return "ping!";
  }
  if (msg.match("(!help[ ]+@" + this.nick.toLowerCase() + "$|^[ ]+!help[ ]+$)|!contact @"+this.nick.toLowerCase()) != null) {
    if (this.transferOutQ) return "Due to spamming concerns, please start your call in another room like &test or &bots! \\nThank you for your understanding."+
      "\\n Enter !help @"+this.nick+" -FORCE to enter the help-menu here.";
    if (this.callStatus == 6) return "You're currently on hold! A moment, please."
    this.callStatus = 0;
    this.bumpCallReset(data);
    return "Welcome to BetaOS Services! Press :one: to connect! Press :zero: to end call at any time.";
  }
  if (msg == "!help @"+this.nick.toLowerCase()+" -force") {
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
  if (this.callStatus == 0 && msg == "*#0*#") {
    this.clearCallReset();
    this.callStatus = -1;
    return "System - BetaOS_OnboardHelpline | Version" + VERSION;
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
  if (msg.length > 10000) return "ERROR: Your message is way too long.";
  match = this.callStatus == 2 ? msg.match(exp) : msg.match(exp2);
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
      "Bot-specific commands: see https://betatester1024.repl.co/about!"
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
    return "> Source code: https://replit.com/@betatester1024/betatester1024/"
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
    DB.findOne({fieldName:"RATING"}).then((obj:{SUM:number, COUNT:number})=>{
      DB.updateOne({fieldName:"RATING"}, {
        $set: {
          SUM:obj.SUM+dv,
          COUNT: obj.COUNT+1
        },
        $currentDate: { lastModified: true }
      })
    });
    this.callStatus = -1;
    return "Thank you for providing a rating! Enter !rating @"+this.nick+" to get current rating.";
  }
  if (this.callStatus == 5 && (msg == "one" || msg == "1" || msg == ":one:")) {
    this.clearCallReset();
    if (this.socket) setTimeout(()=>{this.socket.close()}, 120);
    else this.delaySendMsg("/me reboots", data, 200)
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
    }, 30*60*1000)
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

function norm(str:string) {
  str = str.replaceAll(/ /gm, "");
  str = str.replaceAll(/\\/gm, "\\\\");
  str = str.replaceAll(/"/gm, "\\\"");
  
  return str.replaceAll(" ","");
}