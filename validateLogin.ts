const argon2 = require('argon2');
import {userRegex, authDB, hashingOptions} from './consts';
const crypto = require("crypto");

export async function validateLogin(user:string, pwd:string, persistQ:boolean, token:string) {
  if (!user.match(userRegex)) {
    return {status:"ERROR", data:{error:"Invalid user string!"}, token:token};
  }
  if (pwd.length == 0) {
    return {status:"ERROR", data:{error:"No password provided!"}, token:token}
  }
  let usrInfo = await authDB.findOne({fieldName:"UserData", user:{$eq:user}}) as {pwd:string, permLevel:number};
  if (!usrInfo) {
    return {status:"ERROR", data:{error:"No such user!"}, token:token}; // keep the original token.
  }
  else if (await argon2.verify(usrInfo.pwd, pwd)) {
    let uuid = crypto.randomUUID() // gen new token
    let userData:{permLevel:number} = await authDB.findOne({fieldName:"UserData", user:user});
    await authDB.insertOne({fieldName:"Token", associatedUser:user, token:uuid, expiry: persistQ?9e99:Date.now()+expiry[userData.permLevel]})
    return {status:"SUCCESS", data:{perms: usrInfo.permLevel}, token:uuid};
  } else {
    return {status:"ERROR", data:{error:"Password is invalid!"}, token:token};
  }
}

export async function signup(user:string, pwd:string, token:string) {
  if (!user.match(userRegex)) {
    return {status:"ERROR", data:{error:"Invalid user string!"}, token:token}
  }
  if (pwd.length == 0) {
    return {status:"ERROR", data:{error:"No password provided!"}, token:token}
  }
  let usrInfo = await authDB.findOne({fieldName:"UserData", user:user}) as {pwd:string, permLevel:number};
  if (usrInfo) {
    return {status:"ERROR", data:{error:"User is registered"}, token:token} // keep the original token.
  }
  else {
    let hash = await argon2.hash(pwd, hashingOptions); 
    await authDB.insertOne({fieldName:"UserData", user:user, pwd:hash, permLevel: 1});
    return await validateLogin(user, pwd, false, token);
  }
}

export async function logout(token:string, allaccsQ:boolean=false) {
  if (allaccsQ) {
    let userData:{associatedUser:string} = await authDB.findOne({fieldName:"Token", token:token});
    if (!userData) {
      await authDB.deleteOne({fieldName:"Token", token:token});
      return {status:"ERROR", data:{error:"Cannot find your session. Logged you out."}, token:token};
    }
    await authDB.deleteMany({fieldName:"Token", associatedUser:userData.associatedUser});
  }
  await authDB.deleteOne({fieldName:"Token", token:token});
  return {status:"SUCCESS", data:null, token:""};
}
