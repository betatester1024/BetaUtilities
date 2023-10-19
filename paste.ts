import {pasteDB, hashingOptions} from './consts';
// const crypto = require('crypto');
const Cryptr = require("cryptr");
const argon2 = require('argon2');
import {userRequest} from './userRequest'
const pasteMatch = /^[0-9a-zA-Z_\-]{1,30}$/
export async function paste(content:string, loc:string, pwd:string, token:string) {
  if (!loc.match(pasteMatch)) return {status:"ERROR", data:{error:"Invalid paste-name."}, token:token};
  if (pwd.length == 0) return {status:"ERROR", data:{error:"No password provided."}, token:token}
  // let hashed = await argon2.hash(pwd, hashingOptions); 
  let existingDoc = await pasteDB.findOne({fieldName:"PASTE", name:loc});
  if (existingDoc) return {status:"ERROR", data:{error:"Paste already exists! Please select another name."}, token:token}
  let userData = await userRequest(token);
  
  let user = userData.status=="SUCCESS"?userData.data.user:null
  pasteDB.insertOne({fieldName:"PASTE", isSecure: true, 
                     encryptedData:await encrypt(content, pwd), 
                     name:loc, author:user});
  // console.log(await encrypt("test", "thepassword"));
  return {status:"SUCCESS", data:null, token:token};
}


const algorithm = 'aes-256-ctr'
const secretKey = process.env['encryptionKey']

async function encrypt(text:string, pwd:string) {
  const cryptr = new Cryptr(pwd);
  return cryptr.encrypt(text);

}

async function decrypt(encr:any, pwd:string) 
{
  const cryptr = new Cryptr(pwd);
  return cryptr.decrypt(encr);
}


export async function findPaste(loc:string, pwd:string, token:string) {
  // console.log(pwd, loc);
  if (!loc.match(pasteMatch)) return {status:"ERROR", data:{error:"Invalid paste-name."}, token:token};
  let existingDoc = await pasteDB.findOne({fieldName:"PASTE", name:loc});
  if (!existingDoc) return {status:"ERROR", data:{error:"Paste does not exist!"}, token:token}
  let userInfo = await userRequest(token);
  // if (!pwd || pwd.length == 0 && userInfo.associatedUser == existingDoc.author) 
    // return {status:"SUCCESS", data:{content:await decrypt(existingDoc.encryptedData
  if (existingDoc.pwd && await argon2.verify(existingDoc.pwd, pwd)) {
    return {status:"SUCCESS", data:{content:existingDoc.data, security:"none"}, token:token};
  }
  else if (existingDoc.encryptedData) {
    let out = "Unknown Decode Error";
    // console.log(existingDoc.encryptedData);
    try {
      out = await decrypt(existingDoc.encryptedData, pwd);
    }
    catch(e){
      // console.log(e);
      return {status:"ERROR", data:{error:"Decode error! \n This is probably because you "+
        "entered an invalid password, or your paste was corrupted."}, token:token}
    }
    return {status:"SUCCESS", data:{content:out, security:"encrypted"}, token:token};
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
  if (!existingDoc.author && userInfo.data.perms < 2) return {status:"ERROR", data:{error:"This paste was either created before 2023-04-27, or was created anonymously. It is not editable."}, token:token};
  else if (userInfo.data.user != existingDoc.author && userInfo.perms < 2) return {status:"ERROR", data:{error:"You are not the author of the paste and cannot edit it."}, token:token};
  if (pwd.length == 0)
    return {status:"ERROR", data:{error:"No password provided!"}, token:token}
    // pasteDB.updateOne({fieldName:"PASTE", name:loc}, {$set:{
    // data:content}});
  await pasteDB.updateOne({fieldName:"PASTE", name:loc}, {
    $set:{
      encryptedData:await encrypt(content, pwd), 
      content:"",
      pwd:null
    }
  }); 
    // pwd:hashed}});
  return {status:"SUCCESS", data:null, token:token};
}