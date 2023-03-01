import { WS } from "./wsHandler";
var escape = require('escape-html');
import {currHandler} from './initialiser';
// import { hashSync, compareSync} from 
var bcrypt = require("bcrypt");
const path = require('path');
import { updateUser } from "./updateuser";
import {systemLog} from './misc';
import {replacements} from './replacements'
const fs = require("fs");
import {database} from './database';
const DB = database.collection('SystemAUTH');
const DB2 = database.collection('SupportMessaging');

export function validate(user:string, pwd:string, action:string, access:string, callback:any, token:string="") {
  if (action != "refresh" && action != "refresh_log"
      && action != "sendMsg" && action != "bMsg" && 
     action != "checkAccess_A") systemLog("Validating as "+user+" with action "+action +" (token "+token+")");
  if (!token || !token.match("[0-9]+") || 
     (!user || user && action !="CMD" && action !="sendMsg" && !user.match("^[a-zA-Z0-9_]+$")) || 
     (!pwd || action != "CMD" && pwd.length<=0)) 
  {
    if (action == "add" || action == "login")
    {
      systemLog("Unknown error")
      callback.end(JSON.stringify("ERROR"))
      return;
    } 
  }

  if (action == "bMsg") {
    DB2.insertOne({
      fieldName: "MSG", 
      sender:"BetaOS_System", 
      data:user, 
      permLevel:3, 
      expiry:Date.now()+1000*60*60});
    return;
  }
   // data validation complete
  if (action=="logout") {
    systemLog("Logging out "+token)
    DB.deleteOne({fieldName:"TOKEN", token:{$eq:token}});
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }

  // attempt to add user or run commands or access support (REQUIRE PERMLEVELS)
  if (action=="add" || action=="CMD" || 
      action == "checkAccess" || action == "sendMsg"||
     action == "refresh" || action == "checkAccess_A" || 
     action == "refresh_log" || action == "userReq" || 
     action == "renick") {
    DB.findOne({fieldName: "TOKEN", token:{$eq:token}}).then(
    (obj:{associatedUser:string, expiry:number})=>{
      if (obj == null) {
        systemLog("No active session");
        if (action == "checkAccess" || action == "checkAccess_A") {
          callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        }
        else callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = obj.expiry;
      let tokenUser = obj.associatedUser;
      if (action != "refresh" && action != "refresh_log"
         && action != "sendMsg" && action != "checkAccess_A") systemLog("Logged in as "+tokenUser+" | Expiring in: "+(expiryTime-Date.now()) + " ms");
      if (expiryTime<Date.now()) {
        systemLog("Token expired. Logged out user.")
        DB.deleteOne({fieldName:"TOKEN", token:{$eq:token}});
        if (action == "checkAccess" || action == "checkAccess_A") 
          callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        else callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      if (action == "userReq") {
        if (!obj) callback.end(JSON.stringify("NOACTIVE"));
        else callback.end(JSON.stringify(obj.associatedUser));
        return;
      }
      DB.findOne({fieldName:"UserData", user:obj.associatedUser}).then(
      (obj2:{permLevel:number, alias:string|null})=>{
        let perms = obj2.permLevel;
        if (action == "renick" && perms >= 1)
        {
          if (obj.associatedUser != "betatester1024" && 
              obj.associatedUser != "betaos" && 
              (user.toLowerCase() == "betaos" || 
               user.toLowerCase() == "betatester1024")) 
          {
            callback.end(JSON.stringify("ERROR"))
            return;
          }
          DB.updateOne({fieldName:"UserData", user: obj.associatedUser}, {
            $set: {
              alias: user
            },
            $currentDate: { lastModified: true }
          }, {upsert:true});
          callback.end(JSON.stringify(escape(user)));
          return;
        } // renick 
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
          // systemLog("Evaluating "+user);
          try {systemLog(eval(user));} catch(e:any) {systemLog(e);};
          callback.end(JSON.stringify("SUCCESS"));
        }
        else if (action == "checkAccess") {
          systemLog("Support access granted!")
          callback.sendFile(path.join( __dirname, '../frontend', 'support.html' ));
          return;
        }
        else if (action == "checkAccess_A" && perms>=2) {
          // systemLog("SysLog access granted!")
          callback.sendFile(path.join( __dirname, '../frontend', 'sysLog.html' ));
          return;
        }
        else if (action == "sendMsg" && perms >= 1) {
          // systemLog("adding message: "+user);
          DB2.insertOne({
            fieldName: "MSG", 
            sender:obj2.alias?obj2.alias:obj.associatedUser, 
            data:user, 
            permLevel:perms, 
            expiry:Date.now()+1000*60*60})
          callback.end(JSON.stringify("SUCCESS"));
          if (currHandler) currHandler.onMessage(user, obj2.alias?obj2.alias:obj.associatedUser);
          return;
        }
        
        else if (action == "refresh" && perms >= 1) {
          
          // let cursor = DB2.find({fieldName:"MSG"});
          DB2.find({fieldName:"MSG"}).toArray().then((objs:{sender:string, data:string, permLevel:number}[])=>{
            let out = "";
            // console.log(objs)
            for (let i=0; i<objs.length; i++) {
              let cls_n="", extraText = "";
              switch (objs[i].permLevel) {
                case 2: cls_n="admin"; extraText = " [ADMIN]"; break;
                case 3: cls_n="beta"; extraText = " [SYSTEM]"; break;
              }
              let data = objs[i].data;
              data = data.replaceAll("&", "&amp;");
              data = data.replaceAll(">", "&gt;");
              data = data.replaceAll("<", "&lt;");
              data = data.replaceAll("\\n", "<br>");
              for (let i=0; i<replacements.length; i++){
                data = data.replaceAll(replacements[i].from, "<span class='material-symbols-outlined'>"+replacements[i].to+"</span>")
              }
              let cls_w = ""
              if (data.match("^/me")){
                cls_w += " slashMe"
                data = data.replace("/me", ""); 
              }
              if (objs[i].sender.toLowerCase() == "betaos") {
                cls_n+=" beta";
                extraText = " [SYSTEM]";
              }
              cls_w += " "+cls_n;
              out +=`<p class=\"${cls_w}\""><b class='${cls_n}'>
              ${objs[i].sender}${extraText}:</b> ${data} </p><br>`;
            }
            callback.end(JSON.stringify(out));
          });
          return;
        }
        else if (action == "refresh_log" && perms >=2 ) {
          let msg = fs.readFileSync("./systemLog.txt").toString();
          msg = msg.replaceAll("\n","<br>")
          callback.end(JSON.stringify(msg));
        }
        else if (action == "refresh_log" || action == "refresh" || action == "checkAccess_A") {
          callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
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
      DB.updateOne({fieldName:"TOKEN", token:{$eq:token}}, 
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
      if (Date.now()>objs[i].expiry || objs[i].expiry == null) 
        DB2.deleteOne({fieldName:"MSG",expiry:objs[i].expiry})
    }
  });
}