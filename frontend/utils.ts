function globalOnload() {
  document.onkeydown=keydown;
}

function send(params:any, callback:(thing:any)=>any) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "server", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = ()=> {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(JSON.parse(xhr.responseText));
    }
  }
  xhr.send(params);
  failureTimeout = setTimeout(()=>alertDialog(`This is taking longer than expected.`, ()=>{}, true), 1000);
}

let failureTimeout:NodeJS.Timeout|null;
let dialogQ = false;
let cbk: ()=>any = ()=>{};
function alertDialog(str:string, callback:()=>any, refreshButtonQ:boolean) {
  let ele = document.getElementById("overlay") as HTMLDivElement;
  let p = document.getElementById("alerttext") as HTMLParagraphElement;
  if (!ele || !p) {
    console.log("ERROR: Alert dialogs not enabled in this page.")
    return;
  }
  ele.style.top = "0vh";
  dialogQ = true;
  cbk = callback;
  p.innerText = str;
  if (refreshButtonQ) p.innerHTML += `<button class='btn szThird fssml' onclick='location.reload()'>Refresh?
  <div class="anim"></div></button>`
  if (failureTimeout) clearTimeout(failureTimeout);
  failureTimeout = null;
}

function closeAlert() {
  let ele = document.getElementById("overlay") as HTMLDivElement;
  ele.style.top = "500vh";
  dialogQ = false;
  if (cbk) cbk();
}

function keydown() {
  if (dialogQ) {
    console.log("CLOSED DIALOG")
    closeAlert();
  }
}

function toTime(ms:number) {
  let day = Math.floor(ms/1000/60/60/24);
  ms = ms%(1000*60*60*24);
  let hr = Math.floor(ms/1000/60/60);
  ms = ms%(1000*60*60);
  let min = Math.floor(ms/1000/60);
  ms = ms%(1000*60);
  let sec = Math.floor(ms/1000);
  return (day>0?day+"d ":"") + padWithZero(hr)+":"+padWithZero(min)+":"+padWithZero(sec);
}

function padWithZero(n:number) {
  return n<10?"0"+n:n;
}