const { MongoClient } = require("mongodb");
import {authDB, msgDB} from './consts';

// Replace the uri string with your connection string.
const uri = 
  // `mongodb+srv://SystemLogin:${process.env['dbPwd']}@betaos-datacluster00.d8o7x8n.mongodb.net/?retryWrites=true&w=majority`
  "mongodb://SystemLogin:"+process.env['dbPwd']+"@ac-rz8jdrl-shard-00-00.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-01.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-02.d8o7x8n.mongodb.net:27017/?ssl=true&replicaSet=atlas-3yyxq8-shard-0&authSource=admin&retryWrites=true&w=majority";
  // "mongodb+srv://SystemLogin:"+process.env['dbPwd']+"@betaos-datacluster00.d8o7x8n.mongodb.net/?retryWrites=true&w=majority";

import {DBConnectFailure, connectionSuccess} from './index';
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
  let items2:{sender:string, expiry:number}[] = await msgDB.find({fieldName:"MSG"}).toArray();
  for (let i=0; i<items2.length; i++) {
    if (!items2[i].expiry || items2[i].expiry < Date.now()) {
      console.log("Message from "+items2[i].sender + " has expired");
      await msgDB.deleteOne(items2[i]);
    }
  };
  setTimeout(DBMaintenance, 1000);
}
