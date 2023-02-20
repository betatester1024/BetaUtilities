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
  loadFile("https://betautils.betatester1024.repl.co/status/status_raw.html").then((data) => {
    let statusele = document.getElementById("statStr");
    if (data)
      statusele.innerHTML = data;
    if (!data || data && data.match("ERROR")) {
      statusele.innerHTML = "ServiceFAIL<br>";
      statusele.style.color = "#ee0000";
      let thing = document.getElementById("h_one");
      thing.innerHTML = "ERROR";
      thing.style.color = "#ee0000";
      thing = document.getElementById("statush1");
      thing.style.color = "#ee0000";
      let mainD = document.getElementById("before");
      mainD.className = "modified";
    } else {
      let thing = document.getElementById("h_one");
      thing.innerHTML = "ONLINE";
      thing.style.color = "#00c300";
    }
  });
  let match = document.URL.match("\\?REFRESH(=)?([0-9]+)");
  if (match) {
    TIMEOUT = setTimeout(() => {
      location.reload();
    }, Number(match[2]) ? Number(match[2]) : 1e4);
    let ele = document.getElementById("disableDiv");
    ele.hidden = false;
    ele.style.display = "inline-block";
  } else {
    let ele = document.getElementById("enableDiv");
    ele.hidden = false;
    ele.style.display = "inline-block";
  }
  let nsc = document.getElementById("noscript");
  nsc.hidden = true;
}
let t = null;
function toggleHidden() {
  let ele = document.getElementById("c1");
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
//# sourceMappingURL=frontend.js.map
