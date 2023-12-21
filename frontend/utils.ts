// import dialogPolyfill from './nodemodules/dialog-polyfill/dist/dialog-polyfill.esm.js';
let SESSIONTIMEOUT, SESSIONTIMEOUT2 = null;

function byId(name:string) {
  let ele = document.getElementById(name);
  // if (ele == null) throw "Element with id "+name+" is null";
  return ele;
}
function byClass(name:string, ct:number=0) {
  return document.getElementsByClassName(name).item(ct);
}
const docURL = new URL(document.URL);
let HASNETWORK = false;
let branch = "STABLE";
let userData = null;
let onloadCallback:()=>any = null;
async function globalOnload(cbk:()=>any, networkLess:btoolean=false, link:string="/server") {
  onloadCallback = cbk;
  bSelInitialise();
  if (!networkLess) {
    var script = document.createElement('script');
    script.src = "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js";
    document.head.appendChild(script);
    script.onload=()=>{
      WebFont.load({
        google: {
          families: ['Noto Sans Mono', 'Noto Sans Display', 'Noto Color Emoji']
        }
      });
      console.log("Font loaded!")
    }
    script = document.createElement('script');
    script.src = "/nodemodules/dialog-polyfill/dist/dialog-polyfill.js";
    document.head.appendChild(script);
  }
  // else byId("overlayL").remove();
  HASNETWORK = !networkLess;
  // load NotoSansMono
  // const NSM = new FontFace('Noto Sans Mono', 'url(https://fonts.googleapis.com/css2?family=Noto+Sans+Mono&display=swap)');
  // await NSM.load();
  // document.fonts.add(NSM);
  
  
  document.onkeydown = keydown;
  document.onpointerup=pointerUp;
  document.onpointermove = pointerMove;
  document.body.addEventListener("mouseover", mouseOver);

  // byId("overlay").onclick=(e:Event)=>{
  //   if (ALERTOPEN) {
  //     console.log("ClickOutside (Reject)")
  //     closeAlert(-1);
  //   }
  // };
  if (!byId("overlay")) 
  {
    let ovr = document.createElement("div");
    ovr.id="overlay";
    document.body.appendChild(ovr);
  }
  if (!networkLess) {
    send(JSON.stringify({action:"startupData"}), (res)=>{
      if (res.data.branch) branch = res.data.branch;
      let startupData = res.data;
    
      send(JSON.stringify({ action: "userRequest" }),
        (res) => {
          userData = res.data;
          if (branch == "unstable" && link == "/server") {
            let mainContent = byClass("main_content");
            mainContent.style.width = "calc(100% - 30px)";
            mainContent.style.margin = "0px";
            let box = document.createElement("p");
            box.className = "sidebar-unstable";
            box.innerHTML = `<span class="material-symbols-outlined">warning</span>\
            Unstable version. Features may be unfinished or broken. 
            <a class="grn" href="${startupData.domain}">Switch to stable branch</a>`;
            document.body.appendChild(box);
          }
          // document.documentElement.className = res.data.darkQ?"dark":"";
          // console.log("Dark mode toggle:",res.data.darkQ);
          // let overlay = document.getElementById("overlayL");
          // if (overlay) {
          //   // overlay.style.left="0vh";
          //   overlay.style.opacity="0";
          // }
          let maincontent = document.getElementsByClassName("main_content").item(0) as HTMLDivElement;
          let ftr = byId("ftrOverride")??document.createElement("footer");
          if (!byId("ftrOverride")) maincontent.appendChild(ftr);
          
          let ele = document.createElement("p");
          ele.id="footer";
          let urlEle = new URL(location.href);
          let redirector = urlEle.pathname + "?"+urlEle.searchParams.toString();
          if (link !="/server" && res.status != "SUCCESS") 
            ele.innerHTML = `<a href="${startupData.domain}">BetaOS Services site</a> | 
                          <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                            <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                            <div class="anim"></div>
                          </form> |
            BetaOS Systems V3, 2023`
          else if (res.status != "SUCCESS") {
            ele.innerHTML = `<a href="/login?redirect=${encodeURIComponent(redirector)}" onclick="login_v2(event)">Login</a> | 
                          <a href='/signup?redirect=${encodeURIComponent(redirector)}' onclick="login_v2(event, true)">Sign-up</a> | 
                          <a href='/status'>Status</a> | 
                          <a href='${branch=="unstable"?startupData.domain:startupData.unstableDomain}'>
                          Switch to ${branch=="unstable"?"stable":"unstable"} branch</a> | 
                          <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                            <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                            <div class="anim"></div>
                          </form> |
                          BetaOS Systems V3, 2023`;
          }
          else if (res.status == "SUCCESS" && link == "/server") {
            resetExpiry(res);
            ele.innerHTML = `Logged in as <kbd>${res.data.user}</kbd> |
                          <a href='/logout' onclick='logout_v2(event)'>Logout</a> | 
                          <a href='/config'>Account</a> | 
                          <a href='/status'>Status</a> | 
                          <a href='${branch=="unstable"?startupData.domain:startupData.unstableDomain}'>
                          Switch to ${branch=="unstable"?"stable":"unstable"} branch</a> | 
                          <a onclick='event.preventDefault();
                          send(JSON.stringify({action:"toggleTheme"}), (res)=>{
                            if (res.status != "SUCCESS") 
                            ephemeralDialog("Error: "+res.data.error);
                            else {
                              ephemeralDialog("Theme updated!");
                              location.reload();
                            }
                          })' href="javascript:void;">Theme</a> |
                          <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                            <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                            <div class="anim"></div>
                          </form> |
                          BetaOS Systems V3, 2023`;
          }
          else 
          {
            ele.innerHTML = `Logged in as <kbd>${res.data.user}</kbd> |
                          <a href='${startupData.domain}/logout'>Logout</a> | 
                          <a href="${startupData.domain}">BetaOS Services site</a> | 
                          <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                            <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                            <div class="anim"></div>
                          </form> |
                          BetaOS Systems V3, 2023`;
          }
          ftr.appendChild(ele);
          let ephDiv = byId("ephemerals")??document.createElement("div");
          if (!ephDiv.id) {
            ephDiv.id = "ephemerals";
            document.body.appendChild(ephDiv);
          }
          send(JSON.stringify({ action: "visits" }),
            (res) => {
              
              if (res.status != "SUCCESS") {
                alertDialog("Database connection failure. Please contact BetaOS. Error: "+res.data.error, ()=>{});
                ele.innerHTML = `<kbd class="red nohover">Database connection failure.</kbd>`
              }// this means the database died 
              else document.getElementById("footer").innerHTML += " | <kbd>Total requests made: "+res.data.data+"</kbd>";
              send(JSON.stringify({action:"cookieRequest"}), (res)=>{
                if (res.data.toString() == "false") {
                  // console.log("thing");
    
                  
                  let cpl = document.getElementById("compliance");
                  cpl.style.opacity="1";
                  cpl.style.height="auto";
                  cpl.style.pointerEvents="auto";
                  // document.getElementById("compliance").style.top="unset";
                }
                else {
                  let cpl = document.getElementById("compliance");
                  cpl.style.opacity="0";
                  cpl.style.pointerEvents="none";
                }
                if (cbk) cbk();
              }, true, link);
            }, true, link);
          
        }, true, link); // userRequest
    },true, link); // startupData
  }
  
  let ele2 = document.getElementById("overlay");
  if (ele2)
    ele2.innerHTML = `<div class="internal" style="opacity: 0; text-align: center !important"> </div>`
  document.body.innerHTML += `
  <div id="compliance" style="display:none">
    <h2 class="blu nohover fssml"><span class="material-symbols-outlined">cookie </span> BetaOS Services uses cookies to operate.</h2>
    <p style="font-size: 10px">We use only <kbd>strictly necessary cookies</kbd> to verify and persist 
    your login session, and to confirm your acceptance of these cookies. <br>
    By continuing to use this site, you consent to our use of these cookies.</p>
    <button class='blu btn fssml' onclick="acceptCookies('${link}')">
    <span class="material-symbols-outlined" style="font-size: 20pt !important">check</span>
    I understand
    <div class="anim"></div>
    </button>
  </div>`;
  if (networkLess) {
    let cpl = document.getElementById("compliance");
    cpl.style.opacity="1"; 
    cpl.style.height="auto";
  }
              // cpl.style.pointerEvents="none";
}
let DRAGGING = null;
let origLeft = -1;
let origTop = -1;
let origX = -1;
let lastPtrUp = -1;
let origY = -1;
function pointerUp(ev:PointerEvent) 
{
  DRAGGING = null;
  origLeft = -1;
  origTop = -1;
  // if (ev.target.className == "close red") closeNBD(ev.target.parentElement.parentElement, false)
  
  // if (ev.target.nodeName == "SPAN" && ev.target.parentElement &&
      // ev.target.closest(".ALERT_NONBLOCK") != null)  
    // closeNBD(ev.target.parentElement.parentElement.parentElement, false)
  if (ev.target.classList.contains("ALERT_DRAGGER")) {
    if (Date.now() - lastPtrUp < 300) // up-up = doubleclick
    {
      toggleNBDFullScr(ev.target.closest(".ALERT_NONBLOCK").querySelector(".content"))
    }
    else console.log(Date.now() - lastPtrUp)
    lastPtrUp = Date.now();
  }
}
function toggleNBDFullScr(contentEle:HTMLDivElement) 
{
  // let ele = contentEle.parentElement.querySelector(".fullscr > span");
  // ele.
  if (contentEle.dataset.fullscreen=="no") contentEle.parentElement.classList.add("fscr");
  else contentEle.parentElement.classList.remove("fscr");
  contentEle.dataset.fullscreen = contentEle.dataset.fullscreen=="no"?"yes":"no";
  contentEle.style.height = contentEle.style.height?"":(
    contentEle.classList.contains("hasBtn")?"calc(100vh - 200px)":"calc(100vh - 100px)");
  contentEle.style.width = contentEle.style.width?"":"calc(100vw - 50px)";
  let ele = contentEle.parentElement.querySelector(".fullscr > span");
  if (contentEle.dataset.fullscreen=="yes") ele.innerText = "close_fullscreen";
  else ele.innerText = "fullscreen";
 }
