import {K} from './consts';
const argon2 = require('argon2');

export async function updateUser(user:string, oldPass:string, newPass:string, newPermLevel:number, callback:(status:string, data:any, token:string)=>any, token:string) {
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  if (newPass.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Cannot update user information: Your session could not be found!"}, "")
    return;
  }
  let userData:{permLevel:number, pwd:string} = await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", {error:"Cannot update user information: Your session has expired!"}, "")
    return;
  }
  let newUserData = await K.authDB.findOne({fieldName:"UserData", user:user});
  if (userData.permLevel >=2 && (!newUserData || newUserData.permLevel< userData.permLevel)) {
    // administrators can update other accounts but not other admins
    await K.authDB.updateOne({fieldName:"UserData", user:user}, 
        {$set:{pwd:await argon2.hash(newPass, K.hashingOptions), permLevel:newPermLevel}}, {upsert:true});
    callback("SUCCESS", {perms: newPermLevel}, token);
    return;
  }
  else if (await argon2.verify(userData.pwd, oldPass)) { // unless you have their password, I suppose.
    await K.authDB.updateOne({fieldName:"UserData", user:tokenData.associatedUser}, 
        {$set:{pwd:await argon2.hash(newPass, K.hashingOptions)}});
    callback("SUCCESS",{perms:userData.permLevel}, token);
    return;
  } else {
    callback("ERROR", {error:"Cannot update user information: Access denied!"}, token);
    return;
  }
}
