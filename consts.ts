import { database } from "./database";

export const K = {
  rootDir: '/home/runner/BetaUtilitiesV2/',
  frontendDir: '/home/runner/BetaUtilitiesV2/frontend/',
  jsDir:'/home/runner/BetaUtilitiesV2/.build/frontend/',
  port: 3000,
  userRegex: /^[0-9a-zA-Z_\\-]+$/,
  pwdMaxLength: 9e99,
  userMaxLength: 9e99,
  authDB:database.collection("SystemAUTH_V2"),
  msgDB:database.collection("SupportMessaging"),
  uDB:database.collection("BetaUtilities"),
}