const express = require('express')
const app = express()
const crypto = require("crypto");
const parse = require("co-body");
 // for generating secure random #'s
import {port, msgDB, authDB, frontendDir, roomRegex, rootDir, jsDir, uDB} from './consts';
import {signup, validateLogin, logout} from './validateLogin';
import { deleteAccount } from './delacc';
import {updateUser, realias} from './updateUser'
import {userRequest} from './userRequest';
import {EE} from './EEHandler';
import {getLogs, log, purgeLogs} from './logging';
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
import {supportHandler, roomRequest, sendMsg, createRoom, deleteRoom} from './supportRooms'
const urlencodedParser = bodyParser.urlencoded({ extended: false }) 
var RateLimit = require('express-rate-limit');

export async function initServer() {
  var limiter = RateLimit({
    windowMs: 10*1000, // 10 seconds
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429, // 429 status = Too Many Requests (RFC 6585)
  });
  app.use(limiter);
  app.use(new cookieParser());
  
  app.get('/', (req:Request, res:any) => {
    res.sendFile(frontendDir+'/index.html');
    incrRequests();
  })
  
  app.get('/register', (req:any, res:any) => {
    res.sendFile(frontendDir+'/signup.html');
    incrRequests();
  });


  app.get('/account', (req:any, res:any) => {
    res.sendFile(frontendDir+'/config.html');
    incrRequests();
  });

  
  app.get('/EE', (req:any, res:any) => {
    EE(true, (_status:string, data:any, _token:string)=>{
      res.set('Content-Type', 'text/html')
      res.send(Buffer.from(eeFormat(data.data)));
    }, "", "")
    
    incrRequests();
  });

  

  app.get('/support', (req:any, res:any) => {
    let match = req.url.match('\\?room=('+roomRegex+")");
    if (match) {
      if (!supportHandler.checkFoundQ(match[1])) {
        console.log("Room not found")
        res.sendFile(frontendDir+"/room404.html");
        return;
      }
      else res.sendFile(frontendDir+'/support.html');
    }
    else res.sendFile(frontendDir+'/supportIndex.html');
    incrRequests();
  });

  app.get('/accountDel', (req:any, res:any) => {
    res.sendFile(frontendDir+'/delAcc.html');
    incrRequests();
  });
    
  app.get('*/favicon.ico', (req:Request, res:any)=> {
    res.sendFile(rootDir+'/favicon.ico')
    incrRequests();
  })

  
  app.get('/support.js', (req:any, res:any) => {
    res.sendFile(frontendDir+"support.js");
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
    supportHandler.addConnection(res, req.query.room, req.cookies.sessionID);
    res.on("close", () => {
      // clear the connection
      supportHandler.removeConnection(res, req.query.room, req.cookies.sessionID);
      res.end();
      // console.log("Removed stream");
    });
  });

  app.get('/*', (req:any, res:any) => {
    let requrl = req.url.match("([^?]*)\\??.*")[1]
    let idx = validPages.findIndex((obj)=>obj.toLowerCase()==requrl.toLowerCase());
    if (idx>=0) res.sendFile(frontendDir+validPages[idx]+".html");
    else res.sendFile(frontendDir+"404.html");
    incrRequests();
  })
  
  
  app.post('/server', urlencodedParser, async (req:any, res:any) => {
    incrRequests();
    if (req.headers['content-length'] > 60000) {
      res.set("Connection", "close");
      res.status(413).end();
      return;
    }
    var body = await parse.json(req);
    if (!body) res.end(JSON.stringify({status:"ERROR", data:null}));
    // let cookiematch = req.cookies.match("sessionID=[0-9a-zA-Z\\-]");
    makeRequest(body.action, req.cookies.sessionID, body.data, (s:string, d:any, token:string)=>{
      /*if(body.action=="login"||body.action == "logout" ||
        body.action == "delAcc" || body.action == "signup")*/
      if (ignoreLog.indexOf(body.action)>=0){console.log("action ignored")}
      else if (s=="SUCCESS") {
        log("Action performed:"+body.action+", response:"+JSON.stringify(d));
      }
      else log("Action performed, error on "+body.action+", error:"+d.error);
      res.cookie('sessionID', token?token:"", { maxAge: 1000*60*60*24*30, httpOnly: true, secure:true, sameSite:"Strict"});
      res.end(JSON.stringify({status:s, data:d}));
    })
  });
  
  app.listen(port, () => {
    console.log(`BetaUtilities V2 listening on port ${port}`)
  })
}

async function incrRequests() {
  uDB.updateOne({fieldName:"VISITS"}, {$inc:{visitCt:1}}, {upsert:true});
}

function makeRequest(action:string|null, token:string, data:any|null, callback: (status:string, dat:any, token:string)=>any) {
  switch (action) {
    case 'test':
      callback("SUCCESS", {abc:"def", def:5}, token);
      break;
    case 'login': 
      // validate login-data before sending to server
      data = data as {user:string, pass:string, persistQ:boolean};
      validateLogin(data.user, data.pass, data.persistQ, token).
        then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
      break;
    case 'signup':
      data = data as {user:string, pass:string};
      signup(data.user, data.pass, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});;
      break;
    case 'userRequest': 
      userRequest(token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
      break;
    case 'roomRequest':
      let obj2 = roomRequest(token); // this one is synchronous
      callback(obj2.status, obj2.data, obj2.token);
      break;
    case 'createRoom':
      data = data as {name:string}
      createRoom(data.name, token)
        .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
      break;
    case 'deleteRoom':
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
      data = data as {data:string}
      EE(false, callback, token, data.data);
      break;
    case 'updateuser': 
      data = data as {user:string, oldPass: string, pass:string, newPermLevel:string};
      updateUser(data.user, data.oldPass, data.pass, data.newPermLevel, token)
      .then((obj:{status:string, data:any, token:string})=>
          {callback(obj.status, obj.data, obj.token)});
      break;
    case 'delAcc':
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
      data = data as {msg:string, room:string};
      if (data.msg.length == 0) {
        callback("SUCCESS", null, token); break;
      }
      sendMsg(data.msg.slice(0, 1024), data.room, token, callback);
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
      realias(data.alias, token)
      .then((obj:{status:string, data:any, token:string})=>
        {callback(obj.status, obj.data, obj.token)});
      break;
    default:
      callback("ERROR", {error: "Unknown command string!"}, token);
  }
  return; 
}


function eeFormat(data:string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <script src='./utils.js'></script>
    <title>Everyone Edits | BetaOS Systems</title>
    <script>
    </script>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@100;400;700&display=swap" rel="stylesheet">
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
                    '/config', '/admin', '/docs', '/login', '/syslog'];
const ignoreLog = ["getEE", "userRequest", 'getLogs'];