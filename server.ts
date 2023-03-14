// we have a front-end!
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');  
// Create application/x-www-form-urlencoded parser  
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
const app = express();
const port = 4000;
import {sysRooms, hidRooms} from './initialiser';
import { validate } from './accessControl';
import {systemLog} from './misc';

var RateLimit = require('express-rate-limit');

export let pushEvents: any[][] = [];
export let hidEvents: any[][] = [];
// import {pushEvents} from './initialiser';
// 

export async function updateServer() { 
  systemLog("");
  
  systemLog("Server active!")
  var limiter = RateLimit({
    windowMs: 10*1000, // 1 minute
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429, // 429 status = Too Many Requests (RFC 6585)
  });
  
  // apply rate limiter to all requests
  app.use(limiter);
  
  app.get('/', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'index.html' ));
  });
  app.get('/favicon.ico', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'favicon.ico' ));
  });
  app.get('/NotoSansDisplay-Variable.ttf', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'NotoSansDisplay-Variable.ttf' ));
  });
  app.get('/status/status_raw.html', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'status_raw.html' ));
  });
  
  app.get('/frontend.js', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../.build/frontend', 'frontend.js' ));
  });

  app.get('/login.js', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../.build/frontend', 'login.js' ));
  });

  app.get('/login', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'login.html' ));
  });

  app.get('/admin', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'admin.html' ));
  });

  app.get('/logout', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'logout.html' ));
  });

  app.get('/signup', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'signup.html' ));
  });
  
  app.post('/login', urlencodedParser, function (req:any, res:any) {  
   // Prepare output in JSON format  
    if (req.body.action == "bMsg") res.end(JSON.stringify("ACCESS"));
    validate(decodeURIComponent(req.body.user) as string, decodeURIComponent(req.body.pass) as string, req.body.action, req.body.access as string, res, req.body.token as string)
   
  });

  app.get("/stream?*", async (req:any, res:any) => {
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive'
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    
    res.write("retry:500\n\n");
    // console.log(req.query.room)
    
    let roomIdx = sysRooms.indexOf("OnlineSUPPORT|"+req.query.room);
    let roomIdx2 = hidRooms.indexOf("HIDDEN|"+req.query.room);
    // console.log(roomIdx2);
    if (roomIdx < 0 && roomIdx2 < 0) {
      res.end();
      console.log("Invalid room: "+req.query.room);
      return;
    }
    // console.log(roomIdx);
    if (roomIdx >= 0) pushEvents[roomIdx].push(res);
    else hidEvents[roomIdx2].push(res);
    res.on("close", () => {
      if (roomIdx >= 0) pushEvents[roomIdx].splice(pushEvents[roomIdx].indexOf(res), 1);
      else hidEvents[roomIdx2].splice(hidEvents[roomIdx2].indexOf(res), 1);
      res.end();
      // console.log("Removed stream");
    });
  });

  app.get("/testevents", (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'support_v2.html' ));
  })

  app.get('/status', (req:any, res:any) => {
    let str = "BetaUtilities is in: ";
    let prefixedRms = [];
    let euphRooms = 0;
    for (let i=0; i<sysRooms.length; i++) {
      if (!sysRooms[i].match("\\|")) {
        euphRooms++;
        prefixedRms.push(`<a href="https://euphoria.io/room/${sysRooms[i]}">&${sysRooms[i]}</a>`);
      }
      else {
        let roomName = sysRooms[i].match("\\|(.+)")[1];
        prefixedRms.push(`<a href="/support?room=${roomName}">#${roomName}</a>`);
      }
    }
    for (let j = 0; j < prefixedRms.length - 1; j++) { str += prefixedRms[j] + ", "; }
    str += (prefixedRms.length>1?"and ":"")+prefixedRms[prefixedRms.length - 1] + "!";
    if (euphRooms == 0) {
      str += "<br> ERROR: Rooms failed on <a href='https://euphoria.io'>euphoria</a>";
    } // rooms failed
    fs.writeFileSync("frontend/status_raw.html",str);
    res.sendFile(path.join( __dirname, '../frontend', 'status.html' ));
  });

  app.get("/globalformat.css", (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'globalformat.css' ));
  }); 

  app.get("/support", (req:any, res:any) => {
    let roomIdx = sysRooms.indexOf("OnlineSUPPORT|"+req.query.room);
    let roomIdx2 = hidRooms.indexOf("HIDDEN|"+req.query.room);
    // console.log(roomIdx, req.query.room)
    if (roomIdx < 0 && roomIdx2 < 0 && req.query.room) {res.sendFile(path.join( __dirname, '../frontend', 'roomNotFound.html'))}
    else if(req.query.room) res.sendFile(path.join( __dirname, '../frontend', 'support.html'));
    else res.sendFile(path.join( __dirname, '../frontend', 'supportIndex.html'));
    // validate("", "", "checkAccess", "", res, req.query.token)
  })

  app.get("/todo", (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'TODO.html' ));
    // validate("", "", "checkAccess", "", res, req.query.token)
  })
  
  app.get("/syslog", (req:any, res:any) => {
    validate("", "", "checkAccess_A", "", res, req.query.token)
  })

  app.get('/about', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'about.html' ));
  });

  app.get('/commands', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'commands.html' ));
  });

  app.get('/contact', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'contact.html' ));
  });

  app.get('*.js.map', (req:any, res:any)=> {
    res.end();
  })
  
  app.get('/*', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', '404.html' ));
  });

  // app.use(function(req:any, res:any, next:any) {
  //     res.status(404).render('frontend/landing.html');
  // });
  // app.get()
  
  app.listen(port, () => {
    systemLog(`Front-end is running on ${port}.`);
  });
}

export function sendMsgAllRooms(room:string, msg:string) {
  let roomId = sysRooms.indexOf("OnlineSUPPORT|"+room);
  let roomId2 = hidRooms.indexOf("HIDDEN|"+room);
  if (roomId<0 && roomId2<0) {
    console.log("invalidROOM:"+room)
    return;
  }
  else if (roomId >= 0) 
    for (let i=0; i<pushEvents[roomId].length; i++) 
      pushEvents[roomId][i].write("data:"+msg+"\n\n");
  else 
    for (let i=0; i<hidEvents[roomId2].length; i++) 
      hidEvents[roomId2][i].write("data:"+msg+"\n\n");
}