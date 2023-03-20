const argon2 = require('argon2');
import {K} from './consts';
const crypto = require("crypto");

export async function validateLogin(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
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

export async function signup(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
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

export async function logout(callback:(status:string, data:any, token:string)=>any, token:string) {
  await K.authDB.deleteOne({fieldName:"Token", token:token});
  callback("SUCCESS", null, "");
}
