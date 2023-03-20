const express = require('express')
const app = express()
const crypto = require("crypto");
const parse = require("co-body");
 // for generating secure random #'s
import {K} from './consts';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
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
    res.sendFile(K.frontendDir+'/index.html');
    incrRequests();
  })

  app.get('/login', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/login.html');
    incrRequests();
  });

  app.get('/signup', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/signup.html');
    incrRequests();
  });

  app.get('/config', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/config.html');
    incrRequests();
  });

  app.get('/account', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/config.html');
    incrRequests();
  });

  app.get('/admin', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/admin.html');
    incrRequests();
  });
  
  app.get('/logout', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/logout.html');
    incrRequests();
  });

  app.get('/accountDel', (req:any, res:any) => {
    res.sendFile(K.frontendDir+'/delAcc.html');
    incrRequests();
  });
    
  app.get('*/favicon.ico', (req:Request, res:any)=> {
    res.sendFile(K.rootDir+'/favicon.ico')
    incrRequests();
  })
  
  app.get('/*.js*', (req:any, res:any) => {
    res.sendFile(K.jsDir+req.url);
    incrRequests();
  })
  
  app.get('/*.ts', (req:any, res:any) => {
    res.sendFile(K.jsDir+req.url);
    incrRequests();
  })

  app.get('/*.css', (req:any, res:any) => {
    res.sendFile(K.frontendDir+req.url);
    incrRequests();
  })

  app.get('/*', (req:any, res:any) => {
    res.sendFile(K.frontendDir+"404.html");
    incrRequests();
  })
  
  
  app.post('/server', urlencodedParser, async (req:any, res:any) => {
    incrRequests();
    var body = await parse.json(req);
    if (!body) res.end(JSON.stringify({status:"ERROR", data:null}));
    // let cookiematch = req.cookies.match("sessionID=[0-9a-zA-Z\\-]");
    makeRequest(body.action, req.cookies.sessionID, body.data, (s:string, d:any, token:string)=>{
      if(body.action=="login"||body.action == "logout" ||
        body.action == "delAcc" || body.action == "signup") res.cookie('sessionID', token?token:"", { maxAge: 1000*60*60*24*30, httpOnly: true, secure:true, sameSite:"Strict"});
      res.end(JSON.stringify({status:s, data:d}));
    })
  });
  
  app.listen(K.port, () => {
    console.log(`BetaUtilities V2 listening on port ${K.port}`)
  })
}

async function incrRequests() {
  let ct:{visitCt:number} = await K.uDB.findOne({fieldName:"VISITS"});
  K.uDB.updateOne({fieldName:"VISITS"}, {$set:{visitCt:ct.visitCt+1}}, {upsert:true});
}

function makeRequest(action:string|null, token:string, data:any|null, callback: (status:string, data:any, token:string)=>any) {
  switch (action) {
    case 'test':
      callback("SUCCESS", {abc:"def", def:5}, token);
      break;
    case 'login': 
      // validate login-data before sending to server
      data = data as {user:string, pass:string};
      validateLogin(data.user, data.pass, callback, token);
      break;
    case 'signup':
      data = data as {user:string, pass:string};
      signup(data.user, data.pass, callback, token);
      break;
    case 'userRequest': 
      userRequest(callback, token);
      break;
    case 'updateuser': 
      data = data as {user:string, oldPass: string, pass:string, newPermLevel:string};
      updateUser(data.user, data.oldPass, data.pass, data.newPermLevel, callback, token);
      break;
    case 'delAcc':
      data = data as {user:string, pass:string};
      delAcc(data.user, data.pass, callback, token);
      break;
    case 'logout':
      logout(callback, token);
      break;
    default:
      callback("ERROR", {error: "Unknown command string!"}, token);
  }
  return; 
}
const argon2 = require('argon2');
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html


