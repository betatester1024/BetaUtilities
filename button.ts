import {userRequest} from './userRequest';
import {uDB} from './consts'
export async function clickIt(token:string) {
  let userData = await userRequest(token);
  if (userData.status != "SUCCESS") {
    return userData;
  }
  await uDB.updateOne({fieldName:"BUTTON", user:userData.data.user}, {$inc:{clickedCt:1}});
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