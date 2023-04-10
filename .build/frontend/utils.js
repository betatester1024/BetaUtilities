"use strict";
function globalOnload() {
  document.onkeydown = keydown;
  let maincontent = document.getElementsByClassName("main_content").item(0);
  let ftr = document.createElement("footer");
  maincontent.appendChild(ftr);
  let ele = document.createElement("p");
  ele.innerHTML = `<a href='/login'>Login</a> | <a href='/signup'>Sign-up</a> | <a href='/status'>Status</a> | BetaOS Systems | 2023`;
  ftr.appendChild(ele);
  let ele2 = document.getElementById("overlay");
  if (ele2)
    ele2.innerHTML = `
  <div class="internal">
        <p class="fsmed" id="alerttext">Hey, some text here</p>
        <button class="btn szHalf" onclick="closeAlert()" style="display: inline-block">
          <span class="alertlbl">Continue</span>
          <span class="material-symbols-outlined">arrow_forward_ios</span>
          <div class="anim"></div>
        </button>
        <button class="btn szHalf red" id="cancelBtn" style="display: none" onclick="closeAlert(true)">
          <span class="alertlbl">Cancel</span>
          <span class="material-symbols-outlined">cancel</span>
          <div class="anim"></div>
        </button>
      </div>`;
  else
    console.log("Alert dialogs disabled on this page");
}
function send(params, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "server", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
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
let failureTimeout;
let dialogQ = false;
let cbk = () => {
};
let BLOCKCALLBACK = false;
function alertDialog(str, callback, button = -1, failedReq = "") {
  let ele = document.getElementById("overlay");
  let p = document.getElementById("alerttext");
  if (!ele || !p) {
    console.log("ERROR: Alert dialogs not enabled in this page.");
    return;
  }
  ele.style.top = "0vh";
  dialogQ = true;
  cbk = callback;
  p.innerText = str;
  document.getElementById("cancelBtn").style.display = "none";
  if (button == 1) {
    p.innerHTML += `<button class='btn szThird fssml' onclick='location.reload()'>Refresh?
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
  ele.style.top = "500vh";
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
//# sourceMappingURL=utils.js.map
