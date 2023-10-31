const express = require('express')
const enableWs = require('express-ws');
const app = express()
const crypto = require("crypto");
const parse = require("co-body");
const cors = require("cors");
const fs = require('fs');
import Handlebars from "handlebars";
 // for generating secure random #'s
import {connectionSuccess} from './index';
import {port, msgDB, authDB, frontendDir, roomRegex, rootDir, jsDir, uDB} from './consts';
import {signup, validateLogin, logout} from './validateLogin';
import { deleteAccount } from './delacc';
import {updateUser, realias, toggleTheme} from './updateUser'
import {userRequest, extendSession} from './userRequest';
import {EE} from './EEHandler';
import {paste, findPaste, editPaste} from './paste';
import {addTask, getTasks, updateTask, deleteTask} from './tasks';
import {getLogs, log, purgeLogs, visitCt, incrRequests} from './logging';
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
import {clickIt, getLeaderboard} from './button';
import { WebSocketServer } from 'ws';
import {newIssue, loadIssues, deleteIssue, completeIssue, editIssue} from './issuetracker'
import {uptime} from './betautilities/messageHandle'
import {supportHandler, roomRequest, sendMsg, 
        createRoom, deleteRoom, WHOIS, loadLogs, 
        delMsg, updateDefaultLoad, hidRoom, purge,
       updateAbout} from './supportRooms';
import {adminAction} from './adminAction';
const urlencodedParser = bodyParser.urlencoded({ extended: false }) 
var RateLimit = require('express-rate-limit');

async function getMainClass(token:string) 
{
  let res = await userRequest(token); 
  if (res.status != "SUCCESS") return "";
  else return res.data.darkQ?"dark":"";
}

function getToken(req:any) 
{
  return req.cookies.accountID;
}

