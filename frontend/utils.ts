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
  failureTimeout = setTimeout(()=>alertDialog(`This is taking longer than expected. 
  <button class='btn szThird fssml' onclick='location.reload()'>Refresh?
  <div class="anim"></div></button`), 1000);
}

let failureTimeout;
let dialogQ = false;
let cbk: ()=>any = ()=>{};
function alertDialog(str:string, callback:()=>any) {
  let ele = document.getElementById("overlay") as HTMLDivElement;
  let p = document.getElementById("alerttext") as HTMLParagraphElement;
  ele.style.top = "0vh";
  dialogQ = true;
  cbk = callback;
  p.innerHTML = str;
  if (failureTimeout) clearTimeout(failureTimeout);
  failureTimeout = null;
}

function closeAlert() {
  let ele = document.getElementById("overlay") as HTMLDivElement;
  ele.style.top = "100vh";
  dialogQ = false;
  if (cbk) cbk();
}

function keydown() {
  if (dialogQ) {
    console.log("CLOSED DIALOG")
    closeAlert();
  }
}