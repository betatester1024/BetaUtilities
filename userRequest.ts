const argon2 = require('argon2');
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
import {K} from './consts';

export async function userRequest(callback:(status:string, data:any, token:string)=>any, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await K.authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Your session could not be found!"}, "")
    return;
  }
  let userData:{permLevel:number} = await K.authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", {error:"Your session has expired!"}, "")
    return;
  }
  callback("SUCCESS", {user: tokenData.associatedUser, perms:userData.permLevel, expiry: tokenData.expiry}, token);
}
