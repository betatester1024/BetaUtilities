import {authDB} from './consts';
import {userRequest} from './userRequest';
export async function addTask(token:string) {
  let uInfo = await userRequest(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  }
  else {
    if (uInfo.data.tasks) uInfo.data.tasks.push("");
    await authDB.updateOne({user:uInfo.data.user, fieldName:"UserData"}, {
      $set: {tasks: uInfo.data.tasks??[]}
    }, {upsert: true})
    return {status:"SUCCESS", data:null, token:token};
  }
}