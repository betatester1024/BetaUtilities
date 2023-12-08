import {uDB} from './consts';

export async function EE(getQ:boolean, token:string, newStr:string="") {
  let obj = await uDB.findOne({fieldName:"EE"});
  if (getQ) return {status:"SUCCESS", data:{data:obj?obj.data:""}, token:token};
  else {
    await uDB.updateOne({fieldName:"EE"}, {
      $set:{data:newStr}
    }, {upsert:true})
    return {status:"SUCCESS", data:null, token:token}
  }
}
