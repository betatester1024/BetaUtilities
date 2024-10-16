// require('dotenv').config();

import {initServer} from './server';
import {DBMaintenance, connectDB, client} from './database';
import {supportHandler, Room, BridgeHandler} from './supportRooms'
import {log} from './logging';
import {WebSocket} from 'ws';
// let ws = require("ws");
import {uDB} from './consts';
import {WS} from './betautilities/wsHandler';
import {WebH} from './betautilities/webHandler';
import { serverUpdate } from './betautilities/wordler';
export let connectionSuccess = true;
export let DBConnectFailure:any = null;
import {mail} from './mailer';
const localEuphRooms = [
  // "bots", "room", "memes", "music", "srs"
]
const { exec } = require("child_process");

// const localtunnel = require('localtunnel');

// (async () => {
//   const tunnel = await localtunnel({ port: 3000, subdomain:"betaos" });
//   console.log("Tunnelling at", tunnel.url);

//   tunnel.on('close', () => {
//     console.log("WARNING: Tunnel is closed!");
//     // tunnels are closed
//   });
// })();

let timedOutQ = false;
export let UPSINCESTR = "";
export let botsStarted = false;
try {
  // mail();
  
  // let fs = 
  if (connectionSuccess)
  connectDB().then((err:any)=>{
    // console.log(thing)
    if (!connectionSuccess) return;
    // REMOVED: EUPHORIA.IO IS DOWN AND BOTS DO NOT WORK ANYMORE ANYWAYS.
    // UPDATE: euphoria.leet.nu WORKS
    // uDB.findOne({fieldName:"lastActive"}).then((document:{time:number})=>{
    if (process.env["branch"] == "unstable" && 
        (!process.env["promptInstances"] || process.env["promptInstances"]!="0")) {
      let readline = require('readline');

      let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      
      });
      let timeout;
      rl.question("Confirm start extra instance? ", (answer:string)=>{
        clearTimeout(timeout);
        rl.close();
        answer = answer.trim().toLowerCase();
        if (timedOutQ) return;
        if (answer != "y" && answer != "yes") init(false);
        else {
          init(true)
        } // extra instances approved
      });
      timeout = setTimeout(()=>{init(false)}, 30000);
    }
    else init(process.env["branch"]!= "unstable");
    // init(false);
    
    //   if (Date.now - time < 10000)  // <10sec since last report, assume it is active
    //   {
    //     
    //   else init();
    // })
    // init();
  });
  DBConnectFailure = setTimeout(()=>{
    connectionSuccess=false; 
    console.log("Connection failed")
    log("Services failed. Rebooting now.")
    initServer();
    serverUpdate();
    setTimeout(()=>{exec("kill 1")}, 10000);
  }, 29000);
} catch (e:any) {
  console.log(e);
}

async function init(startBots:boolean) 
{
  // const wsock = new WebSocket('ws://localhost:8765');

  // wsock.on('error', console.error);
  
  // wsock.on('open', function open() {
    // wsock.send('{"type": 0, "server": "betawebsite"}');
  // });
  
  botsStarted = startBots;
  if (startBots) console.log("Starting EuphBots...");
  initServer();
  setTimeout(DBMaintenance, 1000);
  serverUpdate();
  let now = new Date(Date.now());
  UPSINCESTR = "----------------------Systems restarted at "+now.toLocaleString("en-US", {timeZone: "America/New_York"})+"-------------------";
  log(UPSINCESTR);
  uDB.findOne({fieldName:"ROOMS"}).then((obj:{euphRooms:string[], rooms:string[], hidRooms:string[]})=>{
    console.log(obj);
    // REMOVED: Euphoria is permanently down
    // RESTORED: euphoria.leet.nu is back
    if (startBots)
    for (let i=0; i<obj.euphRooms.length; i++) {
      // console.log("hello!")
      supportHandler.addRoom(new Room("EUPH_ROOM", obj.euphRooms[i]));
      new WS("wss://euphoria.leet.nu/room/" + obj.euphRooms[i] +"/ws", 
             "BetaUtilities"+(process.env['branch']=="unstable"?"-U":""), 
             obj.euphRooms[i], 
             !(obj.euphRooms[i]=="test" || obj.euphRooms[i]=="bots"))

      // log("Connected euph_room")+obj.euphRooms[i];
      console.log("Connecting euph_room", obj.euphRooms[i]);
    }
    // for (let i=0; i<localEuphRooms.length; i++) {
    //   supportHandler.addRoom(new Room("EUPH_ROOM", localEuphRooms[i]));
    //   new WS("wss://euphoria.io/room/" + localEuphRooms[i] +"/ws", "BetaUtilities", localEuphRooms[i], false)
    //   log("Connected euph_room")+localEuphRooms[i];
    //   console.log("Connected euph_room", localEuphRooms[i]);
    // }
    for (let i=0; i<obj.rooms.length; i++) {
      new WebH(obj.rooms[i], false);
      //supportHandler.addRoom(new Room("ONLINE_SUPPORT", obj.rooms[i]));
      console.log("Loaded support room", obj.rooms[i]);
    }
    for (let i=0; i<obj.hidRooms.length; i++) {
      new WebH(obj.hidRooms[i], true);
      // supportHandler.addRoom(new Room("HIDDEN_SUPPORT", obj.hidRooms[i]));
      console.log("Loaded hidden support room", obj.hidRooms[i]);
    }
  })
}