async function sendFile(res:any, token:string, filePath:string) 
{
  console.log(filePath.replace(/^(.+)\//, ""));
  let suspensionFile = await uDB.findOne({fieldName:"suspendedPages", 
                                      page:filePath.replaceAll(/(^(.+)\/|\.html)/g, "")});
  let user = await userRequest(token);
  if (user.status != "SUCCESS") user = {data:{perms:0}};
  if (suspensionFile && 
      suspensionFile.suspendedQ && user.data.perms < 2) 
  {
    res.sendFile(frontendDir+"/403.html");
    return;
  }
  if (!filePath.match(/\.html$/)) {
    // console.log(filePath);
    res.sendFile(filePath); 
    return;
  }
  else {
    fs.readFile(filePath, 'utf8', async (err:any, fileContents:string) => {
      if (err) {
        console.error(err);
        return;
      }
      const template = Handlebars.compile(fileContents);
      // console.log("is html");
      res.set('Content-Type', 'text/html')
      res.send(Buffer.from(template({mainClass: await getMainClass(token)})));
      // console.log(data);
    });
  }
} // sendFile

export async function initServer() {


  // const wss = new WebSocketServer({server:app, path: "/ws"});
  
  // wss.on('connection', (ws:any)=>{
  //   ws.on('error', console.log);
  //   ws.on('message', (data:any)=>{
  //     console.log('received: %s', data);
  //   });
  //   console.log("connected!");
  //   ws.send('something');
  // });
  enableWs(app);
  var limiter = RateLimit({
    windowMs: 10*1000, // 10 second
    max: 50,
    message: tooManyRequests(),
    statusCode: 429, // 429 status = Too Many Requests (RFC 6585)
  });
  app.use(limiter);
  let corsOptions = {
    credentials: true, 
    origin: true,
    // allowedHeaders: true
  };
  app.use(cors(corsOptions));
  app.use(new cookieParser());
  // app.enable('trust proxy');
  
  app.get('/', (req:Request, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/index.html');
    incrRequests();
  })
  
  app.get('/register', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/signup.html');
    incrRequests();
  });


  app.get('/account', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/config.html');
    incrRequests();
  });
  
  app.get('/EE', (req:any, res:any) => {
    EE(true, (_status:string, data:any, _token:string)=>{
      res.set('Content-Type', 'text/html')
      res.send(Buffer.from(eeFormat(data.data)));
    }, "", "")
    
    incrRequests();
  });

  app.ws('/', (ws:any, req:any) => {
    ws.on('message', (msg:any) => {
      ws.send("reply:"+msg);
    });
    console.log("WebSocket was opened")
    ws.send(JSON.stringify({action:"OPEN", data:null}));
    supportHandler.addConnection(ws, req.query.room, req.cookies.accountID);
    ws.on("close", () => {
      // clear the connection
      supportHandler.removeConnection(ws, req.query.room, req.cookies.accountID);
      console.log("Removed stream");
    });
  });

  app.get('/support', (req:any, res:any) => {
    let match = req.url.match('\\?room=('+roomRegex+")");
    if (match) {
      if (!supportHandler.checkFoundQ(match[1])) {
        console.log("Room not found")
        sendFile(res, getToken(req), frontendDir+"/room404.html");
        return;
      }
      else sendFile(res, getToken(req), frontendDir+'/support.html');
    }
    else sendFile(res, getToken(req), frontendDir+'/supportIndex.html');
    incrRequests();
  });

  app.get('/accountDel', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/delAcc.html');
    incrRequests();
  });

   app.get('/whois', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/aboutme.html');
    incrRequests();
  });

  app.get("/cmd", urlencodedParser, async (req:any, res:any) => {
    makeRequest(req.query.action, req.cookies.accountID, null, (s:string, d:any, token:string)=>{
      console.log(d);
      if (s == "SUCCESS") sendFile(res, getToken(req), frontendDir+'/actionComplete.html');
      else {sendFile(res, getToken(req), frontendDir+'/error.html')}
    })
    incrRequests();
  })

  app.get("*/nodemodules/*", (req:any, res:any) => {
    // no long requests!
    if (req.url.length > 500) sendFile(res, getToken(req), frontendDir+"/404.html");
    else res.sendFile(rootDir+"node_modules"+req.url.replace(/.*nodemodules/, ""));
    incrRequests();
  })
    


  app.get("/paste", (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+"newpaste.html");
    incrRequests();
  })
  
  // app.get("/paste/", (req:any, res:any) => {
  //   sendFile(res, getToken(req), frontendDir+"/newpaste.html");
  //   incrRequests();
  // })
  
  app.get("/paste/*", (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+"paste.html");
    incrRequests();
  })

  
  app.get('*/favicon.ico', (req:Request, res:any)=> {
    sendFile(res, getToken(req), rootDir+'favicon.ico')
    incrRequests();
  })

  app.get('*/icon.png', (req:Request, res:any)=> {
    sendFile(res, getToken(req), rootDir+'temp.png')
    incrRequests();
  })

  app.get('*/notif.wav', (req:Request, res:any)=> {
    sendFile(res, getToken(req), rootDir+'notif.wav')
    incrRequests();
  })
  
  app.get('/support.js', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+"support.js");
    incrRequests();
  })

  app.get('*.svg', (req:any, res:any) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    res.setHeader("expires", date.toUTCString());
    res.setHeader("cache-control", "public, max-age=31536000, immutable");
    res.sendFile(frontendDir+req.url);
    incrRequests();
  })
  
  app.get('/*.js*', (req:any, res:any) => {
    res.sendFile(jsDir+req.url);
    incrRequests();
  })

  
  app.get('/*.ts', (req:any, res:any) => {
    res.sendFile(jsDir+req.url);
    incrRequests();
  })

  app.get('/*.css', (req:any, res:any) => {
    res.sendFile(frontendDir+req.url);
    incrRequests();
  })

  app.get("/stream", (req:any, res:any) =>{
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive'
    });
    res.flushHeaders();
    res.write("retry:500\n\n");
    // add the connection
    supportHandler.addConnection(res, req.query.room, req.cookies.accountID);
    res.on("close", () => {
      // clear the connection
      supportHandler.removeConnection(res, req.query.room, req.cookies.accountID);
      res.end();
      // console.log("Removed stream");
    });
  });

  app.get('/redirector', (req:any, res:any)=>{
    sendFile(res, getToken(req), rootDir+"/.github/pages/index.html");
    incrRequests();
  });
  
  app.post('/oauth2callback', (req:any, res:any)=>{
    // console.log("??")
    // console.log(req.url);
  })

  app.get('/*', (req:any, res:any) => {
    let requrl = req.url.match("([^?]*)\\??.*")[1]; // do not care about the stuff after the ?
    let idx = validPages.findIndex((obj)=>obj.toLowerCase()==requrl.toLowerCase());
    if (idx>=0) sendFile(res, getToken(req), frontendDir+validPages[idx]+".html");
    else {
      res.status(404);
      sendFile(res, getToken(req), frontendDir+"404.html");
    }
    incrRequests();
  })
  

  // const banList= ["172.31.196.1"];
  app.post('/server', urlencodedParser, async (req:any, res:any) => {
    incrRequests();
    if (req.headers['content-length'] > 60000) {
      res.set("Connection", "close");
      res.status(413).end();
      return;
    }
    // let addr = req.headers['x-forwarded-for'].match(":([^:]*)$")[1]; 
    // console.log(addr);
    // if (banList.indexOf(addr) >= 0) 
    // {
    //   res.end(JSON.stringify({status:"ERROR", data:{error: "IP banned, contact BetaOS if this was done in error."}}));
    //   return;
    // }
    var body = await parse.json(req);
    if (!body) res.end(JSON.stringify({status:"ERROR", data:{error:"No command string"}}));
    // let cookiematch = req.cookies.match("accountID=[0-9a-zA-Z\\-]");
    // COOKIE ACCEPTANCE DIALOG 
    if (body.action == "cookieRequest") {
      res.end(JSON.stringify({data:req.cookies.acceptedQ??false}))
      return;
    }
    if (body.action == "acceptCookies") {
      res.cookie('acceptedQ', true, {httpOnly: true, secure:true, sameSite:"None"})
      res.end(JSON.stringify(""));
      return;
    }
    if (body.action == "accountID") {
      if (req.cookies.accountID) 
        res.end(JSON.stringify({status:"SUCCESS", data:{id:req.cookies.accountID}}));
      else 
        res.end(JSON.stringify({status:"ERROR", data:{error:"Not logged in"}}));
      return;
    }
    if (body.action == "setAccountID") {
      res.cookie('accountID', body.data.id, {httpOnly: true, secure:true, sameSite:"None"})
      res.end(JSON.stringify({status:"SUCCESS", data:null}));
      return;
    }

    if (!req.cookies.sessionID) res.cookie('sessionID', crypto.randomUUID(), {httpOnly:true, secure:true, sameSite:"None"});
    //////////////////////////

    makeRequest(body.action, req.cookies.accountID, body.data, req.cookies.sessionID, (s:string, d:any, token:string)=>{
      /*if(body.action=="login"||body.action == "logout" ||
        body.action == "delAcc" || body.action == "signup")*/
      if (ignoreLog.indexOf(body.action)>=0){}
      else if (s=="SUCCESS") {
        log("Action performed:"+body.action+", response:"+JSON.stringify(d));
      }
      else log("Action performed, error on "+body.action+", error:"+d.error);
      res.cookie('accountID', token?token:"", {httpOnly: true, secure:true, sameSite:"None", maxAge:9e12});
      res.end(JSON.stringify({status:s, data:d}));
    })
  });
  
  app.listen(port, () => {
    console.log(`BetaUtilities V2 listening on port ${port}`)
  })
}

