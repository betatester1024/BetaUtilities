export function getUptimeStr(STARTTIME:number) {
  let timeElapsed = Date.now() - STARTTIME;
  let date = new Date(Date.now());
  return (
    `/me has been up since ${date.getFullYear()}-${format(date.getMonth() + 1)}-${format(date.getDate())}(It's been ${formatTime(timeElapsed)})`
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
    days +
    " day(s), " +
    hours +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    (seconds < 10 ? "0" + seconds : seconds)
  );
}

function format(n:number) {
  return n < 10 ? "0" + n : n;
}