function globalOnload() {
  document.onkeydown=keydown;
  let maincontent = document.getElementsByClassName("main_content").item(0) as HTMLDivElement;
  let ftr= document.createElement("footer");
  maincontent.appendChild(ftr);
  let ele = document.createElement("p");
  ele.innerHTML = "BetaOS Systems | 2023";
  ele = document.createElement("overlay");
  ele.innerHTML = ``;
  ftr.appendChild(ele);
}

function send(params:any, callback:(thing:any)=>any) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "server", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = ()=> {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (failureTimeout) clearTimeout(failureTimeout);
      else closeAlert(true);
      failureTimeout = null;
      callback(JSON.parse(xhr.responseText));
    }
  }
  console.log(params);
  xhr.send(params);
  if (failureTimeout) clearTimeout(failureTimeout);
  failureTimeout = setTimeout(()=>alertDialog(`This is taking longer than expected.`, ()=>{}, 1, params), 1000);
}

let failureTimeout:NodeJS.Timeout|null;
let dialogQ = false;
let cbk: ()=>any = ()=>{};
let BLOCKCALLBACK = false;
function alertDialog(str:string, callback:()=>any, button:number=-1, failedReq:string="") {
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
  if (button == 1) {
    p.innerHTML += `<button class='btn szThird fssml' onclick='location.reload()'>Refresh?
    <div class="anim"></div></button>`
    console.log("Failed request: "+failedReq);
    BLOCKCALLBACK=true;
  }
  else if (button == 2) {
    p.innerHTML += `<br>
    <p class="fssml gry nohover"> [Press any key or click 'Continue' below to confirm] </p>
    <button class='btn szFull red fssml cancel' onclick='closeAlert(true)'>
    <span class="material-symbols-outlined">cancel</span>Cancel
    <div class="anim"></div></button>`
    console.log("Confirm speedbump");
  }
  if (failureTimeout) clearTimeout(failureTimeout);
  failureTimeout = null;
}

function closeAlert(overrideCallback:boolean=false) {
  let ele = document.getElementById("overlay") as HTMLDivElement;
  ele.style.top = "500vh";
  dialogQ = false;
  if (cbk && !overrideCallback && !BLOCKCALLBACK) {
    console.log("calling back")
    cbk();
  }
  
}

function keydown(e:Event) {
  if (dialogQ) {
    e.preventDefault();
    console.log("CLOSED DIALOG")
    if (BLOCKCALLBACK) console.log("CALLBACK HAS BEEN BLOCKED")
    else closeAlert();
    BLOCKCALLBACK = false;
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
  if (ms<0) return "00:00:00";
  return (day>0?day+"d ":"") + padWithZero(hr)+":"+padWithZero(min)+":"+padWithZero(sec);
}

function padWithZero(n:number) {
  return n<10?"0"+n:n;
}