async function validateLogin(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  let usrInfo = await K.authDB.findOne({fieldName:"UserData", user:{$eq:user}}) as {pwd:string, permLevel:number};
  if (!usrInfo) {
    callback("ERROR", {error:"No such user!"}, token); // keep the original token.
    return;
  }
  else if (await argon2.verify(usrInfo.pwd, pwd)) {
    let uuid = crypto.randomUUID() // gen new token
    let userData:{permLevel:number} = await K.authDB.findOne({fieldName:"UserData", user:user});
    await K.authDB.insertOne({fieldName:"Token", associatedUser:user, token:uuid, expiry: Date.now()+K.expiry[userData.permLevel]})
    callback("SUCCESS", {perms: usrInfo.permLevel}, uuid);
    return;
  } else {
    callback("ERROR", {error:"Password is invalid!"}, token);
    return;
  }
}

async function signup(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  if (pwd.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  let usrInfo = await K.authDB.findOne({fieldName:"UserData", user:user}) as {pwd:string, permLevel:number};
  if (usrInfo) {
    callback("ERROR", {error:"User is registered"}, token) // keep the original token.
    return;
  }
  else {
    let hash = await argon2.hash(pwd, K.hashingOptions); 
    await K.authDB.insertOne({fieldName:"UserData", user:user, pwd:hash, permLevel: 1});
    validateLogin(user, pwd, callback, token);
    return;
  }
}

async function userRequest(callback:(status:string, data:any, token:string)=>any, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Your session could not be found!"}, "")
    return;
  }
  let userData:{permLevel:number} = await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", {error:"Your session has expired!"}, "")
    return;
  }
  callback("SUCCESS", {user: tokenData.associatedUser, perms:userData.permLevel, expiry: tokenData.expiry}, token);
}

async function logout(callback:(status:string, data:any, token:string)=>any, token:string) {
  await K.authDB.deleteOne({fieldName:"Token", token:token});
  callback("SUCCESS", null, "");
}

async function updateUser(user:string, oldPass:string, newPass:string, newPermLevel:number, callback:(status:string, data:any, token:string)=>any, token:string) {
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  if (newPass.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Cannot update user information: Your session could not be found!"}, "")
    return;
  }
  let userData:{permLevel:number} = await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", {error:"Cannot update user information: Your session has expired!"}, "")
    return;
  }
  if (userData.permLevel >=2) {// administrators can update other accounts
    await K.authDB.updateOne({fieldName:"UserData", user:user}, 
        {$set:{pwd:await argon2.hash(newPass, K.hashingOptions), permLevel:newPermLevel}});
    callback("SUCCESS", {perms: newPermLevel}, token);
    return;
  }
  else if (await argon2.verify(userData.pwd, oldPass)) {
    await K.authDB.updateOne({fieldName:"UserData", user:tokenData.associatedUser}, 
        {$set:{pwd:await argon2.hash(newPass, K.hashingOptions)}});
    callback("SUCCESS",{perms:userData.permLevel}, token);
    return;
  } else {
    callback("ERROR", {error:"Cannot update user information: Access denied!"}, token);
    return;
  }
}

async function delAcc(user:string, pass:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Cannot update user information: Your session could not be found!"}, "")
    return;
  }
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  
  let usrInfo = await K.authDB.findOne({fieldName:"UserData", user:{$eq:user}}) as {pwd:string, permLevel:number};
  if (!usrInfo) {
    callback("ERROR", {error:"No such user!"}, token);
    return;
  }
  let loginInfo:{permLevel:number}= await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (loginInfo.permLevel>=2) { // admin override
    await K.authDB.deleteOne({fieldName:"Token", token:token})
    await K.authDB.deleteOne({fieldName:"UserData", user:user});
    callback("SUCCESS", null, token);
    return;
  }
  if (pass.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  else if (await argon2.verify(usrInfo.pwd, pass)) {
    await K.authDB.deleteOne({fieldName:"Token", token:token})
    await K.authDB.deleteOne({fieldName:"UserData", user:user});
    callback("SUCCESS", null, "");
    return;
  } else {
    callback("ERROR", {error:"Cannot delete account. Password is invalid!"}, token);
    return;
  }
}