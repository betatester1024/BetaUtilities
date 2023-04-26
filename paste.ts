import {pasteDB, hashingOptions} from './consts';
const argon2 = require('argon2');
const pasteMatch = /^[0-9a-zA-Z_\-]{1,30}$/
export async function paste(content:string, loc:string, pwd:string, token:string) {
  if (!loc.match(pasteMatch)) return {status:"ERROR", data:{error:"Invalid paste-name."}, token:token};
  if (pwd.length == 0) return {status:"ERROR", data:{error:"No password provided."}, token:token}
  let hashed = await argon2.hash(pwd, hashingOptions); 
  let existingDoc = await pasteDB.findOne({fieldName:"PASTE", name:loc});
  if (existingDoc) return {status:"ERROR", data:{error:"Paste already exists! Please select another name."}, token:token}
  pasteDB.insertOne({fieldName:"PASTE", data:content, pwd:hashed, name:loc});
  return {status:"SUCCESS", data:null, token:token};
}

export async function findPaste(loc:string, pwd:string, token:string) {
  // console.log(pwd, loc);
  if (!loc.match(pasteMatch)) return {status:"ERROR", data:{error:"Invalid paste-name."}, token:token};
  let existingDoc = await pasteDB.findOne({fieldName:"PASTE", name:loc});
  if (!existingDoc) return {status:"ERROR", data:{error:"Paste does not exist!"}, token:token}
  if (await argon2.verify(existingDoc.pwd, pwd)) {
    return {status:"SUCCESS", data:existingDoc.data, token:token};
  }
  else return {status:"ERROR", data:{error:"Invalid password!"}, token:token};
}


export async function editPaste(content:string, loc:string, pwd:string, token:string) {
  if (!loc.match(pasteMatch)) return {status:"ERROR", data:{error:"Invalid paste-name."}, token:token};
  if (pwd.length == 0) return {status:"ERROR", data:{error:"No password provided."}, token:token}
  let hashed = await argon2.hash(pwd, hashingOptions); 
  let existingDoc = await pasteDB.findOne({fieldName:"PASTE", name:loc});
  if (!existingDoc) return {status:"ERROR", data:{error:"Paste does not exist!"}, token:token}
  pasteDB.updateOne({fieldName:"PASTE", name:loc}, {$set:{
    data:content, 
    pwd:hashed}});
  return {status:"SUCCESS", data:null, token:token};
}