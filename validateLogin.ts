const argon2 = require('argon2');
import {authDB, userRegex, hashingOptions} from './consts';
const crypto = require("crypto");

<<<<<<< HEAD
export async function validateLogin(user:string, pwd:string, persistQ:boolean, token:string) {
  if (!user.match(K.userRegex)) {
    return {status:"ERROR", data:{error:"Invalid user string!"}, token:token};
=======
export async function validateLogin(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  if (!user.match(userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
>>>>>>> origin/v2
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
<<<<<<< HEAD
    let userData:{permLevel:number} = await K.authDB.findOne({fieldName:"UserData", user:user});
    await K.authDB.insertOne({fieldName:"Token", associatedUser:user, token:uuid, expiry: persistQ?9e99:Date.now()+K.expiry[userData.permLevel]})
    return {status:"SUCCESS", data:{perms: usrInfo.permLevel}, token:uuid};
=======
    let userData:{permLevel:number} = await authDB.findOne({fieldName:"UserData", user:user});
    await authDB.insertOne({fieldName:"Token", associatedUser:user, token:uuid, expiry: Date.now()+K.expiry[userData.permLevel]})
    callback("SUCCESS", {perms: usrInfo.permLevel}, uuid);
    return;
>>>>>>> origin/v2
  } else {
    return {status:"ERROR", data:{error:"Password is invalid!"}, token:token};
  }
}

<<<<<<< HEAD
export async function signup(user:string, pwd:string, token:string) {
  if (!user.match(K.userRegex)) {
    return {status:"ERROR", data:{error:"Invalid user string!"}, token:token}
=======
export async function signup(user:string, pwd:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  if (!user.match(userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
>>>>>>> origin/v2
  }
  if (pwd.length == 0) {
    return {status:"ERROR", data:{error:"No password provided!"}, token:token}
  }
  let usrInfo = await authDB.findOne({fieldName:"UserData", user:user}) as {pwd:string, permLevel:number};
  if (usrInfo) {
    return {status:"ERROR", data:{error:"User is registered"}, token:token} // keep the original token.
  }
  else {
<<<<<<< HEAD
    let hash = await argon2.hash(pwd, K.hashingOptions); 
    await K.authDB.insertOne({fieldName:"UserData", user:user, pwd:hash, permLevel: 1});
    return await validateLogin(user, pwd, token);
=======
    let hash = await argon2.hash(pwd, hashingOptions); 
    await authDB.insertOne({fieldName:"UserData", user:user, pwd:hash, permLevel: 1});
    validateLogin(user, pwd, callback, token);
    return;
>>>>>>> origin/v2
  }
}

export async function logout(token:string, allaccsQ:boolean=false) {
  if (allaccsQ) {
    let userData:{associatedUser:string} = await authDB.findOne({fieldName:"Token", token:token});
    if (!userData) {
<<<<<<< HEAD
      await K.authDB.deleteOne({fieldName:"Token", token:token});
      return {status:"ERROR", data:{error:"Cannot find your session. Logged you out."}, token:token};
=======
      await authDB.deleteOne({fieldName:"Token", token:token});
      callback("ERROR", {error:"Cannot find your session. Logged you out."}, token)
      return;
>>>>>>> origin/v2
    }
    await authDB.deleteMany({fieldName:"Token", associatedUser:userData.associatedUser});
  }
<<<<<<< HEAD
  await K.authDB.deleteOne({fieldName:"Token", token:token});
  return {status:"SUCCESS", data:null, token:""};
=======
  await authDB.deleteOne({fieldName:"Token", token:token});
  callback("SUCCESS", null, "");
>>>>>>> origin/v2
}
