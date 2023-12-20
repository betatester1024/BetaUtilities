import {authDB, userRegex, hashingOptions} from './consts';
const argon2 = require('argon2');
import {userRequest} from './userRequest'

export async function updateUser(user:string, oldPass:string, newPass:string, newPermLevel:number, token:string) {
  let NOUPDATE = false;
  if (!user.match(userRegex)) {
    return {status:"ERROR", data:{error:"Invalid user string!"}, token:token}
  }
  if (newPass.length == 0) {
    NOUPDATE = true;
    // return {status:"ERROR", data:{error:"No password provided!"}, token:token}
  }
  let userReq = await userRequest(token);
  if (userReq.status != "SUCCESS") return userReq;
  let userData:{permLevel:number, pwd:string} = await authDB.findOne({fieldName:"UserData", user:userReq.data.user});
  let newUserData = await authDB.findOne({fieldName:"UserData", user:user});
  if (userData.permLevel >=2 &&  // is admin OR creating new account OR updating lower-level account
      (!newUserData || newUserData.permLevel< userData.permLevel)
     && newPermLevel < userData.permLevel) {
    // administrators can update other accounts but not other admins
    if (!newUserData && NOUPDATE) // creating new account, no password given! 
      return {status:"ERROR", data:{error:"New accounts must have a password."}, token:token};
    await authDB.updateOne({fieldName:"UserData", user:user}, 
        {$set:{permLevel:newPermLevel}}, {upsert:true});
    if (!NOUPDATE) {
      await authDB.updateOne({fieldName:"UserData", user:user}, 
        {$set:{pwd: await argon2.hash(newPass, hashingOptions)}}, {upsert:true});
    }
    return {status:"SUCCESS", data:{perms: newPermLevel}, token:token};
  }
  else if (await argon2.verify(userData.pwd, oldPass)) { 
    // unless you have their password, I suppose. but you can't provide that without editing the headers.
    await authDB.updateOne({fieldName:"UserData", user:user}, 
        {$set:{pwd:await argon2.hash(newPass, hashingOptions)}});
    return {status:"SUCCESS", data:{perms:userData.permLevel}, token: token};
  } else {
    return {status: "ERROR", data:{error:"Cannot update user information: Access denied!"}, token:token};
  }
}

export async function realias(newalias:string, token:string) {
  // let tokenData:{associatedUser:string, expiry:number} = await authDB.findOne({fieldName:"Token", token:token});
  // if (!tokenData) {
  //   return {status:"ERROR", data:{error:"Cannot update user information: Your session could not be found!"}, token:""}
  // }
  // if (Date.now() > tokenData.expiry) {
  //   return {status:"ERROR", data:{error:"Cannot update user information: Your session has expired!"}, token:""};
  // }
  let req = await userRequest(token);
  if (req.status != "SUCCESS") return req;
  if (newalias.length>30) return {status:"ERROR", data:{
    error:"Alias too long", 
    type:2, 
    alias:req.data.alias??req.data.user
    }, token:token};
  await authDB.updateOne({fieldName:"UserData", user:req.data.user}, {
    $set:{alias:newalias}
  });
  
  return {status:"SUCCESS", data:null, token:token};
}

export async function toggleTheme(token) {
  let uInfo = await userRequest(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  }
  else {
    await authDB.updateOne({user:uInfo.data.user, fieldName:"UserData"}, {
      $set: {darkTheme: !uInfo.data.darkQ}
    }, {upsert: true})
    return {status:"SUCCESS", data:null, token:token};
  }
}