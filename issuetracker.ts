import {issueDB} from './consts'
import {userRequest} from './userRequest'
export async function newIssue(title:string, body:string, token:string, sessID:string) 
{
  console.log(sessID);
  let data = await issueDB.findOne({fieldName:"MetaData"});
  let req = await userRequest(token);
  let auth = "Anonymous user "+sessID.slice(0,7);
  if (req.status == "SUCCESS") auth = req.data.user;
  await issueDB.insertOne({fieldName:"Issue", id:data?data.issueCt+1:1, title:title, body:body, author:auth});  
  if (data) 
    await issueDB.updateOne({fieldName:"MetaData"}, {
      $inc: {issueCt: 1}
    });
  else await issueDB.insertOne({fieldName:"MetaData", issueCt:1});
  return {status:"SUCCESS", data:{id:data.issueCt+1}, token:token};
}

export async function loadIssues(from:number, to:number, token:string) 
{
  let out = await issueDB.find({fieldName:"Issue", id:{$gte:from, $lte:to}}).toArray();
  return {status:"SUCCESS", data:out, token:token};
}