function pointerMove(ev:PointerEvent) 
{
  if (DRAGGING) {
    DRAGGING.parentElement.style.left = origLeft+ev.screenX - origX+"px";
    DRAGGING.parentElement.style.top = origTop+ev.screenY-origY+"px";
    ev.preventDefault();
    ev.stopPropagation();
  }
}
function pointerDown(ev:PointerEvent) {
  if (ev.currentTarget.parentElement.querySelector(".content").dataset.fullscreen == "yes") return false;
  DRAGGING = ev.currentTarget;
  // document.body.appendChild(DRAGGING.parentElement);
  ev.preventDefault();
  ev.stopPropagation();
  origX = ev.screenX;
  origY = ev.screenY;
  origLeft = toIntPx(window.getComputedStyle(DRAGGING.parentElement).left);
  origTop = toIntPx(window.getComputedStyle(DRAGGING.parentElement).top);
}

function toIntPx(val:string) {
  return Number(val.replace("px", ""));
}

function decodeStatus(status:number) {
  switch(status) 
  {
    case 0: return "Network failure"
    case 200: return "Success"
    case 502: return "Internal Server Error"
    case 404: return "Not found"
    case 429: return "Too many requests"
    case 403: return "Forbidden"
    case 401: return "Unauthorised"
    case 400: return "Invalid request"
    case 413: return "Request too large"
    case 500: 
    case 503:
      return "Internal Server Error"
  }  
  return "Unknown error";
}

