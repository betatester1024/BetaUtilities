const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri =
  "mongodb+srv://SystemLogin:"+process.env['dbPwd']+"@betaos-datacluster00.d8o7x8n.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
export const database = client.db('BetaOS-Database01');
export const DB = database.collection('BetaUtilities');