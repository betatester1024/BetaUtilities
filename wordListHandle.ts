const fs = require('fs')
export let todayWordID = 0;
let FILEDATA:any;
export let todayLeetCODE:string[] = [];
let charSet = "0123456789abcdefghijklmnopqrstuvwxyz";
export let allWords:string[] = [];
export let validWords:string[] = [];

fs.readFile('wordfile.txt', (err:ErrorEvent, data:any) => {
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

fs.readFile('allwords.txt', (err:ErrorEvent, data:any) => {
    if (err) throw err;
 
  allWords = data.toString().split("\n");
})



function hashCode(s:string) {
  var hash = 0,
    i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

let STARTTIME = Date.now();
export function loopy() {
  setTimeout(loopy, 100);
  if (FILEDATA) refreshCodes()
  let offsetTime = Date.now()-STARTTIME;
  STARTTIME = Date.now();
  fs.writeFileSync('./runtime.txt', (Number(fs.readFileSync('./runtime.txt')) + offsetTime).toString());
}