function send(params: any, callback: (thing: any) => any, silentLoading:boolean=false, link:string="/server") {
  let overlay = document.getElementById("overlayL");
  if (overlay && !silentLoading) {
    console.log("overlay active")
    overlay.style.opacity="1";
    overlay.style.backgroundColor="var(--system-overlay)";
    overlay.style.pointerEvents="auto";
    byId("overlayLContainer").style.opacity=1;
    byId("overlayLContainer").style.pointerEvents="auto";
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", link, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {

      // if (failureTimeout) clearTimeout(failureTimeout);
      
      // failureTimeout = null;
      
      callback(JSON.parse(xhr.responseText));
    }
    else if (xhr.readyState == 4 && xhr.status != 200) {
      // if (failureTimeout) clearTimeout(failureTimeout);
      // else closeAlert(true);
      // failureTimeout = null;
      alertDialog("Received status code " +xhr.status+" ("+decodeStatus(xhr.status)+") -- resend request?", ()=>{send(params, callback, silentLoading);}, true);
      
    }
    if (overlay) {
      overlay.style.opacity="0";
      overlay.style.pointerEvents="none";
      overlay.style.backgroundColor="var(--system-grey2)";
      byId("overlayLContainer").style.opacity=0;
      byId("overlayLContainer").style.pointerEvents="none";
    } else closeAlert(-1);
  }
  console.log("about to send with params:", params);
  xhr.withCredentials = true;
  xhr.send(params);
  // let failureTimeout = setTimeout(() => {
  //   failureTimeout = null;
  //   alertDialog(`This is taking longer than expected.`, (res) => {callback(res);}, 1, params)
  // }, 5000);
}

