import { WS } from "./wsHandler";

// import { hashSync, compareSync} from 
var bcrypt = require("bcrypt");

export function validate(user:string, pwd:string, action:string, access:string, callback:any, token:string="") {
  console.log("Validating as "+user+" with action "+action +" (token "+token+")");
  if (action=="logout") {
    console.log("Logging out "+token)
    WS.db.delete(token);
    callback.end(JSON.stringify("SUCCESS"));
    return;
  }
  if (action=="add") {
    WS.db.get(token).then((data:string)=>{
      if (data == null) {
        console.log("No active session");
        callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = Number(data.split(" ")[1]);
      let tokenUser = data.split(" ")[0];
      console.log("Logged in as "+tokenUser+" | Expiring in: "+(expiryTime-Date.now()) + " ms");
      if (expiryTime<Date.now()) {
        console.log("Token expired. Logged out user.")
        WS.db.delete(token);
        callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      WS.db.get(tokenUser+"^PERM").then((perms:string)=> {
        if (perms!="2"){
          if (user == tokenUser && access == "1") {
            console.log("Updating password");
            WS.db.set(user, bcrypt.hashSync(pwd, 8));
            callback.end(JSON.stringify("SUCCESS"))
          }
          console.log("Permissions insufficient.")
          callback.end(JSON.stringify("ACCESS"));
        }
        else {
          console.log("Access granted; Token not expired. Adding "+user+" with permissions"+access);
          WS.db.set(user, bcrypt.hashSync(pwd, 8));
          WS.db.set(user+"^PERM", access);
          callback.end(JSON.stringify("SUCCESS"));
        }
      }); // check permissions of token
    });
   return; 
  }
  // check password permissions
  WS.db.get(user).then((value:any)=>{
    console.log("Logged password hash:" + value)
    if (bcrypt.compareSync(pwd, value)) {// pwd validated. 
      
      WS.db.get(user+"^PERM").then((perm:any)=>{
        console.log("Password OK for user "+user+" | Perms: "+perm)
        callback.end(JSON.stringify(perm));  
        let exp = (Date.now()+1000*60*60);
        console.log("Logging user "+user+" with expiry "+exp+" (in "+(exp-Date.now())+" ms)");
       WS.db.set(token, user+" "+exp);
      })  
    } // password/user not found
    else {
      console.log("Invalid credentials.")
      let response = 0;
      callback.end(JSON.stringify(response));
    };
    
  }) // login
} // account handler