function makeRequest(action:string|null, token:string, data:any|null, sessID:string, callback: (status:string, dat:any, token:string)=>any) {
  if (!connectionSuccess) {
    callback("ERROR", {error:"Database connection failure"}, token);
    return;
  }
  
  try {
    switch (action) {
      case 'test':
        callback("SUCCESS", {abc:"def", def:5}, token);
        break;
      case 'login': 
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        // validate login-data before sending to server
        data = data as {user:string, pass:string, persistQ:boolean};
        validateLogin(data.user, data.pass, data.persistQ, token).
          then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'signup':
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        data = data as {user:string, pass:string};
        signup(data.user, data.pass, token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});;
        break;
      case 'userRequest': 
        userRequest(token)
          .then((obj:{status:string, data:any, token:string})=>
            {
              obj.data.branch = process.env['branch'];
              callback(obj.status, obj.data, obj.token)
            });
        break;
      case 'extendSession': 
        extendSession(token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'roomRequest':
        let obj2 = roomRequest(token); // this one is synchronous
        callback(obj2.status, obj2.data, obj2.token);
        break;
      case 'createRoom':
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        data = data as {name:string}
        createRoom(data.name, token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'deleteRoom':
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        data = data as {name:string}
        deleteRoom(data.name, token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'statusRequest':
        let obj3 = roomRequest(token, true);
        callback(obj3.status, obj3.data, obj3.token);
        break;
      case 'getEE':
        EE(true, callback, token, "");
        break;
      case 'setEE':
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        data = data as {data:string}
        EE(false, callback, token, data.data);
        break;
      case 'updateuser': 
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        data = data as {user:string, oldPass: string, pass:string, newPermLevel:string};
        updateUser(data.user, data.oldPass, data.pass, data.newPermLevel, token)
        .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'delAcc':
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        data = data as {user:string, pass:string};
        deleteAccount(data.user, data.pass, token)
        .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'logout':
        logout(token)
        .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'logout_all':
        logout(token, true)
        .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case 'sendMsg':
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        data = data as {msg:string, room:string, parent:string};
        if (data.msg.length == 0) {
          callback("SUCCESS", null, token); break;
        }
        sendMsg(data.msg.slice(0, 1024), data.room, data.parent, token, callback);
        break;
      case 'lookup':
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        WHOIS(token, data.user)
        .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case "getLogs":
        getLogs(token)
        .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case "purgeLogs":
        purgeLogs(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "realias":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        realias(data.alias, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "visits":
        visitCt(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "addTODO":
        addTask(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "getTodo":
        getTasks(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "updateTODO":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        updateTask(token, data.id, data.updated)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "deleteTODO":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        deleteTask(token, data.id)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "completeTODO":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        deleteTask(token, data.id, true)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "loadLogs": // {"action":"loadLogs","room":"BetaOS","id":"11","from":24}
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        loadLogs(data.room, data.id, data.from, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "delMsg":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        delMsg(data.id, data.room, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break
      case "updateDefaultLoad":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        updateDefaultLoad(data.new, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "hidRoom":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        hidRoom(data.name, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "purge":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        purge(data.name, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "uptime":
        uptime(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case 'toggleTheme':
        toggleTheme(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "updateAboutMe":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        updateAbout(data.new, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "paste":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        paste(data.content, data.name, data.pwd, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "findPaste":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        findPaste(data.name, data.pwd, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "editPaste":
        if (!data) {callback("ERROR", {error:"No data provided"}, token); break;}
        editPaste(data.content, data.name, data.pwd, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "clickIt":
        clickIt(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "leaderboard":
        // console.log("leaderboard requested");
        getLeaderboard(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      case "newIssue":
        newIssue(data.title, data.body, data.priority, data.tags??[], token, sessID)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case "loadIssues":
        // console.log(sessID);
        loadIssues(data.from, data.ct, data.completedOnly, token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case "deleteissue":
        deleteIssue(data.id, token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
     case "completeissue":
        // console.log(sessID);
        completeIssue(data.id, token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case "editissue":
        editIssue(data.id, data.newTitle, data.newBody, data.newPriority, data.tags??[], token)
          .then((obj:{status:string, data:any, token:string})=>
            {callback(obj.status, obj.data, obj.token)});
        break;
      case "adminAction":
        adminAction(data.action, data.options, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
        break;
      default:
        callback("ERROR", {error: "Unknown command string!"}, token);
    }
  } catch (e:any) {
    console.log("Error:", e);
  }
  // console.log("request made")
  return; 
}


function eeFormat(data:string, mainClass:string) {
  return `<!DOCTYPE html>
<html class="${mainClass}">
  <head>
    <script src='./utils.js'></script>
    <title>Everyone Edits | BetaOS Systems</title>
    <script>
    </script>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@100;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="/globalformat.css">
    <style>
    </style>
  </head>
  <body onload = "globalOnload();">
    <div class="main_content">
    <header>
      <h2>Everybody edits!</h2>
      <hr class="rounded">
    </header>
      ${data}
      <br>
      <a class="btn fssml" href="/EEdit">
    <span class="material-symbols-outlined">edit</span>
    Edit this page
    <div class="anim"></div></a>
    <a class="btn fssml" href="/">
    <span class="material-symbols-outlined">arrow_back_ios</span>
    
    Return to home<div class="anim"></div></a>
    </div>
    
    <div class="overlay" id="overlay">
      <div class="internal">
        <p class="fsmed" id="alerttext">Hey, some text here</p>
        <button class="btn szTwoThirds" onclick="closeAlert()">
          Continue
          <span class="material-symbols-outlined">arrow_forward_ios</span>
          <div class="anim"></div>
        </button>
      </div>
    </div>
  </body>
</html>`;
}

function tooManyRequests() {
  return `<!DOCTYPE html>
<html class="{{mainClass}}">
  <head>
    <title>Error 429 | BetaOS Systems</title>
    <script>
    ${fs.readFileSync(jsDir+"utils.js")}
    </script>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@100;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <style>
      ${fs.readFileSync(frontendDir+"/globalformat.css")}
    </style>
  </head>
  <body onload="globalOnload(()=>{}, true)">
    <div class="main_content">
    <header>
      <h2>Error: Too many requests</h2>
      <hr class="redrounded">
    </header>
    <p class="fsmed"><span class="material-symbols-outlined red nohover nooutline">error</span>
    Try <button class="btn fssml" onclick="location.reload()">
    <span class="material-symbols-outlined">refresh</span>
    refreshing.<div class="anim"></div></button></p>
    </div>
    
    <div class="overlay" id="overlay">
      <div class="internal">
        <p class="fsmed" id="alerttext">Hey, some text here</p>
        <button class="btn szTwoThirds" onclick="closeAlert()">
          Continue
          <span class="material-symbols-outlined">arrow_forward_ios</span>
          <div class="anim"></div>
        </button>
      </div>
    </div>
  </body>
</html>`;
}

const validPages = ["/commands", '/contact', '/EEdit', '/todo', '/status', '/logout', '/signup', 
                    '/config', '/admin', '/docs', '/login', '/syslog', '/aboutme', '/mailertest',
                    "/timer", "/newpaste", "/pastesearch", '/clickit', '/capsdle', '/sweepthatmine',
                   "/stopwatch", "/testbed", '/credits', '/atomicmoose', '/issuetracker', '/graphIt', 
                    '/betterselect', '/redirect', '/betterselect.js', "/minimalLogin", "/minimalSignup",
                    "/8192", "/imgedit", "/leaderboard"];
const ignoreLog = ["getEE", "userRequest", 'getLogs', 'loadLogs', 'visits', 
                   'roomRequest', 'sendMsg', 'clickIt', 'leaderboard',
                  'paste', 'findPaste'];