function acceptCookies(link:string="/server") {
  let cpm = document.getElementById("compliance") as HTMLDivElement;
  cpm.style.transition="all 0.5s ease";
  cpm.style.opacity="0";
  cpm.style.pointerEvents="none";
  send(JSON.stringify({action:"acceptCookies"}), (res)=> {}, false, link);

}

// set text to "NOCONFIRM" to remove the confirm button
function nonBlockingDialog(data:{
  text:string, 
  colour?:string,
  continueText?:string,
  hasButton?:boolean,
  ico?:string}, callback:()=>any) 
{
  if (data.colour == null)data.colour="grn";
  if (data.continueText == null) data.continueText="Continue";
  if (data.hasButton == null) data.hasButton=true;
  if (data.ico == null) data.ico = "arrow_forward";
  let div = document.createElement("div");
  div.className="ALERT_NONBLOCK";
  div.isOpen = true;
  div.innerHTML = `
  
  <div class="content ${data.hasButton?"hasBtn":""}" data-fullscreen=no>${data.text}</div>`; // yes, it can be html'd
  let draggable = document.createElement("div");
  
  draggable.className = "ALERT_DRAGGER";
  draggable.innerText = "ServiceAlert"
  draggable.innerHTML += `<div class="close" onclick="closeNBD(this.parentElement.parentElement, false)">
  <span class="red nooutline material-symbols-outlined">close</span>
  </div> 
  <div class="close fullscr" onclick="toggleNBDFullScr(this.parentElement.parentElement.querySelector('.content'), false)">
  <span class="blu nooutline material-symbols-outlined">fullscreen</span>
  </div>`
  div.prepend(draggable);
  div.callback=callback;
  document.body.appendChild(div);
  setTimeout(()=>{
    div.style.opacity="1";
    div.style.pointerEvents="auto";  
    draggable.onpointerdown = pointerDown;
  }, 20);
  let button = document.createElement("button");
  // div.appendChild(document.createElement("br"));
  if (data.hasButton) {
    div.appendChild(button);
    button.outerHTML = `
    <button class="${data.colour} btn fsmed closeBtn" onclick="closeNBD(this.parentElement, true)">
    <span class='material-symbols-outlined'>${data.ico}</span>
    ${data.continueText}<div class="anim"></div>
    </button>`;
  }
  return div;
}

function closeNBD(ele:HTMLElement, confirmQ:boolean) {
  // console.log(ele);
  ele.style.opacity="0";
  ele.isOpen = false;
  ele.style.pointerEvents = "none";
  if (confirmQ) ele.callback(ele.querySelector(".content"));
}

