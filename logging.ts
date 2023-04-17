import {uDB} from './consts';
import {userRequest} from './userRequest';
import {connectionSuccess} from './index'

export function systemLog(thing:any) {log(thing.toString())};
export function log(thing:string) {
  // let out:any;
  // if (thing && typeof thing != "number" && typeof thing != "string") out = JSON.stringify(thing);
  // else out = thing;
  
  if (connectionSuccess) uDB.insertOne({fieldName:"SysLogV2", data:thing+"\n"});
}


export async function incrRequests() {
  console.log("Request made");
  if (connectionSuccess) uDB.updateOne({fieldName:"VISITS"}, {$inc:{visitCt:1}}, {upsert:true});
}

export async function visitCt(token:string) {
  if (connectionSuccess) {
    let obj = await uDB.findOne({fieldName:"VISITS"});
    return {status:"SUCCESS", data:{data:obj.visitCt}, token:token};
  }
  else return {status:"ERROR", data:{error:"Service database connection failed"}, token:token}
}

export async function getLogs(token:string) {
  let userData = await userRequest(token);
  if (userData.status != "SUCCESS" || userData.data.perms<2) {
    return {status:"ERROR", data:{error:userData.data.error??"Insufficient permissions"}, token:token};
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
    return {status:"ERROR", data:{error:userData.data.error??"Insufficient permissions"}, token:token};
  } 
  await uDB.deleteMany({fieldName:"SysLogV2"});
  return {status:"SUCCESS", data:null, token:token};
}