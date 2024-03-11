const express = require('express')
const enableWs = require('express-ws');
const app = express()
// require("dialog-polyfill");
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
       updateAbout, BridgeSocket} from './supportRooms';
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
  // console.log(filePath.replace(/(^(.+)\/|\.html)/g, ""));
  let suspensionFile = await uDB.findOne({fieldName:"suspendedPages", 
                                      page:filePath.replaceAll(/(^(.+)\/|\.html)/g, "")});
  let user = await userRequest(token);
  if (user.status != "SUCCESS") user = {data:{perms:0}};
  if (suspensionFile && 
      suspensionFile.suspended && user.data.perms < 2) 
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
  app.set('trust proxy', 1)
  app.get('/ip', (request:any, response:any) => response.send(request.ip))
  
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

  // else sendFile(res, getToken(req), frontendDir+'/supportIndex.html');
  
  app.get('/EE', (req:any, res:any) => {
    EE(true).then((obj)=>{
      res.set('Content-Type', 'text/html')
      res.send(Buffer.from(eeFormat(obj.data.data)));
    })
    
    incrRequests();
  });

  app.ws('/bridge', (ws:any, req:any)=> {
    ws.on('message', (msg:any) => {
      // console.log(msg);
      let dat = JSON.parse(msg);
      // console.log(dat);
      switch(dat.action) {
        case "loadLogs":
          bridgeH.loadLogs(dat.data.before);
          break;
        case "sendMsg":
          bridgeH.sendMsg(dat.data.room, dat.data.parent, dat.data.msg);
          break;
        case "updateAlias":
          // console.log("here");
          let resp = bridgeH.updateAlias(dat.data.alias, req.cookies.accountID);
      }
      // ws.send("reply:"+msg);
    });
    // console.log("Bridge was opened to room "+req.query.room)
    let bridgeH = new BridgeSocket(req.query.room, ws, req.cookies.accountID);
    // console.log(bridgeH);
    ws.send(JSON.stringify({action:"OPEN", data:null}));
    // supportHandler.addConnection(ws, req.query.room, req.cookies.accountID);
    ws.on("close", () => {
      bridgeH.onClientClose();
      // clear the connection
      // bridgeH.close();
      // supportHandler.removeConnection(ws, req.query.room, req.cookies.accountID);
      // console.log("Removed stream");
    });
  })

  app.ws('/', (ws:any, req:any) => {
    ws.on('message', (msg:any) => {
      let dat = JSON.parse(msg);
      // console.log(dat);
      switch(dat.action) {
        // case "loadLogs":
          // supportHandler.loadLogs(dat.data.before);
          // break;
        // case "sendMsg":
          // supportHandler.sendMsg(dat.data.room, dat.data.parent, dat.data.msg);
          // break;
        case "updateAlias":
          // console.log("here");
          supportHandler.updateAlias(dat.data.alias, token)
            .catch((e)=>{console.log(e);})
            .then((obj:any)=>{
              if (obj.status != "SUCCESS") ws.send(JSON.stringify({
                action:"yourAlias",
                data:{alias:obj.data.alias, error: true, type:obj.data.type}
              }));
            });
          break;
        case "pong":
          console.log("ping received")
          
          clearTimeout(connectionTerminator)
          
          setTimeout(()=>{
            console.log("ping sent");
            ws.send(JSON.stringify({action:"ping", data:null}));
            connectionTerminator = setTimeout(()=>{
              ws.close(); 
              console.log("connection terminated")
            }, 1000)
          }, 10000);
      }
      // ws.send("reply:"+msg);
    });
    // console.log("WebSocket was opened")
    ws.send(JSON.stringify({action:"ping", data:null}))
    console.log("ping sent")
    let connectionTerminator = setTimeout(()=>{
      ws.close(); 
      console.log("connection terminated")
    }, 1000)
    let room = req.query.room;
    let token = req.cookies.accountID||req.cookies.sessionID;
    ws.send(JSON.stringify({action:"OPEN", data:null}));
    supportHandler.addConnection(ws, req.query.room, token);
    ws.on("close", () => {
      // clear the connection
      clearTimeout(connectionTerminator);
      supportHandler.removeConnection(ws, req.query.room, token);
      // console.log("Removed stream");
    });
  });
  app.get('/that', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/supportIndex.html');
    incrRequests();
  });
  app.get('/that/*', supportReply);
  app.get('/room/*', (req:any, res:any) => {
           sendFile(res, getToken(req), frontendDir+'/supportRedirect.html');
           incrRequests();
         });
  // bridge works again
  app.get('/bridge/*', (req:any, res:any) => {
     sendFile(res, getToken(req), frontendDir+'/that.html');
     incrRequests();
   })
  app.get('/support', (req:any, res:any) => {
    // if (req.query.room) {
    //   sendFile(res, getToken(req), frontendDir+'/supportRedirect.html');
    //   return;
    // }
    sendFile(res, getToken(req), frontendDir+'/supportRedirect.html');
    incrRequests();
  });
  // app.get('/that')
  function supportReply(req:any, res:any) {
    // console.log(req.url);
    // let url = new URL(req.href);
    // let match = req.url.match('(?:.*)room=('+roomRegex+")");
    // if (req.url.match(/^\/(bridge|room)/)) {
    let room = req.url.match('(?:bridge|room|that)\\/('+roomRegex+')')[1];
    if (!supportHandler.checkFoundQ(room) && 
        (req.query.bridge!= "true" || req.url == "bridge")) {
      console.log("Room", room, "not found")
      sendFile(res, getToken(req), frontendDir+"/room404.html");
      return;
    }
    else sendFile(res, getToken(req), frontendDir+'/that.html');
    // }
    incrRequests();
  }

  app.get('/accountDel', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/delAcc.html');
    incrRequests();
  });

   app.get('/whois', (req:any, res:any) => {
    sendFile(res, getToken(req), frontendDir+'/aboutme.html');
    incrRequests();
  });

  app.get("/cmd", urlencodedParser, async (req:any, res:any) => {
    // makeRequest(req.query.action, req.cookies.accountID, req.query.data, "", (s:string, d:any, token:string)=>{
    //   // console.log(d);
    //   if (s == "SUCCESS") sendFile(res, getToken(req), frontendDir+'/actionComplete.html');
    //   else {sendFile(res, getToken(req), frontendDir+'/error.html')}
    // })
    sendFile(res, getToken(req), frontendDir+'/403.html')
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

  // app.get('/game.js', (req:any, res:any) => {
  //   sendFile(res, getToken(req), frontendDir+"game.js");
  //   incrRequests();
  // })

  // app.get('*/utils.js', (req:any, res:any) => {
  //   res.sendFile(jsDir+"utils.js");
  //   incrRequests();
  // })
  
  app.get('/smallsubway/', (req:any, res:any) => {
    sendFile(res, getToken(req), rootDir+"/smallsubway/index.html");
    incrRequests();
  })
  const acceptedPaths = ["/drawutils.js", "/events.js", "/game.js", "/redraw.js", "/shapes.js",
                        "/transfm.js", "/uihandler.js", "/utils.js"];
  app.get('/smallsubway/*.js', (req:any, res:any) => {
    if (acceptedPaths.indexOf(req.path.replace(/\/smallsubway/, ""))>=0)
      sendFile(res, getToken(req), rootDir+(req.path));
    else sendFile(res, getToken(req), frontendDir+"404.html");
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

  app.get('*/globalformat.css', (req:any, res:any) => {
    res.sendFile(frontendDir+"globalformat.css");
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
  

  const banList= [];
  app.post('/server', urlencodedParser, async (req:any, res:any) => {try {
    incrRequests();
    if (req.headers['content-length'] > 60000) {
      res.set("Connection", "close");
      res.status(413).end();
      return;
    }
    let addr = req.ip; 
    // console.log(addr);
    if (banList.indexOf(addr) >= 0) 
    {
      res.end(JSON.stringify({status:"ERROR", data:{error: "IP banned, contact BetaOS if this was done in error."}}));
      return;
    }
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

    makeRequest(body.action, req.cookies.accountID, body.data, req.cookies.sessionID)
    .then((ret:{status:string, data:any, token:string})=>{
      /*if(body.action=="login"||body.action == "logout" ||
        body.action == "delAcc" || body.action == "signup")*/
      if (ignoreLog.indexOf(body.action)>=0){}
      else if (ret.status=="SUCCESS") {
        log("["+addr+"]: "+body.action+", RESP:"+JSON.stringify(ret.data));
      }
      else log("F["+addr+"]: "+body.action+", ERR:"+ret.data.error);
      res.cookie('accountID', ret.token??"", {httpOnly: true, secure:true, sameSite:"None", maxAge:9e12});
      res.end(JSON.stringify({status:ret.status, data:ret.data}));
    });
  } catch(e) {}});
  
  if (process.env.localhost) 
    app.listen(port, 'localhost', function() {
      console.log("Listening");
    });
  else app.listen(port);
}

async function makeRequest(action:string|null, token:string, data:any|null, sessID:string) {
  if (!connectionSuccess) {
    return {status:"ERROR", data:{error:"Database connection failure"}, token:token};
  }
  // console.log("request made");
  try {
    let obj:{status:string, data:any, token:string};
    switch (action) {
      case 'test':
        obj = {status:"SUCCESS", data:{abc:"def", def:5}, token:token};
        break;
      case 'login': 
        obj = await validateLogin(data.user, data.pass, data.persistQ, token);
        break;
      case 'startupData':
        obj = {status:"SUCCESS", data:{
          branch: process.env.branch,
          domain:process.env.domain,
          unstableDomain:process.env.unstableDomain,
        }, token:token};
        break;
      case 'signup':
        obj = await signup(data.user, data.pass, token);
        break;
      case 'userRequest': 
        obj = await userRequest(token)
        break;
      case 'extendSession': 
        obj = await extendSession(token)
        break;
      case 'roomRequest':
        obj = roomRequest(token); // this one is synchronous
        break;
      case 'createRoom':
        obj = await createRoom(data.name, token)
        break;
      case 'deleteRoom':
        obj = await deleteRoom(data.name, token)
        break;
      case 'statusRequest':
        obj = roomRequest(token, true); // synchronous
        break;
      case 'getEE':
        obj = await EE(true, token, ""); // synchronous
        break;
      case 'setEE':
        obj = await EE(false, token, data.data); // synchronous
        break;
      case 'updateuser': 
        obj = await updateUser(data.user, data.oldPass, data.pass, data.newPermLevel, token)
        break;
      case 'delAcc':
        obj = await deleteAccount(data.user, data.pass, token)
        break;
      case 'logout':
        obj = await logout(token)
        break;
      case 'logout_all':
        obj = await logout(token, true)
        break;
      case 'sendMsg':
        obj = await sendMsg(data.msg, data.room, data.parent, token||sessID);
        break;
      case 'lookup':
        obj = await WHOIS(token, data.user)
        break;
      case "getLogs":
        obj = await getLogs(token)
        break;
      case "purgeLogs":
        obj = await purgeLogs(token)
        break;
      case "realias":
        obk = {status:"SUCCESS", data:null, token:token};
        // obj = await realias(data.alias, token)
        break;
      case "visits":
        obj = await visitCt(token)
        break;
      case "addTODO":
        obj = await addTask(token)
        break;
      case "getTodo":
        obj = await getTasks(token)
        break;
      case "updateTODO":
        obj = await updateTask(token, data.id, data.updated)
        break;
      case "deleteTODO":
        obj = await deleteTask(token, data.id)
        break;
      case "completeTODO":
        obj = await deleteTask(token, data.id, true)
        break;
      case "loadLogs": // {"action":"loadLogs","room":"BetaOS","id":"11","from":24}
        obj = await loadLogs(data.room, data.id, data.from, /*don't touch it*/ false, token)
        break;
      case "delMsg":
        obj = await delMsg(data.id, data.room, token||sessID)
        break;
      case "updateDefaultLoad":
        obj = await updateDefaultLoad(data.new, token)
        break;
      case "hidRoom":
        obj = await hidRoom(data.name, token)
        break;
      case "purge":
        obj = await purge(data.name, token)
        break;
      case "uptime":
        obj = await uptime(token)
        break;
      case 'toggleTheme':
        obj = await toggleTheme(token)
        break;
      case "updateAboutMe":
        obj = await updateAbout(data.new, token)
        break;
      case "paste":
        obj = await paste(data.content, data.name, data.pwd, token)
        break;
      case "findPaste":
        obj = await findPaste(data.name, data.pwd, token)
        break;
      case "editPaste":
        obj = await editPaste(data.content, data.name, data.pwd, token)
        break;
      case "clickIt":
        obj = await clickIt(token)
        break;
      case "leaderboard":
        obj = await getLeaderboard(token)
        break;
      case "newIssue":
        obj = await newIssue(data.title, data.body, data.priority, data.tags??[], token, sessID)
        break;
      case "loadIssues":
        // console.log(sessID);
        obj = await loadIssues(data.from, data.ct, data.completedOnly, token)
        break;
      case "deleteissue":
        obj = await deleteIssue(data.id, token)
        break;
     case "completeissue":
        obj = await completeIssue(data.id, token)
        break;
      case "editissue":
        obj = await editIssue(data.id, data.newTitle, data.newBody, data.newPriority, data.tags??[], token)
        break;
      case "adminAction":
        obj = await adminAction(data.action, data.options, token)
        break;
      default:
        obj = {status:"ERROR", data:{error: "Unknown command string!"}, token:token};
    }
    // console.log(obj);
    return obj;
  } catch (e:any) {
    console.log("Error:", e);
    return {status:"ERROR", data:{error:"Error, see console"}, token:token};
  }
}


function eeFormat(data:string, mainClass:string) {
  return `<!DOCTYPE html>
<html class="${mainClass}">
  <head>
    <script src='/utils.js'></script>
    <title>Everyone Edits</title>
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
  </body>
</html>`;
}

function tooManyRequests() {
  return `<!DOCTYPE html>
<html class="{{mainClass}}">
  <head>
    <title>Error 429</title>
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
  </body>
</html>`;
}

const validPages = ["/commands", '/contact', '/EEdit', '/todo', '/status', '/logout', '/signup', 
                    '/config', '/admin', '/docs', '/login', '/syslog', '/aboutme', '/mailertest',
                    "/timer", "/newpaste", "/pastesearch", '/clickit', '/capsdle', '/sweepthatmine',
                   "/stopwatch", "/testbed", '/credits', '/atomicmoose', '/issuetracker', '/graphIt', 
                    '/betterselect', '/redirect', '/betterselect.js', "/minimalLogin", "/minimalSignup",
                    "/8192", "/imgedit", "/leaderboard", "/eval", "/smallsubway"];

const ignoreLog = ["getEE", "userRequest", 'getLogs', 'loadLogs', 'visits', 
                   'roomRequest', 'sendMsg', 'clickIt', 'leaderboard',
                  'findPaste', 'startupData'];