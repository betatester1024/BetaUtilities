import {K} from './consts';

export async function EE(getQ:boolean, callback:(status:string, data:any, token:string)=>any, token:string, newStr:string) {
  let obj = await K.uDB.findOne({fieldName:"EE"});
  if (getQ) callback("SUCCESS", {data:obj?obj.data:""}, token);
  else {
    await K.uDB.updateOne({fieldName:"EE"}, {
      $set:{data:newStr}
    }, {upsert:true})
    callback("SUCCESS", null, token);
  }
}