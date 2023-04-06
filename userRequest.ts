const argon2 = require('argon2');
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
import {authDB} from './consts';

export async function userRequest(callback:(status:string, data:any, token:string)=>any, token:string) {
  let tokenData:{associatedUser:string, expiry:number} = await authDB.findOne({fieldName:"Token", token:token});
  if (!tokenData) {
    callback("ERROR", {error:"Your session could not be found!"}, "")
    return;
  }
  let userData:{permLevel:number, alias:string} = await authDB.findOne({fieldName:"UserData", user:tokenData.associatedUser});
  if (Date.now() > tokenData.expiry) {
    callback("ERROR", {error:"Your session has expired!"}, "")
    return;
  }
  callback("SUCCESS", {user: tokenData.associatedUser, alias:userData.alias?userData.alias:userData.user, perms:userData.permLevel, expiry: tokenData.expiry}, token);
}
