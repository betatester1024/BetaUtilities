const express = require('express')
const app = express()
const port = 3000
const rootDir = '/home/runner/BetaUtilitiesV2/';
const frontendDir = '/home/runner/BetaUtilitiesV2/frontend/';
const jsDir = '/home/runner/BetaUtilitiesV2/.build/frontend/';
const bodyParser = require('body-parser'); 
const urlencodedParser = bodyParser.urlencoded({ extended: false }) 
var RateLimit = require('express-rate-limit');

export function initServer() {
  var limiter = RateLimit({
    windowMs: 10*1000, // 10 seconds
    max: 50,
    message: "Too many requests, please try again later.",
    statusCode: 429, // 429 status = Too Many Requests (RFC 6585)
  });
  app.use(limiter);
  
  app.get('/', (req:Request, res:any) => {
    res.sendFile(rootDir+'/frontend/index.html')
  })
  
  app.get('/*.js', (req:any, res:any) => {
    res.sendFile(jsDir+req.url);
  })
  
  app.post('/server', urlencodedParser, (req:any, res:any) => {
    if (!req.body) res.end(JSON.stringify({status:"ERROR", data:null}));
    makeRequest(req.body.action, req.body.token, req.body.data, (s:string, d:any)=>{res.end(JSON.stringify({status:s, data:d}))})
  });
  
  app.listen(port, () => {
    console.log(`BetaUtilities V2 listening on port ${port}`)
  })
}

function makeRequest(action:string|null, token:number|null, data:any|null, callback: (status:string, data:any)=>any) {
  switch (action) {
    case 'test':
      callback("SUCCESS", {abc:"def", def:5});
      break;
    default:
      callback("ERROR", null);
  }
  return; 
}

