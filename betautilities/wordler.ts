const fs = require('fs')
export let todayWordID = 0;
let FILEDATA:any;
export let todayLeetCODE:string[] = [];
let charSet = "0123456789abcdefghijklmnopqrstuvwxyz";
export let allWords:string[] = [];
export let validWords:string[] = [];
import {uDB} from '../consts';

fs.readFile('betautilities/wordfile.txt', (err:ErrorEvent, data:any) => {
  if (err) throw err;
  FILEDATA = data;
  refreshCodes()
})

function refreshCodes() {

  validWords = FILEDATA.toString().split("\n");
  let DATE = new Date(Date.now());
  const str = DATE.getHours()+"/"+DATE.toLocaleDateString();
  todayWordID = Math.abs(hashCode(str))%validWords.length;
  
  for (let i=0; i<5; i++) {
    todayLeetCODE[i] = charSet[Math.floor((Math.abs(hashCode(str))%Math.pow(10, 5))/Math.pow(10, i))%charSet.length];
  } // for(i)
}

fs.readFile('betautilities/allwords.txt', (err:ErrorEvent, data:any) => {
    if (err) throw err;
 
  allWords = data.toString().split("\n");
})



function hashCode(str:string) {
  var seed = 0;
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

let STARTTIME = Date.now();
export async function serverUpdate() {
  setTimeout(serverUpdate, 1000);
  if (FILEDATA) refreshCodes()
  let offsetTime = Date.now()-STARTTIME;
  STARTTIME = Date.now();
  await uDB.updateOne({fieldName:"UPTIME"}, {$inc:{uptime:offsetTime}}, {upsert:true});
}