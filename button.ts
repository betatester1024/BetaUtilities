import {userRequest} from './userRequest';
import {uDB, authDB} from './consts'
export async function clickIt(token:string) {
  let userData = await userRequest(token);
  if (userData.status != "SUCCESS") {
    return userData;
  }
  // console.log(userData.data.lastCl - Date.now() + 10000);
  if (userData.data.lastCl > Date.now() - 10000) return {status:"ERROR", data:{error:"Clicked too much"}, token:token};
  await uDB.updateOne({fieldName:"BUTTON", user:userData.data.user}, {$inc:{clickedCt:1}}, {upsert: true});
  await authDB.updateOne({fieldName:"UserData", user:userData.data.user}, {$set:{lastClicked:Date.now()}}, {upsert: true});
  return {status:"SUCCESS", data:null, token:token};
}

export async function getLeaderboard(token:string) {
  // i forgot the bloody closing brackets
  // console.log("leaderboard requested");
  let data = await uDB.findOne({fieldName:"BUTTON"});
  let allClickingUsers = await uDB.find({fieldName:"BUTTON"}).sort({clickedCt:-1}).toArray();
  // console.log(allClickingUsers);
  return {status:"SUCCESS", data:allClickingUsers, token:token};
}