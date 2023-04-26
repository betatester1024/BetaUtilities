"use strict";
function globalOnload(cbk2) {
  document.onkeydown = keydown;
  send(
    JSON.stringify({ action: "userRequest" }),
    (res) => {
      document.documentElement.className = res.data.darkQ ? "dark" : "";
      let maincontent = document.getElementsByClassName("main_content").item(0);
      let ftr = document.createElement("footer");
      maincontent.appendChild(ftr);
      let ele = document.createElement("p");
      ele.id = "footer";
      if (res.status != "SUCCESS")
        ele.innerHTML = `<a href='/login'>Login</a> | 
                      <a href='/signup'>Sign-up</a> | 
                      <a href='/status'>Status</a> | 
                      BetaOS Systems V2, 2023`;
      else {
        ele.innerHTML = `Logged in as <kbd>${res.data.user}</kbd> |
                      <a href='/logout'>Logout</a> | 
                      <a href='/config'>Account</a> | 
                      <a href='/status'>Status</a> | 
                      <a href='javascript:send(JSON.stringify({action:"toggleTheme"}), (res)=>{if (res.status != "SUCCESS") alertDialog("Error: "+res.data.error, ()=>{});else {alertDialog("Theme updated!", ()=>{location.reload()}); }})'>Theme</a> |
                      BetaOS Systems V2, 2023`;
      }
      ftr.appendChild(ele);
      send(
        JSON.stringify({ action: "visits" }),
        (res2) => {
          overlay.style.backgroundColor = "var(--system-grey2)";
          if (res2.status != "SUCCESS") {
            alertDialog("Database connection failure. Please contact BetaOS.", () => {
            });
            ele.innerHTML = `<kbd class="red nohover">Database connection failure.</kbd>`;
          }
          document.getElementById("footer").innerHTML += " | <kbd>" + res2.data.data + "</kbd>";
          send(JSON.stringify({ action: "cookieRequest" }), (res3) => {
            if (res3.data.toString() == "false") {
              console.log("thing");
              document.getElementById("compliance").style.bottom = "0px";
            }
            if (cbk2)
              cbk2();
          });
        }
      );
    },
    true
  );
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
  let ele2 = document.getElementById("overlay");
  if (ele2)
    ele2.innerHTML = `
  <div class="internal">
        <p class="fsmed" id="alerttext">Error: AlertDialog configured incorrectly. Please contact BetaOS.</p>
        <button class="btn szHalf override" onclick="closeAlert()" style="display: inline-block">
          <span class="alertlbl">Continue</span>
          <span class="material-symbols-outlined">arrow_forward_ios</span>
          <div class="anim"></div>
        </button>
        <button class="btn szHalf red override" id="cancelBtn" style="display: none" onclick="closeAlert(true)">
          <span class="alertlbl">Cancel</span>
          <span class="material-symbols-outlined">cancel</span>
          <div class="anim"></div>
        </button>
      </div>`;
  else
    console.log("Alert dialogs disabled on this page");
}
function send(params, callback, onLoadQ = false) {
  let overlay2 = document.getElementById("overlayL");
  if (overlay2 && !onLoadQ) {
    overlay2.style.opacity = "1";
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/server", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (overlay2) {
        overlay2.style.opacity = "0";
      }
      if (failureTimeout)
        clearTimeout(failureTimeout);
      else
        closeAlert(true);
      failureTimeout = null;
      callback(JSON.parse(xhr.responseText));
    }
  };
  console.log(params);
  xhr.send(params);
  if (failureTimeout)
    clearTimeout(failureTimeout);
  failureTimeout = setTimeout(() => alertDialog(`This is taking longer than expected.`, () => {
  }, 1, params), 1e3);
}
function acceptCookies() {
  send(JSON.stringify({ action: "acceptCookies" }), (res) => {
  });
  document.getElementById("compliance").style.bottom = "-200vh";
}
let failureTimeout;
let TIME;
let dialogQ = false;
let cbk = () => {
};
let BLOCKCALLBACK = false;
function alertDialog(str, callback, button = -1, failedReq = "") {
  if (TIME)
    clearTimeout(TIME);
  TIME = null;
  console.log("Timeout cleared");
  let overlay2 = document.getElementById("overlayL");
  if (overlay2) {
    overlay2.style.left = "200vh";
    overlay2.style.opacity = "0";
  }
  let ele = document.getElementById("overlay");
  let p = document.getElementById("alerttext");
  if (!ele || !p) {
    console.log("ERROR: Alert dialogs not enabled in this page.");
    callback();
    return;
  }
  ele.style.top = "0vh";
  dialogQ = true;
  cbk = callback;
  p.innerText = str;
  document.getElementById("cancelBtn").style.display = "none";
  if (button == 1) {
    p.innerHTML += `<button class='btn szThird fssml' id="refresh" onclick='location.reload()'>
    <span class="material-symbols-outlined">history</span> Refresh?
    <div class="anim"></div></button>`;
    console.log("Failed request: " + failedReq);
    BLOCKCALLBACK = true;
  } else if (button == 2) {
    document.getElementById("cancelBtn").style.display = "inline-block";
    console.log("Confirm speedbump");
    BLOCKCALLBACK = true;
  }
  if (failureTimeout)
    clearTimeout(failureTimeout);
  failureTimeout = null;
}
function closeAlert(overrideCallback = false) {
  let ele = document.getElementById("overlay");
  if (!ele) {
    console.log("Alert dialogs not enabled in this page");
    return;
  }
  ele.style.top = "200vh";
  dialogQ = false;
  if (cbk && !overrideCallback) {
    console.log("calling back");
    cbk();
  }
  BLOCKCALLBACK = false;
}
function keydown(e) {
  if (dialogQ) {
    e.preventDefault();
    if (BLOCKCALLBACK)
      closeAlert(true);
    else {
      console.log("KEYDOWNCLOSEDIALOG");
      closeAlert();
    }
  }
}
function toTime(ms) {
  let day = Math.floor(ms / 1e3 / 60 / 60 / 24);
  ms = ms % (1e3 * 60 * 60 * 24);
  let hr = Math.floor(ms / 1e3 / 60 / 60);
  ms = ms % (1e3 * 60 * 60);
  let min = Math.floor(ms / 1e3 / 60);
  ms = ms % (1e3 * 60);
  let sec = Math.floor(ms / 1e3);
  if (ms < 0)
    return "00:00:00";
  return (day > 0 ? day + "d " : "") + padWithZero(hr) + ":" + padWithZero(min) + ":" + padWithZero(sec);
}
function padWithZero(n) {
  return n < 10 ? "0" + n : n;
}
let overlay;
addEventListener("DOMContentLoaded", function() {
  overlay = document.createElement("div");
  overlay.className = "overlayLoader";
  overlay.id = "overlayL";
  overlay.style.left = "0vh";
  overlay.style.backgroundColor = "var(--system-bg)";
  overlay.style.opacity = "1";
  overlay.innerHTML = `<span class="material-symbols-outlined loader">sync</span>
  <p class="loadp fslg grn nohover">Loading.</p>`;
  document.body.appendChild(overlay);
});
//# sourceMappingURL=utils.js.map
