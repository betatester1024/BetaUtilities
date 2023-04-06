import {K} from './consts';
const argon2 = require('argon2');

export async function updateUser(user:string, oldPass:string, newPass:string, newPermLevel:number, token:string) {
  if (!user.match(userRegex)) {
    return {status:"ERROR", data:{error:"Invalid user string!"}, token:token}
  }
  if (newPass.length == 0) {
    return {status:"ERROR", data:{error:"No password provided!"}, token:token}
  }
  let tokenData:{associatedUser:string, expiry:number} = await authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    return {status:"ERROR", data:{error:"Cannot update user information: Your session could not be found!"}, token:""}
  }
  let userData:{permLevel:number, pwd:string} = await authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    return {status:"ERROR", data:{error:"Cannot update user information: Your session has expired!"}, token:""};
  }
  let newUserData = await authDB.findOne({fieldName:"UserData", user:user});
  if (userData.permLevel >=2 && 
      (!newUserData || newUserData.permLevel< userData.permLevel)
     && newPermLevel < userData.permLevel) {
    // administrators can update other accounts but not other admins
    await authDB.updateOne({fieldName:"UserData", user:user}, 
        {$set:{pwd:await argon2.hash(newPass, hashingOptions), permLevel:newPermLevel}}, {upsert:true});
    return {status:"SUCCESS", data:{perms: newPermLevel}, token:token};
  }
  else if (await argon2.verify(userData.pwd, oldPass)) { 
    // unless you have their password, I suppose. but you can't provide that without editing the headers.
    await authDB.updateOne({fieldName:"UserData", user:tokenData.associatedUser}, 
        {$set:{pwd:await argon2.hash(newPass, hashingOptions)}});
    return {status:"SUCCESS", data:{perms:userData.permLevel}, token: token};
  } else {
    return {status: "ERROR", data:{error:"Cannot update user information: Access denied!"}, token:token};
  }
}
