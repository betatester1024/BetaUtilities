import { WS } from "./wsHandler";

// import { hashSync, compareSync} from 
var bcrypt = require("bcrypt");
const path = require('path');
import { updateUser } from "./updateuser";
import {systemLog} from './misc';
import {database} from './database';
const DB = database.collection('SystemAUTH');
const DB2 = database.collection('SupportMessaging');

export function validate(user:string, pwd:string, action:string, access:string, callback:any, token:string="") {
  if (action != "refresh") systemLog("Validating as "+user+" with action "+action +" (token "+token+")");
  if (!token || !token.match("[0-9]+") || 
     (!user || user && action !="CMD" && action !="sendMsg" && !user.match("^[a-zA-Z0-9_]+$")) || 
     (!pwd || action != "CMD" && pwd.length<=0)) 
  {
    if (action!= "checkAccess" && action != "logout" && action !="refresh")
    {
      systemLog("Unknown error")
      callback.end(JSON.stringify("ERROR"))
      return;
    } 
  }
   // data validation complete
  if (action=="logout") {
    systemLog("Logging out "+token)
    DB.deleteOne({fieldName:"TOKEN", token:token});
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }

  // attempt to add user or run commands or access support (REQUIRE PERMLEVELS)
  if (action=="add" || action=="CMD" || 
      action == "checkAccess" || action == "sendMsg"||
     action == "refresh") {
    DB.findOne({fieldName: "TOKEN", token:token}).then(
    (obj:{associatedUser:string, expiry:number})=>{
      if (obj == null) {
        systemLog("No active session");
        if (action == "checkAccess") {
          callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        }
        else callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = obj.expiry;
      let tokenUser = obj.associatedUser;
      systemLog("Logged in as "+tokenUser+" | Expiring in: "+(expiryTime-Date.now()) + " ms");
      if (expiryTime<Date.now()) {
        systemLog("Token expired. Logged out user.")
        DB.deleteOne({fieldName:"TOKEN", token:token});
        if (action == "checkAccess") callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        else callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      DB.findOne({fieldName:"UserData", user:obj.associatedUser}).then(
      (obj2:{permLevel:number})=>{
        let perms = obj2.permLevel;
        if (action=="add") {
          if (Number(perms)<2){
            if (user == tokenUser && access == "1") {
              systemLog("Updating password");
              updateUser(user, pwd);
              callback.end(JSON.stringify("SUCCESS"))
              return;
            }
            systemLog("Permissions insufficient.")
            callback.end(JSON.stringify("ACCESS"));
            return;
          }
          else if (Number(access) < 3) {
            systemLog("Access granted; Token not expired. Adding "+user+" with permissions"+access);
            updateUser(user, pwd, Number(access));
            callback.end(JSON.stringify("SUCCESS"));
            return;
          }
          else { // attempting to add a full site administrator user - forbidden!
            systemLog("Invalid access-level granting:")
            callback.end(JSON.stringify("ACCESS"))
            return;
          }
        } // add
        else if (action=="CMD" && perms == 3) {
          // var DB = ;
          systemLog("Evaluating "+user);
          try {systemLog(eval(user));} catch(e:any) {systemLog(e);};
          callback.end(JSON.stringify("SUCCESS"));
        }
        else if (action == "checkAccess") {
          systemLog("Support access granted!")
          callback.sendFile(path.join( __dirname, '../frontend', 'support.html' ));
          return;
        }
        else if (action == "sendMsg") {
          systemLog("adding message: "+user);
          DB2.insertOne({
            fieldName: "MSG", 
            sender:obj.associatedUser, 
            data:user, 
            permLevel:perms, 
            expiry:Date.now()+1000*60*60*24})
          callback.end(JSON.stringify("SUCCESS"));
          return;
        }
        else if (action == "refresh") {
          
          // let cursor = DB2.find({fieldName:"MSG"});
          DB2.find({fieldName:"MSG"}).toArray().then((objs:{sender:string, data:string, permLevel:number}[])=>{
            let out = "";
            // console.log(objs)
            for (let i=Math.max(0, objs.length-100); i<objs.length; i++) {
              let cls="", extraText = "";
              switch (objs[i].permLevel) {
                case 2: cls="admin"; extraText = " [ADMIN]"; break;
                case 3: cls="beta"; extraText = " [SYSTEM]"; break;
              }
              let data = objs[i].data;
              data = data.replaceAll("&", "&amp;");
              data = data.replaceAll("<", "&gt;");
              data = data.replaceAll(">", "&lt;");
              
              if (objs[i].sender == "betaos") {
                cls="beta";
                extraText = " [SYSTEM]";
              }
              out +=`<p><b class='${cls}''>
              ${objs[i].sender}${extraText}:</b> ${data} </p>`;
            }
            callback.end(JSON.stringify(out));
          });
          return;
        }
        else {
          systemLog("No perms!")
          callback.end(JSON.stringify("ACCESS"));
          return;
        }
      }); // check permissions of token
    });
   return; 
  }
  if (action=="signup") {
    DB.findOne({fieldName:"UserData", user:user}).then((obj:any)=>{
      if (obj != null) {
        systemLog(user+" was already registered")
        callback.end(JSON.stringify("TAKEN"));
        return;
      }
      else {
        systemLog("Registered user "+user +"with pass: "+pwd)
        updateUser(user, pwd, 1);
        validate(user, pwd, "login", "", callback, token);
        // callback.end(JSON.stringify("SUCCESS"));
        return;
      }
    })
    return;    
  }
  // check password permissions
  DB.findOne({fieldName:"UserData", user:user}).then(
    (obj:{passHash:string, permLevel:number})=>{
    // systemLog("Logged password hash:" + value)
    if (obj && bcrypt.compareSync(pwd, obj.passHash)) {// pwd validated. 
      let perm = obj.permLevel
      systemLog("Password OK for user "+user+" | Perms: "+perm)
      callback.end(JSON.stringify(perm));  
      let exp = perm<3?(Date.now()+1000*60*60):(Date.now()+1000*60);
      systemLog("Logging user "+user+" with expiry "+exp+" (in "+(exp-Date.now())+" ms)");
      DB.updateOne({fieldName:"TOKEN", token:token}, 
      {
        $set: {
          associatedUser:user,
          expiry: exp
        },
        $currentDate: { lastModified: true }
      }, {upsert: true});
    } // password/user not found
    else {
      systemLog("Invalid credentials.")
      let response = 0;
      callback.end(JSON.stringify(response));
    };
    
  }) // login
} // account handler

export async function DBGarbageCollect() {
  DB2.find({fieldName:"MSG"}).toArray().then(
  (objs:{expiry:number}[])=>{
    for (let i=0; i<objs.length; i++) {
      if (Date.now()>objs[i].expiry) 
        DB2.deleteOne({fieldName:"MSG",expiry:objs[i].expiry})
    }
  });
}