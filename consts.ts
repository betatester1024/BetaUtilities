import {database} from "./database";
const argon2 = require('argon2');
<<<<<<< HEAD
export const K = {
  rootDir: '/home/runner/v2/',
  frontendDir: '/home/runner/v2/frontend/',
  jsDir:'/home/runner/v2/.build/frontend/',
  port: 3000,
  userRegex: /^[0-9a-zA-Z_\\-]{1,20}$/,
  roomRegex: "[0-9a-zA-Z_\\-]{1,20}",
  pwdMaxLength: 9e99,
  userMaxLength: 9e99,
  authDB:database.collection("SystemAUTH_V2"),
  msgDB:database.collection("SupportMessaging"),
  uDB:database.collection("BetaUtilities"),
  hashingOptions: {
    type: argon2.argon2d,
    memoryCost: 12288,
    timeCost: 3,
    parallelism: 1,
    hashLength: 50
  },
  // time in ms until accounts expire (indexed according to access-level. 
  // access-level 0 shouldn't exist.)
  expiry: [9e99, 1000*60, 1000*60*60*24*30, 1000*60*60],
}
=======
export const rootDir:string = '/home/runner/BetaUtilitiesV2/'
export const frontendDir:string = '/home/runner/BetaUtilitiesV2/frontend/'
export const jsDir:string = '/home/runner/BetaUtilitiesV2/.build/frontend/'
export const port: = 3000
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
export const expiry = [9e99, 1000*60, 1000*60*60*24*30, 1000*60*60],
>>>>>>> origin/v2
