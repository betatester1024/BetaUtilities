import {database} from "./database";
const argon2 = require('argon2');
const path = require('path')
export const rootDir:string = path.resolve(__dirname+"/../")+"/";
export const frontendDir:string = path.resolve(__dirname+'/../frontend/')+"/";
export const jsDir:string = path.resolve(__dirname+'/../.build/frontend/')+"/"
export const port = 3000
export const userRegex = /^[0-9a-zA-Z_\\-]{1,20}$/
export const roomRegex = "[0-9a-zA-Z_\\-]{1,20}"
// export const pwdMaxLength = 9e99
// export const userMaxLength = 9e99
export const authDB = database.collection("SystemAUTH_V2")
export const msgDB = database.collection("SupportMessaging")
export const uDB = database.collection("BetaUtilities")
export const pasteDB = database.collection("PasteIt");
export const TOKEN_PATH = path.resolve(__dirname+'/../TOKEN.json')
export const CREDENTIALS_PATH =path.resolve( __dirname+'/../CREDENTIALS.json');
export const hashingOptions = {
   type: argon2.argon2d,
   memoryCost: 12288,
   timeCost: 3,
   parallelism: 1,
   hashLength: 50
 }
// account expiries for:    user accounts, admins,   super-admins
export const expiry = [0, 1000*60*60*24, 1000*60*30, 1000*60*5];
