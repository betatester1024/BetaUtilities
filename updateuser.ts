
var bcrypt = require("bcrypt");
import { database } from "./database";
const DB = database.collection('SystemAUTH');
export function initUsers() {
  updateUser('betatester1024', process.env['betatester1024'] as string, 3);
  updateUser("user", "pass", 1)
  // DB.updateOne("betatester1024", bcrypt.hashSync(process.env['betatester1024'] as string, 8));
  // WS.db.set("betatester1024^PERM", "3");
  // WS.db.set("user", bcrypt.hashSync("pass", 8));
  // WS.db.set("user^PERM", "1");
}

export function updateUser(username: string, pwd: string, access: number=-1) {
  DB.updateOne({fieldName:"UserData", user: username}, 
  {
    $set: {
      passHash: bcrypt.hashSync(pwd, 8),
    },
    $currentDate: { lastModified: true }
  }, {upsert: true});
  if (access >= 0) 
    DB.updateOne({fieldName:"UserData", user: username}, 
    {
      $set: {
        permLevel: access
      },
      $currentDate: { lastModified: true }
    }, {upsert: true});
  
}