// let TIME:NodeJS.Timeout|null;
let ALERTOPEN = false;
// let cbk: () => any = () => { };
// let BLOCKCALLBACK = false;
function alertDialog(str: string, callback: () => any = ()=>{}, requiresConfirmation = false) {
  // if (TIME) clearTimeout(TIME);
  // TIME = null;
  // console.log("Timeout cleared")
  // e.preventDefault();
  let newDialog = document.createElement("dialog");
  try {dialogPolyfill.registerDialog(newDialog);}
  catch(e:any) {}
  // catch (e:Exception) {str += "\n\nAdditionally, an error occurred while loading dialogs: "+e}
  document.body.appendChild(newDialog);
  newDialog.className = "internal ALERT";
  newDialog.id="internal_alerts";
  
  // newDialog.style.opacity = "0";
  newDialog.style.textAlign="center";
  newDialog.innerHTML = `
    <p class="fsmed" id="alerttext_v2">Error: AlertDialog configured incorrectly. Please contact BetaOS.</p>
    <div style="text-align: center;"><button id="confirmbtn" class="btn szHalf override" onclick="console.log('ConfirmClick'); closeAlert(1)" style="display: inline-block">
      <span class="alertlbl">Continue</span>
      <span class="material-symbols-outlined">arrow_forward_ios</span>
      <div class="anim"></div>
    </button>
    <button class="btn szHalf red override" id="cancelBtn" style="display: none" onclick="console.log('RejectClick'); closeAlert(-1)">
      <span class="alertlbl">Cancel</span>
      <span class="material-symbols-outlined">cancel</span>
      <div class="anim"></div>
    </button></div>`;
  
  setTimeout(()=>{
    newDialog.style.opacity="1";
    newDialog.style.top = "18px";
  }, 0);
  newDialog.setAttribute("type", requiresConfirmation+"")
  // newDialog.setAttribute("callback", callback.toString())
  
  // here we add a new attribute to the element, hoping that nothing breaks
  newDialog.callback = callback; 
  // console.log(newDialog.callback)
  let overlay = document.getElementById("overlayL");
  if (overlay) {
    overlay.style.opacity="0";
  }
  let ele = document.getElementById("overlay") as HTMLDivElement;
  if (ele) ele.innerHTML="";
  let p = newDialog.querySelector("#alerttext_v2");
  if (!ele || !p) {
    console.log("ERROR: Alert dialogs not enabled in this page.")
    callback();
    return;
  }
  
  ele.style.opacity="1";
  // newDialog.style.opacity="1";
  // newDialog.style.top = "0vh ";
  newDialog.style.pointerEvents="auto";
  ALERTOPEN = true;
  p.innerText = str;
  p.innerHTML += "<br><br><p style='margin: 10px auto' class='gry nohover'>(Press ENTER or ESC)</p>"
  newDialog.querySelector("#cancelBtn").style.display = "none";
  // if (button == 1) {
  //   p.innerHTML += `<button class='btn szThird fssml' id="resend" onclick='closeAlert(-1); send(decodeURIComponent("${encodeURIComponent(failedReq)}"), (res)=>{this.parentElement.parentElement.callback(res);})'>
  //   <span class="material-symbols-outlined">history</span> Retry?
  //   <div class="anim"></div></button>`
  //   newDialog.querySelector("#cancelBtn").style.display="inline-block";
  //   newDialog.querySelector("#confirmbtn").style.display="none";
  //   newDialog.querySelector("#cancelBtn").querySelector(".alertlbl").innerText = "Close"
  //   console.log("Alert-type: FAILEDREQUEST" + failedReq);
  // }
  if (requiresConfirmation) {
    newDialog.querySelector("#cancelBtn").style.display = "inline-block";
    console.log("Alert-type CANCELLABLE");
  }
  else console.log("Alert-type: STANDARD");
  newDialog.showModal();
  // if (failureTimeout) clearTimeout(failureTimeout);
  // failureTimeout = null;
}

// three ways to close a dialog. 
// acknowledged a callback (enter key)
// cancelled a callback (escape key) - only for type-two
// clicked outside (depends on alert type)
function closeAlert(sel:number) {
  let ele = document.getElementById("overlay") as HTMLDivElement;
  // let dialog = 
  let coll = document.getElementsByClassName("ALERT");
  let dialog = coll.item(coll.length-1);
  if (!dialog) return;
  let overridecallback=false;
  if ((dialog.getAttribute("type")=="true" || dialog.getAttribute("type")=="2" )&& sel < 0) overridecallback = true;
  if (!ele) {
    console.log("Alert dialogs not enabled in this page");
    return;
  }
  
  dialog.style.top = "50vh";
  dialog.style.opacity="0";
  dialog.style.pointerEvents="none";
  // console.log(dialog.callback)
  if (!overridecallback) {
    try {dialog.callback(); }
    catch (e:any) {alertDialog("Error while calling back: "+e, ()=>{});}
  }
  // can't remove t he damn dialog because we want it to fade out first
  // so instead we change its class name so it does not get found again
  setTimeout(()=>{dialog.close()}, 500);
  dialog.className = "internal CLOSEDALERT";
  dialog.id="CLOSEDALERT";
  // dialog.remove();

  
  // eval("(()=>{"+dialog.getAttribute("callback")+"})()");
  // dialog.
  if (!dialogsActive()) { // if no alerts are open AND form-dialog is not open
    ALERTOPEN = false;
    ele.style.opacity="0";
    ele.style.pointerEvents="none";
  }
  // if (cbk && !overrideCallback) {
  //   console.log("calling back")
  //   // cbk();
  // }
}

function keydown(e: Event) {
  if (e.defaultPrevented) {
    console.log("prevent-defaulted");
    return;
  }
  if (byId("ftrNav") && e.key == "/" && e.target.nodeName != "TEXTAREA" && (e.target.nodeName != "INPUT" || 
                       (e.target.type!="text" && e.target.type!="password"))) {
    location.href="#ftrNav";
    byId("ftrNav").focus();
    e.preventDefault();
    return;
  }
  if(ALERTOPEN && !DIALOGOPEN && (e.key == "Escape"||e.key == "Enter")) {
    e.preventDefault();
    if (e.key == "Escape") {
      console.log("RejectKey")
      closeAlert(-1);
    }
    else {
      console.log("ConfirmKey")
      closeAlert(1);
    }
  }
  if (!ALERTOPEN && !DIALOGOPEN && 
      (e.target.nodeName == "INPUT" || e.target.nodeName == "TEXTAREA") &&
      e.key == "Escape") 
  {
    e.target.blur();
  }
}

