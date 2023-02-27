const fs = require('fs');

export function getUptimeStr(STARTTIME:number=-1) {
  if (STARTTIME < 0) {
    let time = Number(fs.readFileSync('./runtime.txt'));
    return formatTime(time);
  }
  let timeElapsed = Date.now() - STARTTIME;
  let date = new Date(STARTTIME);
  return (
    `/me has been up since ${date.toUTCString()} (It's been ${formatTime(timeElapsed)})`
  );
}

function formatTime(ms:number) {
  // 1- Convert to seconds:
  let seconds = ms / 1000;
  // 2- Extract hours:
  const days = Math.floor(seconds / 3600 / 24);
  seconds = seconds % (3600 * 24);
  const hours = Math.floor(seconds / 3600); // 3,600 seconds in 1 hour
  seconds = seconds % 3600; // seconds remaining after extracting hours
  // 3- Extract minutes:
  const minutes = Math.floor(seconds / 60); // 60 seconds in 1 minute
  // 4- Keep only seconds not extracted to minutes:
  seconds = Math.floor(seconds);
  seconds = seconds % 60;
  return (
    (days == 0 ? "" : days + " day"+(days==1?"":"s")+", ") +
    format(hours) +
    ":" +
    format(minutes) +
    ":" +
    format(seconds)
  );
}

function format(n:number) {
  return n < 10 ? "0" + n : n;
}

export function systemLog(thing:any) {
  // console.log(thing);
  fs.writeFileSync('./systemLog.txt', fs.readFileSync("./systemLog.txt")+thing.toString()+"\n");
}