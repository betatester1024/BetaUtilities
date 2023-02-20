import { WS } from "./wsHandler";


// export function requestHash(user:string, pwd:string, callback:any) {
//   bcrypt.hash(pwd, saltRounds, function(err:any, hash:string) {
    
//     const db2 = require("@replit/database")
//     console.log(err, hash)
//     db2.set("hashed", hash as string).then(()=>{});
    
//     returnedHash(user, hash, callback);
//       // Store hash in your password DB.
//   });
// }
export function validate(user:string, pwd:string, action:string, access:string, callback:any, token:string="") {
  console.log("Validating as "+user+" with password "+pwd+" with action"+action+" - token "+token);
  if (action=="logout") {
    console.log("Logging out "+token)
    WS.db.delete(token);
    callback.end(JSON.stringify(0));
    return;
  }
  // if (action=="server") { // 
    // console.log("Logging token with user "+user+" with expiry"+Date.now()+1000*60*60*24*30);
  // }?
  if (action=="add") {
    console.log(token);
    WS.db.get(token).then((data:string)=>{
      console.log("Data: "+data);
      if (data == null) {
        console.log("No active session");
        callback.end(JSON.stringify("NOACTIVE"));
        return;
      }
      let expiryTime = Number(data.match("[0-9]+$")[0]);
      console.log("This token expiring in: "+(expiryTime-Date.now()) + " ms");
      if (expiryTime<Date.now()) {
        console.log("Token expired.")
        WS.db.delete(token);
        callback.end(JSON.stringify("EXPIRE"));
        return;
      }
      WS.db.get(data.split(" ")[0]+"^PERM").then((perms:string)=> {
        if (perms!="2"){
          console.log("Permissions insufficient.")
          callback.end(JSON.stringify("ACCESS"));
        }
        else {
          console.log("Access granted; Token not expired. Adding "+user+" with permissions"+access);
          WS.db.set(user, pwd);
          WS.db.set(user+"^PERM", access);
          let response = 0;
          callback.end(JSON.stringify(response));
        }
      }); // check permissions of token
    });
   return; 
  }
  WS.db.get(user).then((value:any)=>{
    if (value == pwd) {// pwd validated. 
      console.log("Password OK")
      WS.db.get(user+"^PERM").then((perm:any)=>{
        console.log(perm);
        callback.end(JSON.stringify(perm));  
      })
    } // validate pwd
    else {
      if (action == "login") {
        let response = 0;
        callback.end(JSON.stringify(response));
      }
    };
    
    let exp = (Date.now()+1000*30);
    console.log("Logging token with user "+user+" with expiry"+exp+" Current time:"+Date.now());
    WS.db.set(token, user+" "+exp);
  })
}