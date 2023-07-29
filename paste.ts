import {pasteDB, hashingOptions} from './consts';
const crypto = require('node:crypto').webcrypto;
const argon2 = require('argon2');
import {userRequest} from './userRequest'
const pasteMatch = /^[0-9a-zA-Z_\-]{1,30}$/
export async function paste(content:string, loc:string, pwd:string, token:string) {
  if (!loc.match(pasteMatch)) return {status:"ERROR", data:{error:"Invalid paste-name."}, token:token};
  if (pwd.length == 0) return {status:"ERROR", data:{error:"No password provided."}, token:token}
  let hashed = await argon2.hash(pwd, hashingOptions); 
  let existingDoc = await pasteDB.findOne({fieldName:"PASTE", name:loc});
  if (existingDoc) return {status:"ERROR", data:{error:"Paste already exists! Please select another name."}, token:token}
  let userData = await userRequest(token);
  
  let user = userData.status=="SUCCESS"?userData.data.user:null
  pasteDB.insertOne({fieldName:"PASTE", data:content, pwd:hashed, name:loc, author:user});
  return {status:"SUCCESS", data:null, token:token};
}

function encryptMessage(msg:string, key:string) {
  const enc = new TextEncoder();
  const encoded =  enc.encode(msg);
  // iv will be needed for decryption
  console.log(crypto)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );
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
  
  let hashed = await argon2.hash(pwd, hashingOptions); 
  let existingDoc = await pasteDB.findOne({fieldName:"PASTE", name:loc});
  if (!existingDoc) return {status:"ERROR", data:{error:"Paste does not exist!"}, token:token}
  let userInfo = await userRequest(token);
  if (userInfo.status!= "SUCCESS") return userInfo;
  if (!existingDoc.author) return {status:"ERROR", data:{error:"This paste was either created before 2023-04-27, or was created anonymously. It is not editable."}, token:token};
  else if (userInfo.data.user != existingDoc.author) return {status:"ERROR", data:{error:"You are not the author of the paste and cannot edit it."}, token:token};
  if (pwd.length == 0) 
    pasteDB.updateOne({fieldName:"PASTE", name:loc}, {$set:{
    data:content,}});
  else await pasteDB.updateOne({fieldName:"PASTE", name:loc}, {$set:{
    data:content, 
    pwd:hashed}});
  return {status:"SUCCESS", data:null, token:token};
}