var thisBotBecomingSkynetCost = 100000000;
// please do not read this code it is cursed
import {WebH} from "./webHandler";
import {WS} from './WSHandler'
export function cueBot(hnd:(WebH|WS), msg:string, sender:string, data:any) {
  console.log(msg);
  if (msg == "!help @cuebot") {
    console.log("test");
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(` I am a bot that does lots of things, most of them unhelpful. Some such features include:\\n\\n`+
                     `-making Substitutions\\n\\n`+
                     `-providing shortcuts and unhelpful tools (!maskup, !shop, !coinflip, !xkcdalert, !rng, and more!)\\n\\n`+
                    `-having some random fun stuff! (!hint to find some of these.).\\n\\n`+
                    `For more info, ask @...`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\ballegedly\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*kinda probably`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bnew study\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*tumblr post`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bit's cold out\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*the sky is cold`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\btree\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*stick tower`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^!pong @CueBot$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["uh, Ping?", "um, Ping?", "Ping?", "Ping!", "Ping?", "Ping!"]), data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^!ping @CueBot$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["Pong!", "Pong!", "Pong!", "Pong.", "Pong!", "Pong!", "There is another submarine three miles ahead, bearing 224, fourty fathoms down.", "F'tang!", "Beep!", "Badump tsss", "Kachunk!", "Pew pew pew!"]), data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bmittens\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*handcoats`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\brebuild\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*avenge`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bmmmmm*\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`mmmmmmmicrowave`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\brebuild\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*avenge`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bspace\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*spaaaaaace`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bgoogle glass\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Virtual Boy`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bbatman\b/) && Math.random() < 0.15) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*a man dressed like a bat`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/would be a good name for a band/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["*dot tumblr dot com", "*.tumblr.com", "*dot tumblr dot com"]), data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bsmartphone\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Pokédex`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\belectric\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*atomic`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bsenator\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*elf-lord`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\belection\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*eating contest`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bcongressional leaders\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*river spirits`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bhomeland security\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Homestar Runner`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bcould not be reached for comment\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*is guilty and everyone knows it`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bmy cat\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*my friend Catherine`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bkeyboard\b/) && Math.random() < 0.07) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*leopard`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bwitnesses\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*these dudes I know`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^!xkcdalert$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(":rotating_light:NEW XKCD ALERT:rotating_light:", data, 0);
    hnd.delaySendMsg("!xkcd", data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/(!whatifalert)|(!whatif\?alert)/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(":rotating_light:NEW WHAT IF? ALERT:rotating_light:", data, 0);
    hnd.delaySendMsg("!whatif", data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\b(self driving)\b/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Uncontrollably swerving`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);
  }
  if (msg.match(/^!?flowchart$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`START -> Hey, this flowchart is a trap! -> Yes`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bdebate\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*dance-off`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bpoll\b/) && Math.random() < 0.333) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*psychic reading`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^((!pwn)|(!pwned)|(!counterstrike)|(!grue))$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`Welcome to text-only Counterstrike. You are in a dark, outdoor map.`, data, 0);
    hnd.delaySendMsg("You have been pwned by a Grue.", data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^!mask(up)?$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`here, take this mask :mask:!`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^!twitter$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`https://www.twitter.com/xkcd`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^!(store)|(shop)$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`https://www.store.xkcd.com, however, it's currently down.`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/^!((get-date)|(getdate)|(date))$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["March 32nd", "September 30th", "September 23rd", "January 1st", "December 25th", "April 2nd", "Quintillius 3rd", "no thank you"]), data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
  if (msg.match(/\bcandidate\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*airbender`, data, 0);
    setTimeout(()=>{hnd.changeNick(hnd.nick)}, 200);;
  }
}

function random(list:any[]) {
  return list[Math.floor(Math.random()*list.length)];
}