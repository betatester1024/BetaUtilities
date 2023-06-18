// import dialogPolyfill from './nodemodules/dialog-polyfill/dist/dialog-polyfill.esm.js';
let SESSIONTIMEOUT, SESSIONTIMEOUT2 = null;

function byId(name:string) {
  return document.getElementById(name);
}
function byClass(name:string, ct:number=0) {
  return document.getElementsByClassName(name).item(ct);
}

let HASNETWORK = false;
async function globalOnload(cbk:()=>any, networkLess:boolean=false) {

  if (!networkLess) {
    var script = document.createElement('script');
    script.src = "./nodemodules/dialog-polyfill/dist/dialog-polyfill.js";
    document.head.appendChild(script);
  }
  else byId("overlayL").remove();
  HASNETWORK = !networkLess;
  // load NotoSansMono
  // const NSM = new FontFace('Noto Sans Mono', 'url(https://fonts.googleapis.com/css2?family=Noto+Sans+Mono&display=swap)');
  // await NSM.load();
  // document.fonts.add(NSM);
  // WebFont.load({
  //   google: {
  //     families: ['Noto Sans Mono']
  //   }
  // });
  // console.log("Font loaded!")
  
  document.onkeydown = keydown;
  
  document.body.addEventListener("mouseover", mouseOver);

  // byId("overlay").onclick=(e:Event)=>{
  //   if (dialogQ) {
  //     console.log("ClickOutside (Reject)")
  //     closeAlert(-1);
  //   }
  // };
  if (!networkLess) {
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
      let ftr = byId("ftrOverride")??document.createElement("footer");
      if (!byId("ftrOverride")) maincontent.appendChild(ftr);
      
      let ele = document.createElement("p");
      ele.id="footer";
      let urlEle = new URL(location.href);
      let redirector = urlEle.pathname + "?"+urlEle.searchParams.toString();
      if (res.status != "SUCCESS")
        ele.innerHTML = `<a href="/login?redirect=${encodeURIComponent(redirector)}">Login</a> | 
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
              // console.log("thing");
              let cpl = document.getElementById("compliance");
              cpl.style.opacity="1";
              cpl.style.pointerEvents="auto";
              // document.getElementById("compliance").style.top="unset";
            }
            else {
              let cpl = document.getElementById("compliance");
              cpl.style.opacity="0";
              cpl.style.pointerEvents="none";
            }
            if (cbk) cbk();
          }, true);
        }, true);
      
    }, true);
  }
  
  let ele2 = document.getElementById("overlay");
  if (ele2)
    ele2.innerHTML = `<div class="internal" style="opacity: 0; text-align: center !important"> </div>`
  document.body.innerHTML += `
  <div id="compliance">
    <h2 class="blu nohover"><span class="material-symbols-outlined">cookie </span> BetaOS Services uses cookies to operate.</h2>
    <p>We use only <kbd>strictly necessary cookies</kbd> to verify and persist 
    your login session, and to confirm your acceptance of these cookies. <br>
    By continuing to use this site, you consent to our use of these cookies.</p>
    <button class='blu btn fsmed' onclick="acceptCookies()">
    <span class="material-symbols-outlined">check</span>
    I understand
    <div class="anim"></div>
    </button>
  </div>`;
  if (networkLess) {let cpl = document.getElementById("compliance");
  cpl.style.opacity="1"; }
              // cpl.style.pointerEvents="none";
}

function send(params: any, callback: (thing: any) => any, onLoadQ:boolean=false) {
  let overlay = document.getElementById("overlayL");
  console.log(onLoadQ)
  if (overlay && !onLoadQ) {
    console.log("overlay active")
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
      failureTimeout = null;
      callback(JSON.parse(xhr.responseText));
    }
    else if (xhr.readyState == 4 && xhr.status != 200) {
      if (failureTimeout) clearTimeout(failureTimeout);
      // else closeAlert(true);
      failureTimeout = null;
      alertDialog("Received status code " +xhr.status+" - resend request?", ()=>{send(params, callback, onLoadQ);}, 2);
    }
  }
  console.log(params);
  xhr.send(params);
  let failureTimeout = setTimeout(() => alertDialog(`This is taking longer than expected.`, () => { }, 1, params), 5000);
}

function acceptCookies() {
  let cpm = document.getElementById("compliance")
  cpm.style.transition="all 0.5s ease";
  cpm.style.opacity="0";
  cpm.style.pointerEvents="none";
  send(JSON.stringify({action:"acceptCookies"}), (res)=> {});

}

// let TIME:NodeJS.Timeout|null;
let dialogQ = false;
// let cbk: () => any = () => { };
// let BLOCKCALLBACK = false;
function alertDialog(str: string, callback: () => any = ()=>{}, button: number = -1, failedReq: string = "") {
  // if (TIME) clearTimeout(TIME);
  // TIME = null;
  // console.log("Timeout cleared")
  // e.preventDefault();
  let newDialog = document.createElement("dialog");
  try {dialogPolyfill.registerDialog(newDialog);}
  catch (e:Exception) {str += "\n\nAdditionally, an error occurred while loading dialogs: "+e}
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
  newDialog.setAttribute("type", button+"")
  // newDialog.setAttribute("callback", callback.toString())
  
  // here we add a new attribute to the element, hoping that nothing breaks
  newDialog.callback = callback; 
  // console.log(newDialog.callback)
  let overlay = document.getElementById("overlayL");
  if (overlay) {
    overlay.style.opacity="0";
  }
  let ele = document.getElementById("overlay") as HTMLDivElement;
  ele.innerHTML="";
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
  dialogQ = true;
  p.innerText = str;
  p.innerHTML += "<br><br><p style='margin: 10px auto' class='gry nohover'>(Press ENTER or ESC)</p>"
  newDialog.querySelector("#cancelBtn").style.display = "none";
  if (button == 1) {
    p.innerHTML += `<button class='btn szThird fssml' id="resend" onclick='send(decodeURIComponent(${encodeURIComponent(failedReq)})'>
    <span class="material-symbols-outlined">history</span> Refresh?
    <div class="anim"></div></button>`
    console.log("Alert-type: FAILEDREQUEST" + failedReq);
  }
  else if (button == 2) {
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
  if (dialog.getAttribute("type")==2 && sel < 0) overridecallback = true;
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
    dialogQ = false;
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
  if(dialogQ && (e.key == "Escape"||e.key == "Enter")) {
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
  let ele = byId("overlay");
  if (!dialogsActive()) { // if no alerts are open AND form-dialog is not open
    dialogQ = false;
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
  let ele = e.target;
  let text = ele.innerHTML.replaceAll(/<.*((>.*<\/.*>)|(\/>))/gmiu, "").replaceAll("\n", "").trim();
  // fuck off this is good enough, it's not even used as raw html
  if (typeof ele.className != "string") return;
  if (ele.className.match(/(\W|^)btn(\W|$)/) && !ele.className.match(/(\W|^)notooltip(\W|$)/)) {
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
    }, 2)
  }, Math.max(res.data.expiry - Date.now() - 60000, 1000))
}