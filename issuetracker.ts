import {issueDB} from './consts'
import {userRequest} from './userRequest'
export async function newIssue(title:string, body:string, prio:number, tags:string[], token:string, sessID:string, existingID:number=-1) 
{
  if (body.length == 0) body = "(No description provided)";
  if (title.length == 0 || body.length == 0) return {status:"ERROR", data:{error:"Please provide a title and a description."}, token:token}
  let data = await issueDB.findOne({fieldName:"MetaData"});
  let req = await userRequest(token);
  let auth = "Anonymous user "+sessID.slice(0,7);
  if (prio <=0) return {status:"ERROR", data:{error:"Invalid priority number!"}, token:token};
  if (req.status == "SUCCESS") {
    auth = req.data.user as string;
    if (req.data.perms < 2 && prio > 2) return {status:"ERROR", data:{error:"Invalid priority number!"}, token:token};
  }
  else if (prio > 2) return {status:"ERROR", data:{error:"Invalid priority number!"}, token:token}
  await issueDB.insertOne({fieldName:"Issue", id:existingID>0?existingID:(data?data.issueCt+1:1), tags:tags, prio:prio, title:title, body:body, author:auth});  
  if (data) 
    await issueDB.updateOne({fieldName:"MetaData"}, {
      $inc: {issueCt: 1}
    });
  else await issueDB.insertOne({fieldName:"MetaData", issueCt:1});
  return {status:"SUCCESS", data:{id:data.issueCt+1}, token:token};
}

export async function loadIssues(from:number, ct:number, token:string) 
{
  let out = await issueDB.find({fieldName:"Issue", id:{$gte:from}}).sort({id:1}).limit(ct).toArray();
  let minIssue = await issueDB.find({fieldName:"Issue"}).sort({id: 1}).limit(1).toArray();
  return {status:"SUCCESS", data:{issues:out, minID:(minIssue.length>0?minIssue[0].id:9999)}, token:token};
}

export async function deleteIssue(id:number, token:string) 
{
  let req = await userRequest(token);
  if (req.status != "SUCCESS") return req;
  await issueDB.deleteOne({fieldName:"Issue", id:Number(id)});
  return {status:"SUCCESS", data:null, token:token};
}

export async function completeIssue(id:number, token:string) 
{
  let req = await userRequest(token);
  if (req.status != "SUCCESS") return req;
  await issueDB.updateOne({fieldName:"Issue", id:Number(id)}, {$set:{fieldName:"CompletedIssue"}});
  return {status:"SUCCESS", data:null, token:token};
}

export async function editIssue(id:number, title:string, body:string, prio:number, tags:string[], token:string) {
  let res = await deleteIssue(id, token);
  if (res.status != "SUCCESS") return res;
  res = await newIssue(title, body, prio, tags, token, "ERROR", id);
  return res;
}