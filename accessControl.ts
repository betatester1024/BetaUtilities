import { WS } from "./wsHandler";
var escape = require('escape-html');
import {webHandlers, sysRooms} from './initialiser';
// import { hashSync, compareSync} from 
var bcrypt = require("bcrypt");
const linkifyHtml = require("linkify-html");
const path = require('path');
import { updateUser } from "./updateuser";
import {systemLog} from './misc';
import {replacements} from './replacements'
const fs = require("fs");
const EXPIRY = 1000*60*60*24;
import { sendMsgAllRooms } from "./server";
import {database} from './database';
  const DB = database.collection('SystemAUTH');
  const DB2 = database.collection('SupportMessaging');
  const DB3 = database.collection('BetaUtilities');
import { WebH } from "./webHandler";

export function validate(user:string, pwd:string, action:string, access:string, callback:any, token:string="") {
  if (action != "refresh" && action != "refresh_log"
      && action != "sendMsg" && action != "bMsg" && 
     action != "checkAccess_A" && action != "checkAccess" &&
      action != "userReq" && action != "acquireTodo" && 
     action != "ROOMLISTING") systemLog("Validating as "+user+" with action "+action +" (token "+token+")");
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
  if (action == "ROOMLISTING") {
    callback.end(JSON.stringify(sysRooms))
  }
  if (action == "bMsg") {
    DB2.insertOne({
      fieldName: "MSG", 
      sender:"BetaOS_System", 
      data:user, 
      room: access,
      permLevel:3, 
      expiry:Date.now()+EXPIRY});
    sendMsgAllRooms(access, format({permLevel:3, data:user, sender:"BetaOS_System"}));
    return;
  }
  if (action == "whois") {
    // console.log(user);
    DB.find({fieldName:"UserData", user:{$eq:user}}).toArray().then((obj:{alias:string}[])=>{
      // callback.end(JSON.stringify(obj?obj.user:"[None found]"));
      // console.log(obj, user)
      let out = "";
      if (obj)
      for (let i=0; i<obj.length; i++) {
        out += obj[i].alias?obj[i].alias:obj[i].user;
      }
      sendMessage("[WHOIS SERVICE]", "Aliases for "+user+": "+(out?out:"[NONE FOUND]"), access, 3);
    })
    DB.find({fieldName:"UserData", alias:{$eq:user}}).toArray().then((obj:{user:string, permLevel:string}[])=>{
      // callback.end(JSON.stringify(obj?obj.user:"[None found]"));
      let out = "";
      if (obj)
      for (let i=0; i<obj.length; i++) {
        out += obj[i].user+(obj[i].permLevel>2?"[Super-admin]":(obj[i].permLevel==2?"[Admin]":"[User]"));
      }
      sendMessage("[WHOIS SERVICE]", "BetaOS System Account for alias "+user+": "+(out?out:"[NONE FOUND]"), access, 3);
    })
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
  let todoMatch = action.match("updateTODO([0-9]+)");
  let todoMatch2 = action.match("completeTODO([0-9]+)");
  let todoMatch3 = action.match("deleteTODO([0-9]+)");
  if (action=="add" || action=="CMD" || 
      action == "checkAccess" || action == "sendMsg"||
     action == "refresh" || action == "checkAccess_A" || 
     action == "refresh_log" || action == "userReq" || 
     action == "renick" || action == "delete" || 
      action == "acquireTodo" ||todoMatch || 
      todoMatch2 || action == "addTODO" ||
     action == "newRoom" || todoMatch3 || 
      action == "delRoom" || action == "whois") {
    DB.findOne({fieldName: "TOKEN", token:{$eq:token}}).then(
    (obj:{associatedUser:string, expiry:number})=>{
      if (action == "refresh") {
          
          // let cursor = DB2.find({fieldName:"MSG"});
          // console.log(access);
          DB2.find({fieldName:"MSG", room:{$eq:access}}).toArray().then((objs:{sender:string, data:string, permLevel:number}[])=>{
            let out = "";
            // console.log(objs)
            for (let i=0; i<objs.length; i++) {
              out += format(objs[i]);
            }
            callback.end(JSON.stringify(out));
          });
          DB2.find({fieldName:"MSG", room:{$eq:access}}).toArray().then((objs:{sender:string, data:string, permLevel:number}[])=>{
            let out = "";
            // console.log(objs)
            for (let i=0; i<objs.length; i++) {
              out += format(objs[i]);
            }
            callback.end(JSON.stringify(out));
          });
          return;
      } // fiiine. you can have your refreshy.
      
      if (obj == null && action != "sendMsg") {
        systemLog("No active session");
        if (action == "checkAccess" || action == "checkAccess_A") {
          callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        }
        else callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = obj?obj.expiry:9e99;
      let tokenUser = obj?obj.associatedUser:"";
      if (action != "refresh" && action != "refresh_log"
         && action != "sendMsg" && action != "checkAccess_A" &&
         action != "userReq" && action !="checkAccess" && action != "whois"
        ) systemLog("Logged in as "+tokenUser+" | Expiring in: "+(expiryTime-Date.now()) + " ms");
      if (expiryTime<Date.now()) {
        systemLog("Token expired. Logged out user.")
        DB.deleteOne({fieldName:"TOKEN", token:{$eq:token}});
        if (action == "checkAccess" || action == "checkAccess_A") 
          callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
        else callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      
      DB.findOne({fieldName:"UserData", user:tokenUser}).then(
      (obj2:{permLevel:number, alias:string|null, todo:string[]})=>{
        if (!obj2 && action != "sendMsg") {callback.end(JSON.stringify("ERROR")); return;}
        let perms = obj2?obj2.permLevel:0;
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
        // console.log(action);
        if (action == "acquireTodo" || todoMatch 
        || todoMatch2 || action == "addTODO" || todoMatch3) {
          // if (pwd == process.env['TODOPwd']) {
            // console.log(obj2.todo);
            if (!obj2.todo) obj2.todo = [];
            if (action == "acquireTodo") callback.end(JSON.stringify(obj2.todo?obj2.todo:""));
            else {
              // console.log(user);
              if (todoMatch) 
                if (todoMatch[1] < obj2.todo.length)
                  obj2.todo[todoMatch[1]] = user;
              if (todoMatch2 || todoMatch3) 
                if (obj2.todo.length > (todoMatch2?todoMatch2[1]:todoMatch3[1])) 
                  obj2.todo.splice(todoMatch2?todoMatch2[1]:todoMatch3[1], 1);
              if (action == "addTODO") {
                obj2.todo.push(user);
              }
              // console.log(obj2.todo);
              DB.updateOne({fieldName:"UserData", user: obj.associatedUser}, {
                $set: {
                  todo:obj2.todo
                },
                $currentDate: { lastModified: true }
              }, {upsert:true}).then(()=>{callback.end(JSON.stringify("SUCCESS"));});
              return;
            }
          // }
          return;
        }
        if (action == "userReq") {
          callback.end(JSON.stringify(obj.associatedUser+" "+obj2.permLevel));
          return;
        }
        if (action=="add" || action == "delete") {
          DB.findOne({fieldName:"UserData", user:{$eq:user}}).then(
            (obj3: {permLevel:number}) => {
              // console.log(obj3);
              if (obj3 && obj3.permLevel>perms) {
                systemLog("Trying to delete a higher-level user");
                callback.end(JSON.stringify("ACCESS"));
                return;
              }
              else if (action == "delete" && (perms >= 2||user == obj.associatedUser)) {
                DB.findOneAndDelete({fieldName:"UserData", user:{$eq:user}})
                  .then((res:any)=>{callback.end(JSON.stringify(escape(user)))});
                systemLog("Deleted user "+user);
                return;
              }
              else if (action == "delete") {
                systemLog("Insufficient access for deletion")
                callback.end(JSON.stringify("ACCESS"));
                return;
              }
              if (Number(perms)<2){
                if (user == tokenUser && access == "1") {
                  systemLog("Updating password");
                  updateUser(user, pwd);
                  callback.end(JSON.stringify("SUCCESS"))
                  let exp = perms<3?(Date.now()+1000*60*60*24*30):(Date.now()+1000*300);
                  systemLog("Logging user "+user+" with expiry "+exp+" (in "+(exp-Date.now())+" ms)");
                  DB.updateOne({fieldName:"TOKEN", token:{$eq:token}}, 
                  {
                    $set: {
                      associatedUser:user,
                      expiry: exp
                    },
                    $currentDate: { lastModified: true }
                  }, {upsert: true});
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
            } // callback for searching user to be updated
          );
          return;
        } // add
        else if (action=="CMD" && perms == 3) {
          // var DB = ;
          // systemLog("Evaluating "+user);
          if (user == "!killall") {
            WS.killall();
            callback.end(JSON.stringify("SUCCESS"));
            return;
          }
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
        else if (action == "sendMsg") {
          // console.log("sending message in room"+access);
          const snd = obj2?(obj2.alias?obj2.alias:obj.associatedUser):"ANON|ID"+token%10000;
          sendMessage(snd, user, access, perms);
          let match6 = user.match("^!whois @([0-9a-zA-Z_]+)");
          // console.log(match6);
          if (match6) validate(match6[1], pwd, "whois", access, callback, token);
          callback.end(JSON.stringify("SUCCESS"));

          
          return;
        }
        
        
        else if (action == "refresh_log" && perms >=2 ) {
          DB3.findOne({fieldName:"SYSTEMLOG"}).then((obj:{data:string})=> {
            callback.end(JSON.stringify(obj.data.replaceAll("\n","<br>")));
          })
          return;
          // let msg = fs.readFileSync("./systemLog.txt").toString();
          // msg = msg.replaceAll("\n","<br>")
          // callback.end(JSON.stringify(msg));
        }
        else if (action == "refresh_log" || action == "refresh" || action == "checkAccess_A") {
          callback.sendFile(path.join( __dirname, '../frontend', '403.html' ));
          return;
        }
        else if ((action == "newRoom" || action == "delRoom") && perms >= 2) {
          if (user.match("^[0-9a-zA-Z_\\-]{1,20}$")) {
            DB3.findOne({fieldName:"ROOMS"}).then((obj4:{rooms:string[]})=>{
              let idx = obj4.rooms.indexOf(user);
              if (action == "newRoom" && idx<0) {
                obj4.rooms.push(user);
                // now add betautilities to this room
                webHandlers.push(new WebH(user));
                // sysRooms.push(user);

              }
              else if (action == "delRoom" && idx>=0) {
                if (idx>=0) obj4.rooms.splice(idx, 1);
              }
              else callback.end(JSON.stringify("ERROR"));
              DB3.updateOne({fieldName:"ROOMS"}, {
                $set: {
                  rooms: obj4.rooms
                },
                $currentDate: { lastModified: true }
              }, {upsert:true}).then(()=>{
                if (action != "delRoom") callback.end(JSON.stringify("SUCCESS"));
              });
              if (action == "delRoom" && idx >= 0) {
                sysRooms.splice(sysRooms.indexOf("OnlineSUPPORT|"+user), 1)
                DB2.deleteMany({room: user}).then(()=>{
                  console.log("DONE")
                  callback.end(JSON.stringify("SUCCESS"))
                });
              }
              // else callback.end(JSON.stringify("ERROR"))
            }) 
          }
          else callback.end(JSON.stringify("ERROR"))
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
        systemLog("Registered user "+user +"with pass: [REDACTED]")
        updateUser(user, pwd, 1);
        let exp = (Date.now()+1000*60*60*24*30);
        systemLog("Logging user "+user+" with expiry "+exp+" (in "+(exp-Date.now())+" ms)");
        DB.updateOne({fieldName:"TOKEN", token:{$eq:token}}, 
        {
          $set: {
            associatedUser:user,
            expiry: exp
          },
          $currentDate: { lastModified: true }
        }, {upsert: true});
        callback.end(JSON.stringify("SUCCESS"));
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
      let exp = perm<3?(Date.now()+1000*60*60*24*30):(Date.now()+1000*300);
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
  DB3.find({fieldName:"TIMER"}).toArray().then(
  (objs:{expiry:number, notifyingUser:string, msg:string}[])=>{
    for (let i=0; i<objs.length; i++) {
      if (Date.now()>objs[i].expiry || objs[i].expiry == null) {
        DB3.deleteOne({fieldName:"TIMER",expiry:objs[i].expiry})
        WS.notifRoom.socket.send(WS.toSendInfo("!tell @"+objs[i].notifyingUser+" You are reminded of: "+
                                               objs[i].msg.replaceAll(/\\/gm, "\\\\").replaceAll(/"/gm, "\\\"")));
      }
    }
  });
  
}

function format(obj:{permLevel:number, data:string, sender:string}) {
  let cls_n="", extraText = "";
  switch (obj.permLevel) {
    case 2: cls_n="admin"; extraText = " [ADMIN]"; break;
    case 3: cls_n="beta"; extraText = " [SYSTEM]"; break;
  }
  let data = obj.data;


  data = data.replaceAll("&", "&amp;");
  data = data.replaceAll(">", "&gt;");
  data = data.replaceAll("<", "&lt;");
  data = data.replaceAll("\\n", "<br>");
  data = data.replaceAll(/(.+\.(jpg|jpeg|png|gif|mp4))(\?.*)?$/gm, (match:string, p1:string)=>
  {
      match = match.replaceAll("'", "\\'")
      match = match.replaceAll("\"", "\\\"");
      match = match.replaceAll("&amp;", "&");
      // console.log("<img onclick='window.open(\""+encodeURI(match)+"\")'src='"+encodeURI(match)+"'></img>");
      return "<img onclick='window.open(\""+encodeURI(match)+"\")'src='"+encodeURI(match)+"'></img>";
  });
  data = data.replaceAll(/\&amp;([0-9a-zA-Z]+)/gm, (match:string, p1:string)=>{return "<a href='https://euphoria.io/room/"+p1+"'>"+match+"</a>"});
  data = data.replaceAll(/#([0-9a-zA-Z_\-]{1,20})/gm, (match:string, p1:string)=>{return "<a href='/support?room="+p1+"'>"+match+"</a>"});
  
  data = linkifyHtml(data, {
    target: {
      url: "_blank",
    },
  });
  // data = data.replaceAll(/([-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/igmu, 
    // (match:string, p1:string)=>{return "<a href='https://"+match+"'>"+match+"</a>"})
  
  for (let i=0; i<replacements.length; i++){
    data = data.replaceAll(replacements[i].from, "<span class='material-symbols-outlined'>"+replacements[i].to+"</span>")
  }
  let cls_w = ""
  let slashMe = false;
  if (data.match("^/me")){
    slashMe = true;
    cls_w += " slashMe"
    data = data.replace("/me", ""); 
  }
  // if (obj.sender.toLowerCase() == "betaos") {
    // cls_n+=" beta";
    // extraText = " [SYSTEM]";
  // }
  cls_w += " "+cls_n;
  return `<p class=\"${cls_w}\""><b class='${cls_n}'>${obj.sender}${extraText}${slashMe?"":":"}</b> ${data} </p><br>`;
}

function findHandler(name:string)
{
  for (let i=0; i<webHandlers.length; i++) {
    if (webHandlers[i].roomName == name) return webHandlers[i];
  }
  return null;
}

function sendMessage(snd:string, user:string, access:string, perms:number) {
  DB2.insertOne({
    fieldName: "MSG", 
    sender:snd, 
    data:user, 
    room: access,
    permLevel:perms?perms:0, 
    expiry:Date.now()+EXPIRY})
  
  // console.log("Sending message:"+user);
  sendMsgAllRooms(access, format({permLevel:perms, data:user, sender:snd}));
  let handler = findHandler("OnlineSUPPORT|"+access);
  if (handler) {
    handler.onMessage(user, snd);
    // console.log("Message received?")
  }
  else {
    handler = findHandler("HIDDEN|"+access);
    if (handler) {
      handler.onMessage(user, snd);
    }
    else console.log("ROOMINVALID")
  }
}