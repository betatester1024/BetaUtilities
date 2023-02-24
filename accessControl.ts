import { WS } from "./wsHandler";

// import { hashSync, compareSync} from 
var bcrypt = require("bcrypt");
const path = require('path');
import {systemLog} from './misc';

export function validate(user:string, pwd:string, action:string, access:string, callback:any, token:string="") {
  systemLog("Validating as "+user+" with action "+action +" (token "+token+")");
  if (!token || !token.match("[0-9]+") || 
     (!user || user && action !="CMD" && !user.match("[a-zA-Z0-9_]+")) || 
     (!pwd || action != "CMD" && pwd.length<=0)) 
  {
    if (action!= "checkAccess" && action != "logout")
    {
      systemLog("Unknown error")
      callback.end(JSON.stringify("ERROR"))
      return;
    } 
  }
   // data validation complete
  if (action=="logout") {
    systemLog("Logging out "+token)
    WS.db.delete(token);
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }

  // attempt to add user or run commands or access support (REQUIRE PERMLEVELS)
  if (action=="add" || action=="CMD" || action == "checkAccess") {
    WS.db.get("T="+token).then((data:string)=>{
      if (data == null) {
        systemLog("No active session");
        if (action == "checkAccess") callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        else callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = Number(data.split(" ")[1]);
      let tokenUser = data.split(" ")[0];
      systemLog("Logged in as "+tokenUser+" | Expiring in: "+(expiryTime-Date.now()) + " ms");
      if (expiryTime<Date.now()) {
        systemLog("Token expired. Logged out user.")
        WS.db.delete("T="+token);
        if (action == "checkAccess") callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        else callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      WS.db.get(tokenUser+"^PERM").then((perms:string)=> {
        if (action=="add") {
          if (Number(perms)<2){
            if (user == tokenUser && access == "1") {
              systemLog("Updating password");
              WS.db.set(user, bcrypt.hashSync(pwd, 8));
              callback.end(JSON.stringify("SUCCESS"))
            }
            systemLog("Permissions insufficient.")
            callback.end(JSON.stringify("ACCESS"));
          }
          else if (Number(access) < 3) {
            systemLog("Access granted; Token not expired. Adding "+user+" with permissions"+access);
            WS.db.set(user, bcrypt.hashSync(pwd, 8));
            WS.db.set(user+"^PERM", access);
            callback.end(JSON.stringify("SUCCESS"));
          }
          else { // attempting to add a full site administrator user - forbidden!
            systemLog("Invalid access-level granting:")
            callback.end(JSON.stringify("ACCESS"))
          }
        } // add
        else if (action=="CMD" && perms == "3") {
          var DB = WS.db;
          systemLog("Evaluating "+user);
          try {systemLog(eval(user));} catch(e:any) {systemLog(e);};
          callback.end(JSON.stringify("SUCCESS"));
        }
        else if (action == "checkAccess") {
          systemLog("Support access granted!")
          callback.sendFile(path.join( __dirname, '../frontend', 'support.html' ));
        }
        else {
          systemLog("No perms!")
          callback.end(JSON.stringify("ACCESS"));
        }
      }); // check permissions of token
    });
   return; 
  }
  if (action=="signup") {
    WS.db.list().then((keys:any)=>{
      if (keys.indexOf(user)>=0) {
        systemLog(user+" was already registered")
        callback.end(JSON.stringify("TAKEN"));
      }
      else {
        systemLog("Registered user "+user)
        WS.db.set(user, bcrypt.hashSync(pwd, 8));
        WS.db.set(user+"^PERM", "1");
        callback.end(JSON.stringify("SUCCESS"));
      }
    })
    return;    
  }
  // check password permissions
  WS.db.get(user).then((value:any)=>{
    // systemLog("Logged password hash:" + value)
    if (value && bcrypt.compareSync(pwd, value)) {// pwd validated. 
      
      WS.db.get(user+"^PERM").then((perm:any)=>{
        systemLog("Password OK for user "+user+" | Perms: "+perm)
        callback.end(JSON.stringify(perm));  
        let exp = perm<3?(Date.now()+1000*60*60):(Date.now()+1000*60);
        systemLog("Logging user "+user+" with expiry "+exp+" (in "+(exp-Date.now())+" ms)");
       WS.db.set("T="+token, user+" "+exp);
      })  
    } // password/user not found
    else {
      systemLog("Invalid credentials.")
      let response = 0;
      callback.end(JSON.stringify(response));
    };
    
  }) // login
} // account handler