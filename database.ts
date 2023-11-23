const { MongoClient } = require("mongodb");
import {authDB, msgDB, uDB} from './consts';
import {WS} from './betautilities/wsHandler';

// Replace the uri string with your connection string.
const uri = 
  `mongodb+srv://SystemLogin:${process.env['dbPwd']}@betaos-datacluster00.d8o7x8n.mongodb.net/?retryWrites=true&w=majority`
  // "mongodb://SystemLogin:"+process.env['dbPwd']+"@ac-rz8jdrl-shard-00-00.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-01.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-02.d8o7x8n.mongodb.net:27017/?ssl=true&replicaSet=atlas-3yyxq8-shard-0&authSource=admin&retryWrites=true&w=majority";
  // "mongodb+srv://SystemLogin:"+process.env['dbPwd']+"@betaos-datacluster00.d8o7x8n.mongodb.net/?retryWrites=true&w=majority";
// console.log("YOUR URI IS:", uri);
import {DBConnectFailure} from './index';
export const client = new MongoClient(uri)//, { useNewUrlParser: true, useUnifiedTopology: true });
// const client = cli.connect();
export async function connectDB() {
  try {
    await client.connect();  
    clearTimeout(DBConnectFailure)
    return null;
  }
  catch(e:any) {
    console.log(e);
    return e;
    
  }
}
// export let minID = -1;
export const database = client.db('BetaOS-Database01');
// export const DB = database.collection('BetaUtilities');

export async function DBMaintenance() {
  let items:{associatedUser:string, expiry:number}[] = await authDB.find({fieldName:"Token"}).toArray();
  for (let i=0; i<items.length; i++) {
    if (!items[i].expiry || items[i].expiry < Date.now()) {
      console.log("Token from "+items[i].associatedUser + " has expired");
      await authDB.deleteOne(items[i]);
    }
  }
  let items2:{sender:string, expiry:number, msgID:number}[] = await msgDB.find({fieldName:"MSG"}).toArray();
  for (let i=0; i<items2.length; i++) {
    if (!items2[i].expiry || items2[i].expiry < Date.now()) {
      console.log("Message from "+items2[i].sender + " in room "+items2[i].room+" has expired");
      await msgDB.deleteOne(items2[i]);
      // thread parent always expires first hence the minThreadId must also be set
      await msgDB.updateOne({fieldName:"RoomInfo", room:items2[i].room}, 
        {
          $set:{
            minCt:items2[i].msgID, 
            minThreadID:items2[i].threadID
          }
        });      
      // console.log("New msgMin in room",items2[i].room, ":"+items2[i].msgID);
    }
  };
  uDB.find({fieldName:"TIMER"}).toArray().then(
  (objs:{expiry:number, notifyingUser:string, msg:string}[])=>{
    for (let i=0; i<objs.length; i++) {
      if (Date.now()>objs[i].expiry || objs[i].expiry == null) {
        uDB.deleteOne({fieldName:"TIMER",expiry:objs[i].expiry})
        console.log("NOTIFYING");
        WS.notifRoom.socket.send(
          WS.toSendInfo("!tell @"+objs[i].notifyingUser+" You are reminded of: "+
                        objs[i].msg.replaceAll(/\\/gm, "\\\\").replaceAll(/"/gm, "\\\"")+
                       ". This reminder sent by "+(objs[i].author??"yourself, probably.")));
      }
    }
  });
  setTimeout(DBMaintenance, 1000);
}
