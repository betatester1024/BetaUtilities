import {authDB, userRegex} from './consts';
import {userRequest} from './userRequest';
const argon2 = require('argon2');

export async function deleteAccount(user:string, pass:string, token:string) {
  // let tokenData:{associatedUser:string, expiry:number} = await authDB.findOne({fieldName:"Token", token:token});
  // if (!tokenData) {
  //   return {status:"ERROR", data:{error:"Cannot update user information: Your session could not be found!"}, token:""}
  // }
  // if (!user.match(userRegex)) {
  //   return {status:"ERROR", data:{error:"Invalid user string!"}, token:token}
  // }
  let userResp = await userRequest(token);
  if (userResp.status != "SUCCESS") return userResp;
  
  let usrInfo = await authDB.findOne({fieldName:"UserData", user:{$eq:user}}) as {pwd:string, permLevel:number};
  if (!usrInfo) {
    return {status:"ERROR", data:{error:"No such user!"}, token:token};
  }
  // let delUserInfo:{permLevel:number}= await authDB.findOne({fieldName:"UserData", user:user});
  // console.log(userResp.data, usrInfo.permLevel)
  if (userResp.data.perms>usrInfo.permLevel) { // admin override
    // delete all tokens from the deleted user
    await authDB.deleteMany({fieldName:"Token", associatedUser:user})
    await authDB.deleteOne({fieldName:"UserData", user:user});
    return {status:"SUCCESS", data:null, token:token};
  }
  if ((pass||"").length == 0) {
    return {status:"ERROR", data:{error:"No password provided!"}, token:token}
  }
  else if (await argon2.verify(usrInfo.pwd, pass)) {
    await authDB.deleteOne({fieldName:"Token", token:{$eq:token}})
    await authDB.deleteOne({fieldName:"UserData", user:user});
    return {status:"SUCCESS", data:null, token:""};
  } else {
    return {status:"ERROR", data:{error:"Cannot delete account-- Access denied"}, token:token};
  }
}