function suffix(i:number) 
{
  // 11st is wrong, it is 11th. 111st is also wrong, and so is 1011th... 21st OK
  if (i%10==1 && i%100 != 11) return "st";
  // 12nd is wrong, so is 112, etc...
  if (i%10==2 && i%100 != 12) return "nd";
  if (i%10==3 && i%100 != 13) return "rd";
  return "th";
}
function toTime(ms: number, inclMs:boolean=false) {
  let day = Math.floor(ms / 1000 / 60 / 60 / 24);
  ms = ms % (1000 * 60 * 60 * 24);
  let hr = Math.floor(ms / 1000 / 60 / 60);
  ms = ms % (1000 * 60 * 60);
  let min = Math.floor(ms / 1000 / 60);
  ms = ms % (1000 * 60);
  let sec = Math.floor(ms / 1000);
  if (ms < 0) return "00:00:00";
  return (day > 0 ? day + "d " : "") + padWithZero(hr) + ":" + padWithZero(min) + ":" + padWithZero(sec)+(inclMs?"."+padWithThreeZeroes(ms%1000):"");
}

function minimalTime(ms:number, inFuture:boolean=false) {
  if (isNaN(ms)) return "unknown time"
  if (ms < 60000) return inFuture?"shortly":"just now";
  let day = Math.floor(ms / 1000 / 60 / 60 / 24);
  ms = ms % (1000 * 60 * 60 * 24);
  let hr = Math.floor(ms / 1000 / 60 / 60);
  ms = ms % (1000 * 60 * 60);
  let min = Math.floor(ms / 1000 / 60);
  ms = ms % (1000 * 60);
  return (day > 0 ? day + "d " : "") + (hr > 0?(hr+"h"):"") + min+"m";
}


function padWithThreeZeroes(n:number) {
  if (n < 10) return "00"+n;
  if (n < 100) return "0"+n;
  return n;
}
function padWithZero(n: number) {
  return n < 10 ? "0" + n : n;
}

let overlay:HTMLDivElement;
const tips = ["Press <kbd>/</kbd> to jump to a page", "🧀", 
              "Have you tried turning it off and on again?",
              "Try <a href='/clickit'>ClickIt</a> today!",
             "Your insanity will pay off. Eventually.",
             "Don't worry! It's fine... We can fix it!",
             "Help! I've fallen and can't get back up again!",
             "Tofu is solidified bean water. On that note, try Humanity(r) Bean Water today!",
             "The void orb watches over you."];

addEventListener("DOMContentLoaded", function() {
  overlay = document.createElement("div");
  overlay.className = "overlayLoader"
  overlay.id = "overlayL";
  // overlay.style.left="0vh";
  overlay.style.backgroundColor="var(--system-overlay)";
  overlay.style.opacity="0"; // no more loader at start
  overlay.style.pointerEvents = "none"; // no more loader at start
  overlay.innerHTML = `<div id="overlayLContainer" style='pointer-events:none;'>
  <p class="fslg grn nohover">Loading.</p>
  <span class="material-symbols-outlined loader">sync</span>
  <hr class="rounded">
  <p class="fsmed gry nohover"><b>DailyWisdom:</b> ${tips[Math.floor(Math.random()*tips.length)]}</p>
  </div>`
  // document.appendChild(document.createElement("body"));
  document.body.appendChild(overlay);
  // console.log(document.body.innerHTML)
  
  // screw with the meta tags
  let metatags = document.createElement("meta");
  metatags.content = "width=device-width, initial-scale=1.0, min-scale=1.0";
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
  let ele = byId("overlay");
  if (!dialogsActive()) { // if no alerts are open AND form-dialog is not open
    ALERTOPEN = false;
    ele.style.opacity="0";
    ele.style.pointerEvents="none";
  }
  thing();
  
  // document.getElementById("startBtn").focus();
}

function dialogsActive() {
  return document.getElementsByClassName("ALERT").length>0 || DIALOGOPEN;
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
  let ele = e.target.closest(".btn")|| e.target;
  let text = ele.innerHTML.replaceAll(/<.*((>.*<\/.*>)|(\/>))/gmiu, "").replaceAll("\n", "").trim();
  if (ele.getAttribute("tooltip")) text = ele.getAttribute("tooltip");

  if (typeof ele.className != "string") return;
  if (ele.className.match(/(\W|^)btn(\W|$)/) && !ele.className.match(/(\W|^)notooltip(\W|$)/)) {
    let tooltip = ele.children.namedItem("TOOLTIP");
    if (!tooltip && text != "") {
      // console.log(text);
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
  if (res.data.expiry < Date.now() || res.data.expiry - Date.now() > 9e60) {
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
    }, true)
  }, Math.max(res.data.expiry - Date.now() - 60000, 1000))
}

