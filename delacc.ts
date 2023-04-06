import {K} from './consts';
const argon2 = require('argon2');

export async function delAcc(user:string, pass:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Cannot update user information: Your session could not be found!"}, "")
    return;
  }
  if (!user.match(K.userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
  }
  
  let usrInfo = await K.authDB.findOne({fieldName:"UserData", user:{$eq:user}}) as {pwd:string, permLevel:number};
  if (!usrInfo) {
    callback("ERROR", {error:"No such user!"}, token);
    return;
  }
  let loginInfo:{permLevel:number}= await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (loginInfo.permLevel>=2) { // admin override
    await K.authDB.deleteOne({fieldName:"Token", token:token})
    await K.authDB.deleteOne({fieldName:"UserData", user:user});
    callback("SUCCESS", null, token);
    return;
  }
  if (pass.length == 0) {
    callback("ERROR", {error:"No password provided!"}, token)
    return;
  }
  else if (await argon2.verify(usrInfo.pwd, pass)) {
    await K.authDB.deleteOne({fieldName:"Token", token:token})
    await K.authDB.deleteOne({fieldName:"UserData", user:user});
    callback("SUCCESS", null, "");
    return;
  } else {
    callback("ERROR", {error:"Cannot delete account. Password is invalid!"}, token);
    return;
  }
}