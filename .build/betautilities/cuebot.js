"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var cuebot_exports = {};
__export(cuebot_exports, {
  cueBot: () => cueBot
});
module.exports = __toCommonJS(cuebot_exports);
var thisBotBecomingSkynetCost = 1e8;
function cueBot(hnd, msg, sender, data) {
  console.log(msg);
  if (msg == "!help @cuebot") {
    console.log("test");
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(` I am a bot that does lots of things, most of them unhelpful. Some such features include:\\n\\n-making Substitutions\\n\\n-providing shortcuts and unhelpful tools (!maskup, !shop, !coinflip, !xkcdalert, !rng, and more!)\\n\\n-having some random fun stuff! (!hint to find some of these.).\\n\\nFor more info, ask @...`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\ballegedly\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*kinda probably`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bnew study\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*tumblr post`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bit's cold out\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*the sky is cold`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\btree\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*stick tower`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^!pong @CueBot$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["uh, Ping?", "um, Ping?", "Ping?", "Ping!", "Ping?", "Ping!"]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^!ping @CueBot$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["Pong!", "Pong!", "Pong!", "Pong.", "Pong!", "Pong!", "There is another submarine three miles ahead, bearing 224, fourty fathoms down.", "F'tang!", "Beep!", "Badump tsss", "Kachunk!", "Pew pew pew!"]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bmittens\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*handcoats`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\brebuild\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*avenge`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bmmmmm*\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`mmmmmmmicrowave`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\brebuild\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*avenge`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bspace\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*spaaaaaace`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bgoogle glass\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Virtual Boy`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bbatman\b/) && Math.random() < 0.15) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*a man dressed like a bat`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/would be a good name for a band/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["*dot tumblr dot com", "*.tumblr.com", "*dot tumblr dot com"]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bsmartphone\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Pok\xE9dex`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\belectric\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*atomic`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bsenator\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*elf-lord`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\belection\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*eating contest`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bcongressional leaders\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*river spirits`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bhomeland security\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Homestar Runner`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bcould not be reached for comment\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*is guilty and everyone knows it`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bmy cat\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*my friend Catherine`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bkeyboard\b/) && Math.random() < 0.07) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*leopard`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bwitnesses\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*these dudes I know`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^!xkcdalert$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(":rotating_light:NEW XKCD ALERT:rotating_light:", data, 0);
    hnd.delaySendMsg("!xkcd", data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/(!whatifalert)|(!whatif\?alert)/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(":rotating_light:NEW WHAT IF? ALERT:rotating_light:", data, 0);
    hnd.delaySendMsg("!whatif", data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\b(self driving)\b/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Uncontrollably swerving`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
  }
  if (msg.match(/^!?flowchart$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`START -> Hey, this flowchart is a trap! -> Yes`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bdebate\b/) && Math.random() < 0.25) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*dance-off`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bpoll\b/) && Math.random() < 0.333) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*psychic reading`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^((!pwn)|(!pwned)|(!counterstrike)|(!grue))$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`Welcome to text-only Counterstrike. You are in a dark, outdoor map.`, data, 0);
    hnd.delaySendMsg("You have been pwned by a Grue.", data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^!mask(up)?$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`here, take this mask :mask:!`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^!twitter$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`https://www.twitter.com/xkcd`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^!(store)|(shop)$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`https://www.store.xkcd.com, however, it's currently down.`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^!((get-date)|(getdate)|(date))$/)) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["March 32nd", "September 30th", "September 23rd", "January 1st", "December 25th", "April 2nd", "Quintillius 3rd", "no thank you"]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bcandidate\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*airbender`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bdrone\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*dog`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bdrones\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*dogs`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bvows to\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*probably won't`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bat large\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*very large`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bsuccessfully\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*suddenly`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bexpands\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*physically expands`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\expanding\b/) && Math.random() < 0.2) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*physically expanding`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\b(First-degree|Second-degree|Third-degree|First degree|Second degree|Third degree)\b/i) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Friggin' awful`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\ban unknown number\b/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*like hundreds`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bfront runner\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Blade runner`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bfront runners\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*Blade runners`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bglobal\b/) && Math.random() < 0.5) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*spherical`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\byears\b/) && Math.random() < 0.05) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*minutes`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bminutes\b/) && Math.random() < 0.05) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*years`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bminute\b/) && Math.random() < 0.05) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*year`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\byear\b/) && Math.random() < 0.05) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*minute`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bno indication\b/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*lots of signs`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\burged restraint by\b/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*drunkenly egged on`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bhorsepower\b/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*tonnes of horsemeat`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!error|404|!404)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([
      "BUTTER OVERFLOW",
      "+++ OUT OF CHEESE ERROR. REDO FROM START +++",
      `A USER'S PASSWORD WAS "</HTML>"`,
      "CONFIRMATION BIOS",
      "FORGOT A SEMICOLON",
      "CAT-LIKE TYPING STYLE DETECTED",
      "OUT OF MEMORY",
      "ERR: INVALID DIM",
      "HTTP IS DOWN",
      "ILLEGAL CARROT DETECTED IN MAIL QUEUE",
      "OUR BUFFER RUNNETH OVER",
      "PC LOAD LETTER",
      "SQL EJECTION",
      "SYSADMIN TRAPPED IN HELL",
      "404 NOT FOUND NGINX",
      "TEMPORAL PARADOX",
      "MISSINGNO DETECTED",
      "WRONG FILES",
      "OUT OF MEMORIES",
      "OH JEEZ THERE'S A LOT OF YOU CAN YOU ALL JUST HANG ON FOR A SECOND PLEASE OH FRIG THIS IS SO BAD",
      "NOT FOUND NGINX",
      "BUTTER OVERFLOW",
      "xkcd.com/404"
    ]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!hello|hello|hi|!hi)$/) && Math.random() < 0.3) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([
      "hello world",
      "betaOShello",
      "jelloworld",
      "greetings",
      "hello",
      "Hello!",
      "hi",
      "Why, hello there!",
      "hello there",
      "hello there!",
      "greetings",
      "hello world",
      "hello",
      "hi",
      "GREETINGS, HUMAN"
    ]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!moo|moo)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["moo", "moo", "mooo", "mooooo", "moo", "mooo", "moo"]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!hint)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([
      "ssh, this is a library.",
      "reverse the rng.",
      "multiplayer text adventure game which uses artificial intellignce to generate content.",
      "appaloosa interactive's dolphin",
      "town of ruto, the adventure of link.",
      "pkmn.",
      "one thousand.",
      "hit indie rpg.",
      "contentrate and ask again.",
      "just do !thenameofanyoftheinteractivecomics.",
      "just do !thenameofanyoftheinteractivecomics. okay, *almost* any of them.",
      "hint not found"
    ]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!ssh)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([
      "ssh, this is a library",
      "shh, this is a library",
      "ssh, this is a library"
    ]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/(!enabletimetravel|enable time travel)/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`TARDIS error: Time Lord missing.`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^make me a sandwich$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`What? Make it yourself.`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bsudo make me a sandwich\b/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`Okay.`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/(!pikachu|!pokemon)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["Enemy Pikachu used Abandonment!", "Enemy Pikachu used Anguish!", "Enemy Pikachu used Ant Colony!", "Enemy Pikachu used Ethylene Dichloride!", "Enemy Pikachu used Extrude!", "Enemy Pikachu used Faceless!", "Enemy Pikachu used Friendship!", "Enemy Pikachu used Granite!", "Enemy Pikachu used Graph Theory!", "Enemy Pikachu used Ink Cloud!", "Enemy Pikachu used Radicality!", "Enemy Pikachu used Theft!", "Enemy Pikachu used Uplift!"]), data, 0);
    hnd.delaySendMsg(random(["", "", "", "", "It's not very effective...", "It's super effective!", "It's not very effective...", "It's super effective!", "No effect!"]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!timetravel|!time-travel)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`Time travel mode not enabled.`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!umwelt)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`Umwelt is the concept that various animals living in the same ecosystem actually live in very different worlds because their senses pick up on various things. Everything about you, from your ideology to your glasses prescription to the character you put before bot commands, shapes the world you live in.`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(umwelt)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([`Umwelt is the idea that various animals living in the same ecosystem actually live in very different worlds because their senses pick up on various things. Every single thing about you, from your ideology to your glasses prescription to your web browser, shapes the world you live in.`, `Umwelt is the idea that various animals living in the same ecosystem actually live in very different worlds because their senses pick up on various things. Everything about you, from your ideology to your glasses prescription to what character you put before bot commands, shapes the world you live in.`]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^\/umwelt$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([`Umwelt is the idea that because their senses pick up on different things, different animals in the same ecosystem actually live in very different worlds. Everything about you shapes the world you inhabit--from your ideology to your glasses prescription to your web browser.`, `Umwelt is the idea that because their senses pick up on different things, different animals in the same ecosystem actually live in very different worlds. Everything about you shapes the world you inhabit--from your ideology to your glasses prescription to the prefix you like to use for bot commands.`]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^\?umwelt$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([`Umwelt is the idea that different animals that live in the same ecosystem are actually living in very different worlds because their senses pick up on various things. Everything about you, from your ideology to your glasses prescription to your web browser, shapes the world you live in.`, `Umwelt is the idea that different animals that live in the same ecosystem are actually living in very different worlds because their senses pick up on various things. Everything about you, from your ideology to your glasses prescription to what prefix you use for bot commands, shapes the world you live in.`]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^\&umwelt$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random([`Umwelt is the idea that different animals that live in the same ecosystem are actually living in very different worlds because their senses pick up on different things. Everything about you, no matter how small, from your ideology to your glasses to your web browser, shapes the world you live in.`, `Umwelt is the idea that different animals that live in the same ecosystem are actually living in very different worlds because their senses pick up on different things. Everything about you, no matter how small, from your ideology to your glasses to what syntax you use for bot commands, shapes the world you perceive.`]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bforce\b/) && Math.random() < 0.1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*horse`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/\bforces\b/) && Math.random() < 0.13) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`*horses`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!latin|latin)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(random(["Omnes qu\xE6stiones solvuntur eis iactandis per machinis.", "Cur ego committitur dictar latinae?", "Cur ego committitur dictar latinae?"]), data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
  if (msg.match(/^(!thingexplainer|thingexplainer|!simplewriter|simplewriter|!tenhundred|tenhundred)$/) && Math.random() < 1) {
    hnd.changeNick("CueBot");
    hnd.delaySendMsg(`xkcd.com/simplewriter`, data, 0);
    setTimeout(() => {
      hnd.changeNick(hnd.nick);
    }, 200);
    ;
  }
}
function random(list) {
  return list[Math.floor(Math.random() * list.length)];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cueBot
});
//# sourceMappingURL=cuebot.js.map
