"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var paste_exports = {};
__export(paste_exports, {
  editPaste: () => editPaste,
  findPaste: () => findPaste,
  paste: () => paste
});
module.exports = __toCommonJS(paste_exports);
var import_consts = require("./consts");
var import_userRequest = require("./userRequest");
const crypto = require("node:crypto").webcrypto;
const argon2 = require("argon2");
const pasteMatch = /^[0-9a-zA-Z_\-]{1,30}$/;
async function paste(content, loc, pwd, token) {
  if (!loc.match(pasteMatch))
    return { status: "ERROR", data: { error: "Invalid paste-name." }, token };
  if (pwd.length == 0)
    return { status: "ERROR", data: { error: "No password provided." }, token };
  let hashed = await argon2.hash(pwd, import_consts.hashingOptions);
  let existingDoc = await import_consts.pasteDB.findOne({ fieldName: "PASTE", name: loc });
  if (existingDoc)
    return { status: "ERROR", data: { error: "Paste already exists! Please select another name." }, token };
  let userData = await (0, import_userRequest.userRequest)(token);
  let user = userData.status == "SUCCESS" ? userData.data.user : null;
  import_consts.pasteDB.insertOne({ fieldName: "PASTE", data: content, pwd: hashed, name: loc, author: user });
  return { status: "SUCCESS", data: null, token };
}
function encryptMessage(msg, key) {
  const enc = new TextEncoder();
  const encoded = enc.encode(msg);
  console.log(crypto);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
}
async function findPaste(loc, pwd, token) {
  if (!loc.match(pasteMatch))
    return { status: "ERROR", data: { error: "Invalid paste-name." }, token };
  let existingDoc = await import_consts.pasteDB.findOne({ fieldName: "PASTE", name: loc });
  if (!existingDoc)
    return { status: "ERROR", data: { error: "Paste does not exist!" }, token };
  if (await argon2.verify(existingDoc.pwd, pwd)) {
    return { status: "SUCCESS", data: existingDoc.data, token };
  } else
    return { status: "ERROR", data: { error: "Invalid password!" }, token };
}
async function editPaste(content, loc, pwd, token) {
  if (!loc.match(pasteMatch))
    return { status: "ERROR", data: { error: "Invalid paste-name." }, token };
  let hashed = await argon2.hash(pwd, import_consts.hashingOptions);
  let existingDoc = await import_consts.pasteDB.findOne({ fieldName: "PASTE", name: loc });
  if (!existingDoc)
    return { status: "ERROR", data: { error: "Paste does not exist!" }, token };
  let userInfo = await (0, import_userRequest.userRequest)(token);
  if (userInfo.status != "SUCCESS")
    return userInfo;
  if (!existingDoc.author)
    return { status: "ERROR", data: { error: "This paste was either created before 2023-04-27, or was created anonymously. It is not editable." }, token };
  else if (userInfo.data.user != existingDoc.author)
    return { status: "ERROR", data: { error: "You are not the author of the paste and cannot edit it." }, token };
  if (pwd.length == 0)
    import_consts.pasteDB.updateOne({ fieldName: "PASTE", name: loc }, { $set: {
      data: content
    } });
  else
    await import_consts.pasteDB.updateOne({ fieldName: "PASTE", name: loc }, { $set: {
      data: content,
      pwd: hashed
    } });
  return { status: "SUCCESS", data: null, token };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  editPaste,
  findPaste,
  paste
});
//# sourceMappingURL=paste.js.map
