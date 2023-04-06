const { MongoClient } = require("mongodb");
import {authDB} from './consts';

// Replace the uri string with your connection string.
const uri =
  "mongodb://SystemLogin:"+process.env['dbPwd']+"@ac-rz8jdrl-shard-00-00.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-01.d8o7x8n.mongodb.net:27017,ac-rz8jdrl-shard-00-02.d8o7x8n.mongodb.net:27017/?ssl=true&replicaSet=atlas-3yyxq8-shard-0&authSource=admin&retryWrites=true&w=majority";
  // "mongodb+srv://SystemLogin:"+process.env['dbPwd']+"@betaos-datacluster00.d8o7x8n.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// const client = cli.connect();
export const database = client.db('BetaOS-Database01');
// export const DB = database.collection('BetaUtilities');

export async function DBMaintenance() {
  let items:{expiry:number}[] = await authDB.find({fieldName:"Token"}).toArray();
  for (let i=0; i<items.length; i++) {
    if (!items[i].expiry || items[i].expiry < Date.now()) {
      console.log("Expired");
      await authDB.deleteOne(items[i]);
    }
  };
  setTimeout(DBMaintenance, 1000);
}