function whichTransitionEvent(){
    var t;
    var el = document.createElement('fakeelement');
    var transitions = {
      'transition':'transitionend',
      'OTransition':'oTransitionEnd',
      'MozTransition':'transitionend',
      'WebkitTransition':'webkitTransitionEnd'
    }

    for(let t in transitions){
        if( el.style[t] !== undefined ){
            return transitions[t];
        }
    }
}

function ephemeralDialog(text:string) 
{
  let dialog = document.createElement("div");
  dialog.classList.add("ephemeral");
  dialog.innerHTML = text;
  dialog.style.animation = "appear 1s forwards";
  byId("ephemerals").prepend(dialog);
  setTimeout(()=>{
    closeEphemeral(dialog)
  }, 10000);
  dialog.onclick = ()=>{closeEphemeral(dialog)}
}
function closeEphemeral(dialog:HTMLDivElement) 
{
  dialog.style.animation = "disappear 0.6s forwards";
  setTimeout(()=>{dialog.remove()}, 600); // because it's got some weird stuff going on
}
let loginDialog = null;
function login_v2(ev:any, signup:boolean=false) 
{
  if (ev) ev.preventDefault();
  if (loginDialog && loginDialog.isOpen) return; // do not open TWO 
  loginDialog = nonBlockingDialog({
    text:`<iframe class="loginiframe" src="/minimal${signup?"Signup":"Login"}"></iframe>`, 
    hasButton:false}, null);
  toggleNBDFullScr(loginDialog.querySelector(".content"))
}

function closeLogin()
{
  closeNBD(loginDialog);
}

function globalReload() 
{
  // BROKEN: DO NOT ATTEMPT TO DO THIS.
  location.reload();
  // byId("overlay").remove();
  // // byId("overlayL").remove();
  // byId("compliance").remove();
  // byId("footer").remove();
  // let uSidebar = byClass("sidebar-unstable");
  // if (uSidebar) uSidebar.remove();
  // byId("ephemerals").remove();
  // globalOnload(onloadCallback);
}

function logout_v2(event) 
{
  event.preventDefault()
  send(JSON.stringify({action: "logout"}), (res)=>{
    ephemeralDialog("Successfully logged out!");
    location.reload(); // some things do not reset properly on logout.
  })
}

function hashIt(str, seed = 0) {
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
};

/* BETTERSELECT SELECT DIALOGS */
let bSelVersion="v4";

function clickSelect(whichOne, openQ=0) 
{
  // console.log("which one?", whichOne);
  let ctn = byId(whichOne);
  // console.log(ctn);
  // console.log(openQ);
  if (openQ != 0) ctn.selectOpen = (openQ==1);
  else ctn.selectOpen=!ctn.selectOpen;
  // console.log(ctn.selectOpen);

  if (!ctn) {
    console.error("No container found!");
    return;
  }
  // if open then close all others
  // if (ctn.selectOpen)
  // {
    // if (currOpen) clickSelect(currOpen, -1);
    // currOpen = whichOne;
  // }
  let inp = ctn.querySelector(".betterSelect");
  inp.readOnly=!ctn.selectOpen;
  inp.style.cursor = ctn.selectOpen?"text":"pointer";
  ctn.querySelector(".optionMenu").className = "optionMenu "+ (ctn.selectOpen?"open":"");
  // if (!ctn.selectOpen) {
  {
    inp.value = "";
    // check if value is valid
    let children = inp.nextElementSibling.children;
    let valid = ctn.selectOpen; // valid if open
    for (let i=0; i<children.length; i++) {
      if (inp.selectedVal == children[i].innerText) { 
        valid = true;
        inp.bSelValid = true;
      }
      if (ctn.selectOpen) children[i].tabIndex = 0;
      else children[i].tabIndex=-1;
    }
    if (valid) {
      // console.log("valid");
      inp.placeholder = inp.selectedVal?inp.selectedVal:"Make a selection...";
      inp.classList.remove("invalid");
    }
    else if (inp.selectedVal != undefined) {
      inp.selectedVal = "";
      inp.bSelValid = false;
      inp.classList.add("invalid");
      inp.placeholder = "Invalid selection";
    }
  } // true
}

