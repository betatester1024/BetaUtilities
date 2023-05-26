// import dialogPolyfill from './nodemodules/dialog-polyfill/dist/dialog-polyfill.esm.js';
let SESSIONTIMEOUT, SESSIONTIMEOUT2 = null;

function ele(name:string) {
  return document.getElementById(name);
}
function globalOnload(cbk:()=>any) {

  var script = document.createElement('script');
  script.onload = function () {
    
  };
  script.src = "./nodemodules/dialog-polyfill/dist/dialog-polyfill.esm.js";
  
  document.head.appendChild(script); //or something of the likes

  document.onkeydown = keydown;
  
  document.body.addEventListener("mouseover", mouseOver);
  send(JSON.stringify({ action: "userRequest" }),
    (res) => {
      document.documentElement.className = res.data.darkQ?"dark":"";
      console.log("Loading complete; updating class")
      // let overlay = document.getElementById("overlayL");
      // if (overlay) {
      //   // overlay.style.left="0vh";
      //   overlay.style.opacity="0";
      // }
      let maincontent = document.getElementsByClassName("main_content").item(0) as HTMLDivElement;
      let ftr = document.createElement("footer");
      maincontent.appendChild(ftr);
      
      let ele = document.createElement("p");
      ele.id="footer";
      if (res.status != "SUCCESS")
        ele.innerHTML = `<a href="/login?redirect=${window.location.pathname}">Login</a> | 
                      <a href='/signup'>Sign-up</a> | 
                      <a href='/status'>Status</a> | 
                      BetaOS Systems V2, 2023`;
      else {
        resetExpiry(res);
        ele.innerHTML = `Logged in as <kbd>${res.data.user}</kbd> |
                      <a href='/logout'>Logout</a> | 
                      <a href='/config'>Account</a> | 
                      <a href='/status'>Status</a> | 
                      <a href='javascript:send(JSON.stringify({action:"toggleTheme"}), (res)=>{if (res.status != "SUCCESS") alertDialog("Error: "+res.data.error, ()=>{});else {alertDialog("Theme updated!", ()=>{location.reload()}); }})'>Theme</a> |
                      BetaOS Systems V2, 2023`;
      }
      ftr.appendChild(ele);
      send(JSON.stringify({ action: "visits" }),
        (res) => {
          
          if (res.status != "SUCCESS") {
            alertDialog("Database connection failure. Please contact BetaOS.", ()=>{});
            ele.innerHTML = `<kbd class="red nohover">Database connection failure.</kbd>`
          }// this means the database died 
          document.getElementById("footer").innerHTML += " | <kbd>"+res.data.data+"</kbd>";
          send(JSON.stringify({action:"cookieRequest"}), (res)=>{
            if (res.data.toString() == "false") {
              console.log("thing");
              document.getElementById("compliance").style.bottom="0px";
              
              // document.getElementById("compliance").style.top="unset";
            }
            if (cbk) cbk();
          }, true);
        }, true);
      
    }, true);

  
  let ele2 = document.getElementById("overlay");
  if (ele2)
  //   ele2.innerHTML = 
    // document.getElementById("internal_alerts").addEventListener("click", ()=>{});
  document.body.innerHTML += `
  <div class="internal" id="internal_alerts" onclick="if (dialogQ && !BLOCKCALLBACK) closeAlert(false, false)" style="opacity: 0; text-align: center !important">
        <p class="fsmed" id="alerttext_v2">Error: AlertDialog configured incorrectly. Please contact BetaOS.</p>
        <div style="text-align: center;"><button class="btn szHalf override" onclick="closeAlert()" style="display: inline-block">
          <span class="alertlbl">Continue</span>
          <span class="material-symbols-outlined">arrow_forward_ios</span>
          <div class="anim"></div>
        </button>
        <button class="btn szHalf red override" id="cancelBtn" style="display: none" onclick="closeAlert(true)">
          <span class="alertlbl">Cancel</span>
          <span class="material-symbols-outlined">cancel</span>
          <div class="anim"></div>
        </button></div>
      </div>`;
  
  else console.log("Alert dialogs disabled on this page");
  
  let ele = document.getElementById("");
  document.body.innerHTML += `
  <div id="compliance">
    <h2 class="blu nohover">BetaOS Services uses cookies to operate.</h2>
    <p>We use only <kbd>strictly necessary cookies</kbd> to verify and persist 
    your login session, and to confirm your acceptance of these cookies. <br>
    By continuing to use this site, you consent to our use of these cookies.</p>
    <button class='blu btn fsmed' onclick="acceptCookies()">
    <span class="material-symbols-outlined">check</span>
    I understand
    <div class="anim"></div>
    </button>
  </div>`;
  
}

