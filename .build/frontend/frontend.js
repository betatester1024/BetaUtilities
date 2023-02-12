"use strict";
let TIMEOUT;
function reset() {
  clearTimeout(TIMEOUT);
}
function restart() {
  onLoad();
}
async function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status == 200) {
    result = xmlhttp.responseText;
  }
  return result;
}
function onLoad() {
  loadFile("./status.html").then((data) => {
    let statusele = document.getElementById("statStr");
    if (data)
      statusele.innerHTML = data;
    if (!data || data && data.match("ERROR")) {
      statusele.innerHTML = "<br><br>";
      let thing = document.getElementById("h_one");
      thing.innerHTML = "ERROR";
      thing.style.color = "#ee0000";
      let mainD = document.getElementById("mainDiv");
      mainD.className = "modified";
    }
  });
  let match = document.URL.match("\\?REFRESH(=)?([0-9]+)");
  if (match) {
    TIMEOUT = setTimeout(() => {
      location.reload();
    }, Number(match[2]) ? Number(match[2]) : 1e4);
    let ele = document.getElementById("disableBtn");
    ele.hidden = false;
    ele.style.display = "inline";
  } else {
    let ele = document.getElementById("enableBtn");
    ele.hidden = false;
    ele.style.display = "inline";
  }
  let nsc = document.getElementById("noscript");
  nsc.hidden = true;
}
let t = null;
function toggleHidden() {
  let ele = document.getElementById("c+1");
  if (t)
    clearTimeout(t);
  if (!ele.hidden) {
    t = setTimeout(() => {
      if (!ele.hidden && ele.style.height == "1vh")
        ele.hidden = true;
    }, 500);
  } else
    ele.hidden = false;
  ele.style.height = ele.style.height == "50vh" ? "1vh" : "50vh";
}
function validateLogin() {
  let user = document.getElementById("user");
  let pass = document.getElementById("pass");
  var params = "user=" + user.value + "&pass=" + pass.value;
  pass.value = "CLEARED FOR SECURITY PURPOSES";
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "login", true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log(xhr.responseText);
    }
  };
  xhr.send(params);
}
//# sourceMappingURL=frontend.js.map
