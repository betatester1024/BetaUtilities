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
      $set: {tasks: uInfo.data.tasks??[""]}
    }, {upsert: true})
    return {status:"SUCCESS", data:null, token:token};
  }
}

export async function getTasks(token:string) {
  let uInfo = await userRequest(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  }
  else {
    return {status:"SUCCESS", data:{tasks:uInfo.data.tasks??[]}, token:token};
  }
}

export async function updateTask(token:string, id:string, updated:string) {
  let uInfo = await userRequest(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  }
  else {
    if (uInfo.data.tasks && uInfo.data.tasks.length > id) uInfo.data.tasks[id] = updated;
    await authDB.updateOne({user:uInfo.data.user, fieldName:"UserData"}, {
      $set: {tasks: uInfo.data.tasks??[]}
    }, {upsert: true})
    return {status:"SUCCESS", data:null, token:token};
  }
}

export async function deleteTask(token:string, id:string, completedQ:boolean=false) {
  let uInfo = await userRequest(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  }
  else {
    if (uInfo.data.tasks && uInfo.data.tasks.length > id) uInfo.data.tasks.splice(id, 1)
    await authDB.updateOne({user:uInfo.data.user, fieldName:"UserData"}, {
      $set: {tasks: uInfo.data.tasks??[]},
      $inc: {tasksCompleted:(completedQ?1:0)}
    }, {upsert: true})
    return {status:"SUCCESS", data:null, token:token};
  }
}