function enterEvent(inp:HTMLInputElement, e:Event) 
{
  if (!e.target.classList.contains("betterSelect"))
    inp.value = e.target.innerText;
  inp.selectedVal = inp.value;
  // console.log('enter');
  clickSelect(inp.parentElement.id);
  inp.focus();
  // console.log(inp.valueMap.get(inp.selectedVal));
  if (inp.bSelValid) // console.log(inp.parentElement);
    inp.parentElement.value = inp.valueMap.get(inp.selectedVal);
  if (inp.bSelOnChangeEvent && inp.bSelValid) {
    inp.bSelOnChangeEvent(inp.selectedVal, inp.valueMap.get(inp.selectedVal));
  }
  e.preventDefault();
}
let registered = [];
function bSelRegister(id:string, onChange:()=>any, defaultVal:string) 
{
  let ctn = byId(id);
  registered.push(id);
  let inp = ctn.querySelector(".betterSelect");
  inp.bSelOnChangeEvent = onChange;
  // console.log(onChange);
  inp.valueMap = new Map();
  let children = inp.nextElementSibling.children;
  for (let i=0; i<children.length; i++) {
    inp.valueMap.set(children[i].innerText, children[i].getAttribute("val") || children[i].getAttribute("value"));
  }
  if (defaultVal) {
    ctn.value=inp.valueMap.get(defaultVal);
    inp.selectedVal = defaultVal;
    inp.value=defaultVal;
    inp.placeholder = defaultVal;
  }
  else inp.placeholder = "Make a selection...";
  inp.addEventListener("pointerdown", (e)=>{
    // console.log(e.target);
    // console.log("pointerdown");
    for (let i=0; i<registered.length; i++) 
      clickSelect(registered[i], -1);
    clickSelect(e.target.parentElement.id, 1);
    e.preventDefault();
  });
  ctn.addEventListener("pointerup", (e)=>{
    if (e.target.classList.contains("option")) 
    {
      let inp = e.target.parentElement.parentElement.querySelector("input");
      // e.target.focus()
      enterEvent(inp, e);
    }
  })
  inp.bSelValid = false;
}

function bSelInitialise() {
  console.log("Initialising BetterSelects");
  // bSelRegister("selCtn", (value)=>{console.log(value);});
  // <!-- bSelRegister("selCtn2"); -->
  document.addEventListener("pointerup", (e)=>{
    if (e.target.closest(".bSel")) return;
    // console.log("clicked away");
    for (let i=0; i<registered.length; i++) 
      clickSelect(registered[i], -1);
  })
  document.addEventListener("keydown", (e)=>
  {
    if (!e.target.classList.contains("betterSelect") 
     && !e.target.classList.contains("option")) return;
    // console.log(e.key);
    let inp;
    if (!e.target.classList.contains("betterSelect")) 
      inp = e.target.parentElement.parentElement.querySelector("input");
    else inp = e.target;
    switch (e.key) 
    {
      case " ":
        if (e.target.classList.contains("betterSelect"))
          break;
      case "Enter":
        enterEvent(inp, e);
        return;
      case 'Escape':
        clickSelect(inp.parentElement.id, -1);
        inp.value = "";
        e.preventDefault();
        break;
      case 'ArrowDown':
        e.preventDefault();
        clickSelect(inp.parentElement.id, 1);
        if (e.target.classList.contains("option")) 
          if (e.target.nextElementSibling)
            e.target.nextElementSibling.focus();
          else 
            e.target.parentElement.children[0].focus();
        else 
          e.target.nextElementSibling.children[0].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        clickSelect(inp.parentElement.id, 1);
        if (e.target.classList.contains("option")) 
          if (e.target.previousElementSibling)
            e.target.previousElementSibling.focus();
          else 
            e.target.parentElement.lastElementChild.focus();
        else 
          // console.log(e.target.nextElementSibling);
          e.target.nextElementSibling.lastElementChild.focus();
      break;
      default:
        if (e.key.length == 1 && !e.target.classList.contains("betterSelect")) // nothing stupid likee backspace/etc 
        {
          let inp = e.target.parentElement.parentElement.querySelector("input");
          // inp.value = e.key;
          inp.focus();

        }
    } // switch (key)
  })
};