"use strict";
function onLoad() {
}
function newUser(e, accessclass) {
  let id = e.target.id;
  console.log(id);
  if (id != "loginBTN")
    return;
  validateLogin("add", accessclass);
}
function validateLogin(action = "login", access) {
  let user = document.getElementById("userINP");
  let pass = document.getElementById("passINP");
  if (action != "login" && action != "add" || user.value.match("^[a-zA-Z0-9_]+$") && pass.value.length !== 0) {
    let sessionID = Math.random();
    let match = document.cookie.match("__Secure-session=([0-9.]+)");
    console.log(match);
    let params;
    if (action != "logout")
      params = "user=" + user.value + "&pass=" + pass.value + "&action=" + action + "&access=" + access + "&token=" + (match ? match[1] : sessionID);
    else
      params = "user=&pass=&action=logout&token=" + (match ? match[1] : sessionID);
    if (pass)
      pass.value = "";
    console.log("SENDING " + params);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "login", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (action == "server")
          return;
        let res = xhr.responseText;
        res = JSON.parse(res);
        let ele2 = document.getElementById("overlay");
        if (ele2)
          ele2.className = "";
        ele2 = document.getElementById("h1");
        if (ele2)
          ele2.className = "beforeoverload";
        if (action != "login") {
          if (res == "ACCESS") {
            alertDialog("Error: You do not have permissions!", () => {
            });
          } else if (res == "EXPIRE" || res == "NOACTIVE")
            alertDialog("Error: Your login session has expired!", () => {
              validateLogin("logout", "");
            });
          else if (action == "logout") {
            document.cookie = "__Secure-session=";
            alertDialog("You've been logged out", () => {
              window.open("https://betautils.betatester1024.repl.co", "_self");
            });
          } else
            alertDialog("Action complete!", () => {
            });
          return;
        }
        if (res == "2") {
          alertDialog("Welcome, " + user.value + "! | Administrative access granted.", () => {
            window.open("https://betautils.betatester1024.repl.co/admin", "_self");
          });
          if (!match && action == "login")
            document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure";
        } else if (res == "1") {
          alertDialog("Welcome, " + user.value + "!", () => {
            window.open("https://betautils.betatester1024.repl.co", "_self");
          });
          let sessionID2 = Math.random();
          if (!match && action == "login")
            document.cookie = "__Secure-session=" + sessionID2 + "; SameSite=None; Secure";
        } else {
          alertDialog("Error: Invalid login credentials", () => {
            window.open("https://betautils.betatester1024.repl.co/login", "_self");
          });
        }
      }
    };
    xhr.send(params);
    let ele = document.getElementById("overlay");
    if (ele)
      ele.className += "active";
    ele = document.getElementById("h1");
    if (ele)
      ele.className = "overload";
  }
}
function logout() {
  validateLogin("logout", "");
}
let dialog = false;
let cbk;
function alertDialog(txt, callback) {
  let div = document.getElementById("alert");
  div.style.animationName = "incoming";
  div.style.top = "0px";
  let ele = document.getElementById("alerttxt");
  ele.innerHTML = txt;
  dialog = true;
  cbk = callback;
}
function clearalert() {
  if (dialog && cbk) {
    let div = document.getElementById("alert");
    div.style.animationName = "outgoing";
    div.style.top = "100vh";
    dialog = false;
    cbk();
    cbk = null;
  }
}
//# sourceMappingURL=login.js.map