function send(params: any, callback: (thing: any) => any, onLoadQ:boolean=false) {
  let overlay = document.getElementById("overlayL");
  console.log(onLoadQ)
  if (overlay && !onLoadQ) {
    console.log("content-blocking loader overlay enabled")
    overlay.style.opacity="1";
    overlay.style.backgroundColor="var(--system-overlay)";
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/server", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (overlay) {
        overlay.style.opacity="0";
        overlay.style.backgroundColor="var(--system-grey2)";
      }
      if (failureTimeout) clearTimeout(failureTimeout);
      else closeAlert(true);
      failureTimeout = null;
      callback(JSON.parse(xhr.responseText));
    }
    else if (xhr.readyState == 4 && xhr.status != 200) {
      alertDialog("Received status code " +xhr.status+" - resend request?", ()=>{send(params, callback, onLoadQ);}, 2);
    }
  }
  console.log(params);
  xhr.send(params);
  if (failureTimeout) clearTimeout(failureTimeout);
  failureTimeout = setTimeout(() => alertDialog(`This is taking longer than expected.`, () => { }, 1, params), 5000);
}

function acceptCookies() {
  send(JSON.stringify({action:"acceptCookies"}), (res)=> {});
  document.getElementById("compliance").style.bottom="-200vh";
}

let failureTimeout: NodeJS.Timeout | null;
// let TIME:NodeJS.Timeout|null;
let dialogQ = false;
let cbk: () => any = () => { };
let BLOCKCALLBACK = false;
function alertDialog(str: string, callback: () => any = ()=>{}, button: number = -1, failedReq: string = "") {
  // if (TIME) clearTimeout(TIME);
  // TIME = null;
  // console.log("Timeout cleared")
  // e.preventDefault();
  let overlay = document.getElementById("overlayL");
  if (overlay) {
    overlay.style.opacity="0";
  }
  let ele = document.getElementById("overlay") as HTMLDivElement;
  ele.innerHTML="";
  let p = document.getElementById("alerttext_v2") as HTMLParagraphElement;
  if (!ele || !p) {
    console.log("ERROR: Alert dialogs not enabled in this page.")
    callback();
    return;
  }
  
  ele.style.opacity="1";
  ele = document.getElementById("internal_alerts");
  ele.style.opacity="1";
  ele.style.top = "-100vh";
  ele.style.pointerEvents="auto";
  dialogQ = true;
  cbk = callback;
  p.innerText = str;
  p.innerHTML += "<p style='margin: 10px auto' class='gry nohover'>(Press any key to dismiss)</p>"
  document.getElementById("cancelBtn").style.display = "none";
  if (button == 1) {
    p.innerHTML += `<button class='btn szThird fssml' id="refresh" onclick='location.reload()'>
    <span class="material-symbols-outlined">history</span> Refresh?
    <div class="anim"></div></button>`
    console.log("Failed request: " + failedReq);
    BLOCKCALLBACK = true;
  }
  else if (button == 2) {
    document.getElementById("cancelBtn").style.display = "inline-block";
    console.log("Confirm speedbump");
    BLOCKCALLBACK = true;
  }
  if (failureTimeout) clearTimeout(failureTimeout);
  failureTimeout = null;
}

function closeAlert(overrideCallback: boolean = false, overrideOverlay:boolean = false) {
  let ele = document.getElementById("overlay") as HTMLDivElement;
  if (!ele) {
    console.log("Alert dialogs not enabled in this page");
    return;
  }
  if (!overrideOverlay && !DIALOGOPEN) {
    ele.style.opacity=0;
    ele.style.pointerEvents="none";
  }
  ele = document.getElementById("internal_alerts");
  ele.style.top = "-50vh";
  ele.style.opacity=0;
  ele.style.pointerEvents="none";
  dialogQ = false;
  if (cbk && !overrideCallback) {
    console.log("calling back")
    cbk();
  }
  BLOCKCALLBACK = false;
}

