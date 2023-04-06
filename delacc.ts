import {userRegex, authDB} from './consts';
const argon2 = require('argon2');

<<<<<<< HEAD
export async function deleteAccount(user:string, pass:string, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
=======
export async function delAcc(user:string, pass:string, callback:(status:string, data:any, token:string)=>any, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await authDB.findOne({fieldName:"Token", token:token});
>>>>>>> origin/v2
  if (!tokenData) {
    return {status:"ERROR", data:{error:"Cannot update user information: Your session could not be found!"}, token:""}
  }
<<<<<<< HEAD
  if (!user.match(K.userRegex)) {
    return {status:"ERROR", data:{error:"Invalid user string!"}, token:token}
=======
  if (!user.match(userRegex)) {
    callback("ERROR", {error:"Invalid user string!"}, token)
    return;
>>>>>>> origin/v2
  }
  
  let usrInfo = await authDB.findOne({fieldName:"UserData", user:{$eq:user}}) as {pwd:string, permLevel:number};
  if (!usrInfo) {
    return {status:"ERROR", data:{error:"No such user!"}, token:token};
  }
<<<<<<< HEAD
  let loginInfo:{permLevel:number}= await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (loginInfo.permLevel>usrInfo.permLevel) { // admin override
    // delete all tokens from the deleted user
    await K.authDB.deleteMany({fieldName:"Token", associatedUser:user})
    await K.authDB.deleteOne({fieldName:"UserData", user:user});
    return {status:"SUCCESS", data:null, token:token};
=======
  let loginInfo:{permLevel:number}= await authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (loginInfo.permLevel>=2) { // admin override
    await authDB.deleteOne({fieldName:"Token", token:token})
    await authDB.deleteOne({fieldName:"UserData", user:user});
    callback("SUCCESS", null, token);
    return;
>>>>>>> origin/v2
  }
  else return {status:"ERROR", data:{error:"Cannot delete account -- insufficient permissions!"}, token:token}
  if (pass.length == 0) {
    return {status:"ERROR", data:{error:"No password provided!"}, token:token}
  }
  else if (await argon2.verify(usrInfo.pwd, pass)) {
<<<<<<< HEAD
    await K.authDB.deleteOne({fieldName:"Token", token:token})
    await K.authDB.deleteOne({fieldName:"UserData", user:user});
    return {status:"SUCCESS", data:null, token:""};
=======
    await authDB.deleteOne({fieldName:"Token", token:token})
    await authDB.deleteOne({fieldName:"UserData", user:user});
    callback("SUCCESS", null, "");
    return;
>>>>>>> origin/v2
  } else {
    return {status:"ERROR", data:{error:"Cannot delete account. Password is invalid!"}, token:token};
  }
}
