import {database} from "./database";
const argon2 = require('argon2');

export const rootDir:string = '/home/runner/v2/'
export const frontendDir:string = '/home/runner/v2/frontend/'
export const jsDir:string = '/home/runner/v2/.build/frontend/'
export const port = 3000
export const userRegex = /^[0-9a-zA-Z_\\-]+$/
export const roomRegex = "[0-9a-zA-Z_\\-]{1,20}"
export const pwdMaxLength = 9e99
export const userMaxLength = 9e99
export const authDB = database.collection("SystemAUTH_V2")
export const msgDB = database.collection("SupportMessaging")
export const uDB = database.collection("BetaUtilities")
export const hashingOptions = {
   type: argon2.argon2d,
   memoryCost: 12288,
   timeCost: 3,
   parallelism: 1,
   hashLength: 50
 }
export const expiry = [9e99, 1000*60, 1000*60*60*24*30, 1000*60*60];