function keydown(e: Event) {
  if (dialogQ) {
    e.preventDefault();
    if (BLOCKCALLBACK) closeAlert(true);
    else {
      console.log("KEYDOWNCLOSEDIALOG")
      closeAlert();
    }
  }
}

function toTime(ms: number) {
  let day = Math.floor(ms / 1000 / 60 / 60 / 24);
  ms = ms % (1000 * 60 * 60 * 24);
  let hr = Math.floor(ms / 1000 / 60 / 60);
  ms = ms % (1000 * 60 * 60);
  let min = Math.floor(ms / 1000 / 60);
  ms = ms % (1000 * 60);
  let sec = Math.floor(ms / 1000);
  if (ms < 0) return "00:00:00";
  return (day > 0 ? day + "d " : "") + padWithZero(hr) + ":" + padWithZero(min) + ":" + padWithZero(sec);
}

function padWithZero(n: number) {
  return n < 10 ? "0" + n : n;
}

let overlay:HTMLDivElement;
addEventListener("DOMContentLoaded", function() {
  overlay = document.createElement("div");
  overlay.className = "overlayLoader"
  overlay.id = "overlayL";
  // overlay.style.left="0vh";
  overlay.style.backgroundColor="var(--system-overlay)";
  overlay.style.opacity="1";
  overlay.innerHTML = `<span class="material-symbols-outlined loader">sync</span>
  <p class="loadp fslg grn nohover">Loading.</p>`
  // document.appendChild(document.createElement("body"));
  document.body.appendChild(overlay);
  // console.log(document.body.innerHTML)
  
  // screw with the meta tags
  let metatags = document.createElement("meta");
  metatags.content = "width=device-width; initial-scale=1.0; min-scale=1.0";
  metatags.name = "viewport";
  document.head.appendChild(metatags);
});

let DIALOGOPEN = false;
function closeDialog(thing:()=>any, name:string="dialog") {
  let div = document.getElementById(name);
  div.style.top = "50%";
  div.style.opacity="0";
  div.style.pointerEvents="none";
  DIALOGOPEN=false;
  document.getElementById("overlay").style.opacity = "0";
  thing();
  
  // document.getElementById("startBtn").focus();
}

function openDialog(name:string="dialog") {
  let div = document.getElementById(name);
  div.style.top = "0px";
  div.style.opacity="1";
  div.style.pointerEvents="auto";
  // ???
  DIALOGOPEN=true;
  document.getElementById("overlay").style.opacity = "1";
  // document.getElementById("startBtn").focus();
  // document.getElementById("startBtn").focus();
}

function mouseOver(e:MouseEvent) {
  let ele = e.target;
  let text = ele.innerHTML.replaceAll(/<.*((>.*<\/.*>)|(\/>))/gmiu, "").replaceAll("\n", "").trim();
  // fuck off this is good enough, it's not even used as raw html
  if (ele.className.match(/(\W|^)btn(\W|$)/)) {
    let tooltip = ele.children.namedItem("TOOLTIP");
    if (!tooltip) {
      tooltip = document.createElement("span");
      tooltip.innerText = text;
      tooltip.id="TOOLTIP";
      tooltip.className="TOOLTIP override"
      ele.appendChild(tooltip);
      ele.style.animation = 'none';  
      ele.offsetHeight; /* trigger reflow */   
      ele.style.animation = null; 
    }
  }
}

function resetExpiry(res:any) {
  if (res.data.expiry < Date.now()) {
    return;
    //alertDialog("Error: Your session has expired!", ()=>{location.href = "/login?redirect="+window.location.pathname});
  }
  SESSIONTIMEOUT = setTimeout(()=>{
    alertDialog("Your session has expired", ()=>{
      location.reload();
    })
  }, res.data.expiry - Date.now());
  SESSIONTIMEOUT2 = setTimeout(()=>{
    // document.title = ""+document.title;
    alertDialog("Your session is expiring in one minute, extend session? ", ()=>{
      send(JSON.stringify({action:"extendSession"}), (res:{data:{expiry:number}})=>{
        alertDialog("Session extended, expires in "+toTime(res.data.expiry - Date.now()), ()=>{});
        clearTimeout(SESSIONTIMEOUT);
        clearTimeout(SESSIONTIMEOUT2);
        resetExpiry(res);
      });
    }, 2)
  }, Math.max(res.data.expiry - Date.now() - 60000, 1000))
}