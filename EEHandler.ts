import {uDB} from './consts';

export async function EE(getQ:boolean, callback:(status:string, data:any, token:string)=>any, token:string, newStr:string) {
  let obj = await uDB.findOne({fieldName:"EE"});
  if (getQ) callback("SUCCESS", {data:obj?obj.data:""}, token);
  else {
    await uDB.updateOne({fieldName:"EE"}, {
      $set:{data:newStr}
    }, {upsert:true})
    callback("SUCCESS", null, token);
  }
}
