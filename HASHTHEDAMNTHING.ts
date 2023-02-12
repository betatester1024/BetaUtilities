const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
const db = require("@replit/database")

// export function requestHash(user:string, pwd:string, callback:any) {
//   bcrypt.hash(pwd, saltRounds, function(err:any, hash:string) {
    
//     const db2 = require("@replit/database")
//     console.log(err, hash)
//     db2.set("hashed", hash as string).then(()=>{});
    
//     returnedHash(user, hash, callback);
//       // Store hash in your password DB.
//   });
// }
export function validate(user:string, pwd:string, callback:any) {
  db.get(user).then((value:any)=>{
    if (value == pwd) // pwd validated. 
      db.get(user+"PERM").then((perm:any)=>{
        // call the permissions updator and send user to the applicable page
        let response = {  
          granted:perm 
        };  
        callback.end(JSON.stringify(response));  
      })
    else {
      let response = {granted:null}
      callback.end(JSON.stringify(response));
    }
  })
}

