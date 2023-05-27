import {database} from "./database";
const argon2 = require('argon2');

export const rootDir:string = '/home/runner/betatester1024/'
export const frontendDir:string = '/home/runner/betatester1024/frontend/'
export const jsDir:string = '/home/runner/betatester1024/.build/frontend/'
export const port = 3000
export const userRegex = /^[0-9a-zA-Z_\\-]{1,20}$/
export const roomRegex = "[0-9a-zA-Z_\\-]{1,20}"
// export const pwdMaxLength = 9e99
// export const userMaxLength = 9e99
export const authDB = database.collection("SystemAUTH_V2")
export const msgDB = database.collection("SupportMessaging")
export const uDB = database.collection("BetaUtilities")
export const pasteDB = database.collection("PasteIt");
export const TOKEN_PATH = '/home/runner/betatester1024/TOKEN.json';
export const CREDENTIALS_PATH = '/home/runner/betatester1024/CREDENTIALS.json';
export const hashingOptions = {
   type: argon2.argon2d,
   memoryCost: 12288,
   timeCost: 3,
   parallelism: 1,
   hashLength: 50
 }
// account expiries for:    user accounts, admins,   super-admins

export const expiry = [0, 1000*60*60*24, 1000*60*1, 1000*60*5];

