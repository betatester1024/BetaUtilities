import {uDB} from './consts';
import {userRequest} from './userRequest';

export function log(thing:string) {
  // let out:any;
  // if (thing && typeof thing != "number" && typeof thing != "string") out = JSON.stringify(thing);
  // else out = thing;
  
  uDB.insertOne({fieldName:"SysLogV2", data:thing+"\n"});
}

export async function getLogs(token:string) {
  let userData = await userRequest(token);
  if (userData.status != "SUCCESS" || userData.data.perms<2) {
    return {status:"ERROR", data:{error:userData.data.error??"Insufficient permissions"}, token:userData.token};
  } 
  let out = "";
  let logs = await uDB.find({fieldName:"SysLogV2"}).toArray();
  for (let i=0; i<logs.length; i++) {
    out += logs[i].data;
  }
  return {status:"SUCCESS", data:out, token:token};
}

export async function purgeLogs(token:string) {
  let userData = await userRequest(token);
  if (userData.status != "SUCCESS" || userData.data.perms<2) {
    return {status:"ERROR", data:{error:userData.data.error??"Insufficient permissions"}, token:userData.token};
  } 
  await uDB.deleteMany({fieldName:"SysLogV2"});
  return {status:"SUCCESS", data:null, token:token};
}