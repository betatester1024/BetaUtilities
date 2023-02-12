// we have a front-end!
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');  
// Create application/x-www-form-urlencoded parser  
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
const app = express();
const port = 4000;
import {rooms} from './messageHandle';
import { validate } from './HASHTHEDAMNTHING';
export function updateServer() {  
  
  app.get('/', (req:any, res:any) => {
    let str = "BetaUtilities is in: ";
    for (let j = 0; j < rooms.length - 1; j++) { 
      str += ` <a href="https://euphoria.io/room/${rooms[j]}">&${rooms[j]}</a>,` ; 
    }
    str += ` ${rooms.length>1?"and ":""}<a href="https://euphoria.io/room/${rooms[rooms.length-1]}">&${rooms[rooms.length-1]}</a>!  `;
    if (rooms.length == 0) {
      str = "ERROR";
    } // rooms failed
    fs.writeFileSync("frontend/status.html",str);
    res.sendFile(path.join( __dirname, '../frontend', 'index.html' ));
  });
  app.get('/favicon.ico', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'favicon.ico' ));
  });
  app.get('/NotoSansDisplay-Variable.ttf', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'NotoSansDisplay-Variable.ttf' ));
  });
  app.get('/status.html', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../frontend', 'status.html' ));
  });
  
  app.get('/frontend.js', (req:any, res:any) => {
    res.sendFile(path.join( __dirname, '../.build/frontend', 'frontend.js' ));
  });
  app.post('/login', urlencodedParser, function (req:any, res:any) {  
   // Prepare output in JSON format  
    // if ()
    validate(req.user as string, req.pwd as string, res)
   
  });
  
  app.listen(port, () => {
    console.log(`Front-end is running on ${port}.`);
  });
}