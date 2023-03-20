"use strict";
function globalOnload() {
  document.onkeydown = keydown;
}
function send(params, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "server", true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(JSON.parse(xhr.responseText));
    }
  };
  xhr.send(params);
}
let dialogQ = false;
let cbk = () => {
};
function alertDialog(str, callback) {
  let ele = document.getElementById("overlay");
  let p = document.getElementById("alerttext");
  ele.style.top = "0vh";
  dialogQ = true;
  cbk = callback;
  p.innerText = str;
}
function closeAlert() {
  let ele = document.getElementById("overlay");
  ele.style.top = "100vh";
  dialogQ = false;
  cbk();
}
function keydown() {
  if (dialogQ) {
    console.log("CLOSED DIALOG");
    closeAlert();
  }
}
//# sourceMappingURL=utils.js.map
