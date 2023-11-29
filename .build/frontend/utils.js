"use strict";
let SESSIONTIMEOUT, SESSIONTIMEOUT2 = null;
function byId(name) {
  let ele = document.getElementById(name);
  return ele;
}
function byClass(name, ct = 0) {
  return document.getElementsByClassName(name).item(ct);
}
const docURL = new URL(document.URL);
let HASNETWORK = false;
let branch = "STABLE";
let userData = null;
let onloadCallback = null;
async function globalOnload(cbk, networkLess = false, link = "/server") {
  onloadCallback = cbk;
  if (!networkLess) {
    var script = document.createElement("script");
    script.src = "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js";
    document.head.appendChild(script);
    script.onload = () => {
      WebFont.load({
        google: {
          families: ["Noto Sans Mono", "Noto Sans Display", "Noto Color Emoji"]
        }
      });
      console.log("Font loaded!");
    };
    script = document.createElement("script");
    script.src = "/nodemodules/dialog-polyfill/dist/dialog-polyfill.js";
    document.head.appendChild(script);
  }
  HASNETWORK = !networkLess;
  document.onkeydown = keydown;
  document.onpointerup = pointerUp;
  document.onpointermove = pointerMove;
  document.body.addEventListener("mouseover", mouseOver);
  if (!byId("overlay")) {
    let ovr = document.createElement("div");
    ovr.id = "overlay";
    document.body.appendChild(ovr);
  }
  if (!networkLess) {
    send(
      JSON.stringify({ action: "userRequest" }),
      (res) => {
        userData = res.data;
        if (res.data.branch)
          branch = res.data.branch;
        if (branch == "unstable" && link == "/server") {
          let mainContent = byClass("main_content");
          mainContent.style.width = "calc(100% - 30px)";
          mainContent.style.margin = "0px";
          let box = document.createElement("p");
          box.className = "sidebar-unstable";
          box.innerHTML = `<span class="material-symbols-outlined">warning</span>        Unstable version. Features may be unfinished or broken. 
        <a class="grn" href="${process.env.domain}">Switch to stable branch</a>`;
          document.body.appendChild(box);
        }
        let maincontent = document.getElementsByClassName("main_content").item(0);
        let ftr = byId("ftrOverride") ?? document.createElement("footer");
        if (!byId("ftrOverride"))
          maincontent.appendChild(ftr);
        let ele = document.createElement("p");
        ele.id = "footer";
        let urlEle = new URL(location.href);
        let redirector = urlEle.pathname + "?" + urlEle.searchParams.toString();
        if (link != "/server" && res.status != "SUCCESS")
          ele.innerHTML = `<a href="${process.env.domain}">BetaOS Services site</a> | 
                      <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                        <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                        <div class="anim"></div>
                      </form> |
        BetaOS Systems V3, 2023`;
        else if (res.status != "SUCCESS") {
          ele.innerHTML = `<a href="/login?redirect=${encodeURIComponent(redirector)}" onclick="login_v2(event)">Login</a> | 
                      <a href='/signup?redirect=${encodeURIComponent(redirector)}' onclick="login_v2(event, true)">Sign-up</a> | 
                      <a href='/status'>Status</a> | 
                      <a href='https://${branch == "unstable" ? process.env.domain : process.env.unstableDomain}'>
                      Switch to ${branch == "unstable" ? "stable" : "unstable"} branch</a> | 
                      <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                        <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                        <div class="anim"></div>
                      </form> |
                      BetaOS Systems V3, 2023`;
        } else if (res.status == "SUCCESS" && link == "/server") {
          resetExpiry(res);
          ele.innerHTML = `Logged in as <kbd>${res.data.user}</kbd> |
                      <a href='/logout' onclick='logout_v2(event)'>Logout</a> | 
                      <a href='/config'>Account</a> | 
                      <a href='/status'>Status</a> | 
                      <a href='https://${branch == "unstable" ? process.env.domain : process.env.unstableDomain}'>
                      Switch to ${branch == "unstable" ? "stable" : "unstable"} branch</a> | 
                      <a href='javascript:send(JSON.stringify({action:"toggleTheme"}), (res)=>{if (res.status != "SUCCESS") alertDialog("Error: "+res.data.error, ()=>{});else {alertDialog("Theme updated!", ()=>{location.reload()}); }})'>Theme</a> |
                      <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                        <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                        <div class="anim"></div>
                      </form> |
                      BetaOS Systems V3, 2023`;
        } else {
          ele.innerHTML = `Logged in as <kbd>${res.data.user}</kbd> |
                      <a href='${process.env.domain}/logout'>Logout</a> | 
                      <a href="${process.env.domain}">BetaOS Services site</a> | 
                      <form class="inpContainer szThird nobreak" action="javascript:location.href='/'+byId('ftrNav').value" style="margin: 2px;">
                        <input type="text" id="ftrNav" class="fssml sz100 ftrInput" placeholder="Navigate... (/)">
                        <div class="anim"></div>
                      </form> |
                      BetaOS Systems V3, 2023`;
        }
        ftr.appendChild(ele);
        let ephDiv = byId("ephemerals") ?? document.createElement("div");
        if (!ephDiv.id) {
          ephDiv.id = "ephemerals";
          document.body.appendChild(ephDiv);
        }
        send(
          JSON.stringify({ action: "visits" }),
          (res2) => {
            if (res2.status != "SUCCESS") {
              alertDialog("Database connection failure. Please contact BetaOS. Error: " + res2.data.error, () => {
              });
              ele.innerHTML = `<kbd class="red nohover">Database connection failure.</kbd>`;
            } else
              document.getElementById("footer").innerHTML += " | <kbd>Total requests made: " + res2.data.data + "</kbd>";
            send(JSON.stringify({ action: "cookieRequest" }), (res3) => {
              if (res3.data.toString() == "false") {
                let cpl = document.getElementById("compliance");
                cpl.style.opacity = "1";
                cpl.style.height = "auto";
                cpl.style.pointerEvents = "auto";
              } else {
                let cpl = document.getElementById("compliance");
                cpl.style.opacity = "0";
                cpl.style.pointerEvents = "none";
              }
              if (cbk)
                cbk();
            }, true, link);
          },
          true,
          link
        );
      },
      true,
      link
    );
  }
  let ele2 = document.getElementById("overlay");
  if (ele2)
    ele2.innerHTML = `<div class="internal" style="opacity: 0; text-align: center !important"> </div>`;
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
    cpl.style.opacity = "1";
    cpl.style.height = "auto";
  }
}
let DRAGGING = null;
let origLeft = -1;
let origTop = -1;
let origX = -1;
let lastPtrUp = -1;
let origY = -1;
function pointerUp(ev) {
  DRAGGING = null;
  origLeft = -1;
  origTop = -1;
  if (ev.target.classList.contains("ALERT_DRAGGER")) {
    if (Date.now() - lastPtrUp < 300) {
      toggleNBDFullScr(ev.target.closest(".ALERT_NONBLOCK").querySelector(".content"));
    } else
      console.log(Date.now() - lastPtrUp);
    lastPtrUp = Date.now();
  }
}
function toggleNBDFullScr(contentEle) {
  contentEle.style.height = contentEle.style.height ? "" : "calc(100vh - 150px)";
  contentEle.style.width = contentEle.style.width ? "" : "calc(100vw - 50px)";
  let ele = contentEle.parentElement.querySelector(".fullscr > span");
  if (ele.innerText == "fullscreen")
    ele.innerText = "close_fullscreen";
  else
    ele.innerText = "fullscreen";
}
function pointerMove(ev) {
  if (DRAGGING) {
    DRAGGING.parentElement.style.left = origLeft + ev.screenX - origX + "px";
    DRAGGING.parentElement.style.top = origTop + ev.screenY - origY + "px";
    ev.preventDefault();
    ev.stopPropagation();
  }
}
function pointerDown(ev) {
  DRAGGING = ev.currentTarget;
  ev.preventDefault();
  ev.stopPropagation();
  origX = ev.screenX;
  origY = ev.screenY;
  origLeft = toIntPx(window.getComputedStyle(DRAGGING.parentElement).left);
  origTop = toIntPx(window.getComputedStyle(DRAGGING.parentElement).top);
}
function toIntPx(val) {
  return Number(val.replace("px", ""));
}
function decodeStatus(status) {
  switch (status) {
    case 0:
      return "Network failure";
    case 200:
      return "Success";
    case 502:
      return "Internal Server Error";
    case 404:
      return "Not found";
    case 429:
      return "Too many requests";
    case 403:
      return "Forbidden";
    case 401:
      return "Unauthorised";
    case 400:
      return "Invalid request";
    case 413:
      return "Request too large";
    case 500:
    case 503:
      return "Internal Server Error";
  }
  return "Unknown error";
}
function send(params, callback, silentLoading = false, link = "/server") {
  let overlay2 = document.getElementById("overlayL");
  if (overlay2 && !silentLoading) {
    console.log("overlay active");
    overlay2.style.opacity = "1";
    overlay2.style.backgroundColor = "var(--system-overlay)";
    overlay2.style.pointerEvents = "auto";
    byId("overlayLContainer").style.opacity = 1;
    byId("overlayLContainer").style.pointerEvents = "auto";
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", link, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(JSON.parse(xhr.responseText));
    } else if (xhr.readyState == 4 && xhr.status != 200) {
      alertDialog("Received status code " + xhr.status + " (" + decodeStatus(xhr.status) + ") -- resend request?", () => {
        send(params, callback, silentLoading);
      }, true);
    }
    if (overlay2) {
      overlay2.style.opacity = "0";
      overlay2.style.pointerEvents = "none";
      overlay2.style.backgroundColor = "var(--system-grey2)";
      byId("overlayLContainer").style.opacity = 0;
      byId("overlayLContainer").style.pointerEvents = "none";
    } else
      closeAlert(-1);
  };
  console.log("about to send with params:", params);
  xhr.withCredentials = true;
  xhr.send(params);
}
function acceptCookies(link = "/server") {
  let cpm = document.getElementById("compliance");
  cpm.style.transition = "all 0.5s ease";
  cpm.style.opacity = "0";
  cpm.style.pointerEvents = "none";
  send(JSON.stringify({ action: "acceptCookies" }), (res) => {
  }, false, link);
}
function nonBlockingDialog(str, callback = () => {
}, text = "Continue", clr = "grn", ico = "arrow_forward") {
  let div = document.createElement("div");
  div.className = "ALERT_NONBLOCK";
  div.isOpen = true;
  div.innerHTML = `
  
  <div class="content">${str}</div>`;
  let draggable = document.createElement("div");
  draggable.className = "ALERT_DRAGGER";
  draggable.innerText = "ServiceAlert";
  draggable.innerHTML += `<div class="close" onclick="closeNBD(this.parentElement.parentElement, false)">
  <span class="red nooutline material-symbols-outlined">close</span>
  </div> 
  <div class="close fullscr" onclick="toggleNBDFullScr(this.parentElement.parentElement.querySelector('.content'), false)">
  <span class="blu nooutline material-symbols-outlined">fullscreen</span>
  </div>`;
  div.prepend(draggable);
  div.callback = callback;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.opacity = "1";
    div.style.pointerEvents = "auto";
    draggable.onpointerdown = pointerDown;
  }, 20);
  let button = document.createElement("button");
  div.appendChild(document.createElement("br"));
  if (text != "NOCONFIRM") {
    div.appendChild(button);
    button.outerHTML = `
    <button class="${clr} btn fsmed closeBtn" onclick="closeNBD(this.parentElement, true)">
    <span class='material-symbols-outlined'>${ico}</span>
    ${text}<div class="anim"></div>
    </button>`;
  }
  return div;
}
function closeNBD(ele, confirmQ) {
  ele.style.opacity = "0";
  ele.isOpen = false;
  ele.style.pointerEvents = "none";
  if (confirmQ)
    ele.callback(ele.querySelector(".content"));
}
let ALERTOPEN = false;
function alertDialog(str, callback = () => {
}, requiresConfirmation = false) {
  let newDialog = document.createElement("dialog");
  try {
    dialogPolyfill.registerDialog(newDialog);
  } catch (e) {
  }
  document.body.appendChild(newDialog);
  newDialog.className = "internal ALERT";
  newDialog.id = "internal_alerts";
  newDialog.style.textAlign = "center";
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
  setTimeout(() => {
    newDialog.style.opacity = "1";
    newDialog.style.top = "18px";
  }, 0);
  newDialog.setAttribute("type", requiresConfirmation + "");
  newDialog.callback = callback;
  let overlay2 = document.getElementById("overlayL");
  if (overlay2) {
    overlay2.style.opacity = "0";
  }
  let ele = document.getElementById("overlay");
  ele.innerHTML = "";
  let p = newDialog.querySelector("#alerttext_v2");
  if (!ele || !p) {
    console.log("ERROR: Alert dialogs not enabled in this page.");
    callback();
    return;
  }
  ele.style.opacity = "1";
  newDialog.style.pointerEvents = "auto";
  ALERTOPEN = true;
  p.innerText = str;
  p.innerHTML += "<br><br><p style='margin: 10px auto' class='gry nohover'>(Press ENTER or ESC)</p>";
  newDialog.querySelector("#cancelBtn").style.display = "none";
  if (requiresConfirmation) {
    newDialog.querySelector("#cancelBtn").style.display = "inline-block";
    console.log("Alert-type CANCELLABLE");
  } else
    console.log("Alert-type: STANDARD");
  newDialog.showModal();
}
function closeAlert(sel) {
  let ele = document.getElementById("overlay");
  let coll = document.getElementsByClassName("ALERT");
  let dialog = coll.item(coll.length - 1);
  if (!dialog)
    return;
  let overridecallback = false;
  if ((dialog.getAttribute("type") == "true" || dialog.getAttribute("type") == "2") && sel < 0)
    overridecallback = true;
  if (!ele) {
    console.log("Alert dialogs not enabled in this page");
    return;
  }
  dialog.style.top = "50vh";
  dialog.style.opacity = "0";
  dialog.style.pointerEvents = "none";
  if (!overridecallback) {
    try {
      dialog.callback();
    } catch (e) {
      alertDialog("Error while calling back: " + e, () => {
      });
    }
  }
  setTimeout(() => {
    dialog.close();
  }, 500);
  dialog.className = "internal CLOSEDALERT";
  dialog.id = "CLOSEDALERT";
  if (!dialogsActive()) {
    ALERTOPEN = false;
    ele.style.opacity = "0";
    ele.style.pointerEvents = "none";
  }
}
function keydown(e) {
  if (e.defaultPrevented) {
    console.log("prevent-defaulted");
    return;
  }
  if (byId("ftrNav") && e.key == "/" && e.target.nodeName != "TEXTAREA" && (e.target.nodeName != "INPUT" || e.target.type != "text" && e.target.type != "password")) {
    location.href = "#ftrNav";
    byId("ftrNav").focus();
    e.preventDefault();
    return;
  }
  if (ALERTOPEN && !DIALOGOPEN && (e.key == "Escape" || e.key == "Enter")) {
    e.preventDefault();
    if (e.key == "Escape") {
      console.log("RejectKey");
      closeAlert(-1);
    } else {
      console.log("ConfirmKey");
      closeAlert(1);
    }
  }
  if (!ALERTOPEN && !DIALOGOPEN && (e.target.nodeName == "INPUT" || e.target.nodeName == "TEXTAREA") && e.key == "Escape") {
    e.target.blur();
  }
}
function suffix(i) {
  if (i % 10 == 1 && i % 100 != 11)
    return "st";
  if (i % 10 == 2 && i % 100 != 12)
    return "nd";
  if (i % 10 == 3 && i % 100 != 13)
    return "rd";
  return "th";
}
function toTime(ms, inclMs = false) {
  let day = Math.floor(ms / 1e3 / 60 / 60 / 24);
  ms = ms % (1e3 * 60 * 60 * 24);
  let hr = Math.floor(ms / 1e3 / 60 / 60);
  ms = ms % (1e3 * 60 * 60);
  let min = Math.floor(ms / 1e3 / 60);
  ms = ms % (1e3 * 60);
  let sec = Math.floor(ms / 1e3);
  if (ms < 0)
    return "00:00:00";
  return (day > 0 ? day + "d " : "") + padWithZero(hr) + ":" + padWithZero(min) + ":" + padWithZero(sec) + (inclMs ? "." + padWithThreeZeroes(ms % 1e3) : "");
}
function padWithThreeZeroes(n) {
  if (n < 10)
    return "00" + n;
  if (n < 100)
    return "0" + n;
  return n;
}
function padWithZero(n) {
  return n < 10 ? "0" + n : n;
}
let overlay;
const tips = [
  "Press <kbd>/</kbd> to access the navigation menu.",
  "\u{1F9C0}",
  "Have you tried turning it off and on again?",
  "Use <kbd>space</kbd> to start/stop timer/stopwatch.",
  "Press <kbd>E</kbd> to edit the timer.",
  "Press <kbd>R</kbd> to reset the timer/stopwatch.",
  "Try <a href='/clickit'>ClickIt</a> today!",
  "Your insanity will pay off. Eventually.",
  "Don't be a not-water-needer. You won't last a week.",
  "<i>Don't</i> eat the void orb.",
  "Don't worry! It's fine... We can fix it!",
  "Have you tried placebo-ing yourself?",
  "If you fall down and can't get up, fall upwards.",
  "Tofu is solidified bean water. On that note, try Humanity(r) Bean Water today!",
  "The void orb watches over you."
];
addEventListener("DOMContentLoaded", function() {
  overlay = document.createElement("div");
  overlay.className = "overlayLoader";
  overlay.id = "overlayL";
  overlay.style.backgroundColor = "var(--system-overlay)";
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
  overlay.innerHTML = `<div id="overlayLContainer" style='pointer-events:none;'>
  <p class="fslg grn nohover">Loading.</p>
  <span class="material-symbols-outlined loader">sync</span>
  <hr class="rounded">
  <p class="fsmed gry nohover"><b>DailyWisdom:</b> ${tips[Math.floor(Math.random() * tips.length)]}</p>
  </div>`;
  document.body.appendChild(overlay);
  let metatags = document.createElement("meta");
  metatags.content = "width=device-width, initial-scale=1.0, min-scale=1.0";
  metatags.name = "viewport";
  document.head.appendChild(metatags);
});
let DIALOGOPEN = false;
function closeDialog(thing, name = "dialog") {
  let div = document.getElementById(name);
  div.style.top = "50%";
  div.style.opacity = "0";
  div.style.pointerEvents = "none";
  DIALOGOPEN = false;
  let ele = byId("overlay");
  if (!dialogsActive()) {
    ALERTOPEN = false;
    ele.style.opacity = "0";
    ele.style.pointerEvents = "none";
  }
  thing();
}
function dialogsActive() {
  return document.getElementsByClassName("ALERT").length > 0 || DIALOGOPEN;
}
function openDialog(name = "dialog") {
  let div = document.getElementById(name);
  div.style.top = "0px";
  div.style.opacity = "1";
  div.style.pointerEvents = "auto";
  DIALOGOPEN = true;
  document.getElementById("overlay").style.opacity = "1";
}
function mouseOver(e) {
  let ele = e.target;
  let text = ele.innerHTML.replaceAll(/<.*((>.*<\/.*>)|(\/>))/gmiu, "").replaceAll("\n", "").trim();
  if (typeof ele.className != "string")
    return;
  if (ele.className.match(/(\W|^)btn(\W|$)/) && !ele.className.match(/(\W|^)notooltip(\W|$)/)) {
    let tooltip = ele.children.namedItem("TOOLTIP");
    if (!tooltip) {
      tooltip = document.createElement("span");
      tooltip.innerText = text;
      tooltip.id = "TOOLTIP";
      tooltip.className = "TOOLTIP override";
      ele.appendChild(tooltip);
      ele.style.animation = "none";
      ele.offsetHeight;
      ele.style.animation = null;
    }
  }
}
function resetExpiry(res) {
  if (res.data.expiry < Date.now() || res.data.expiry - Date.now() > 9e60) {
    return;
  }
  SESSIONTIMEOUT = setTimeout(() => {
    alertDialog("Your session has expired", () => {
      location.reload();
    });
  }, res.data.expiry - Date.now());
  SESSIONTIMEOUT2 = setTimeout(() => {
    alertDialog("Your session is expiring in one minute, extend session? ", () => {
      send(JSON.stringify({ action: "extendSession" }), (res2) => {
        alertDialog("Session extended, expires in " + toTime(res2.data.expiry - Date.now()), () => {
        });
        clearTimeout(SESSIONTIMEOUT);
        clearTimeout(SESSIONTIMEOUT2);
        resetExpiry(res2);
      });
    }, true);
  }, Math.max(res.data.expiry - Date.now() - 6e4, 1e3));
}
function whichTransitionEvent() {
  var t;
  var el = document.createElement("fakeelement");
  var transitions = {
    "transition": "transitionend",
    "OTransition": "oTransitionEnd",
    "MozTransition": "transitionend",
    "WebkitTransition": "webkitTransitionEnd"
  };
  for (let t2 in transitions) {
    if (el.style[t2] !== void 0) {
      return transitions[t2];
    }
  }
}
function ephemeralDialog(text) {
  let dialog = document.createElement("div");
  dialog.classList.add("ephemeral");
  dialog.innerHTML = text;
  dialog.style.animation = "appear 0.7s forwards";
  byId("ephemerals").prepend(dialog);
  setTimeout(() => {
    closeEphemeral(dialog);
  }, 2e4);
  dialog.onclick = () => {
    closeEphemeral(dialog);
  };
}
function closeEphemeral(dialog) {
  dialog.style.animation = "disappear 0.5s forwards";
}
let loginDialog = null;
function login_v2(ev, signup = false) {
  ev.preventDefault();
  if (loginDialog && loginDialog.isOpen)
    return;
  loginDialog = nonBlockingDialog(`<iframe class="loginiframe" src="/minimal${signup ? "Signup" : "Login"}"></iframe>`, () => {
  }, "NOCONFIRM");
  toggleNBDFullScr(loginDialog.querySelector(".content"));
}
function closeLogin() {
  closeNBD(loginDialog);
}
function globalReload() {
  byId("overlay").remove();
  byId("compliance").remove();
  byId("footer").remove();
  let uSidebar = byClass("sidebar-unstable");
  if (uSidebar)
    uSidebar.remove();
  byId("ephemerals").remove();
  globalOnload(onloadCallback);
}
function logout_v2(event) {
  event.preventDefault();
  send(JSON.stringify({ action: "logout" }), (res) => {
    ephemeralDialog("Successfully logged out!");
    location.reload();
  });
}
//# sourceMappingURL=utils.js.map
