"use strict";
function onLoad() {
  let match = document.cookie.match("__Secure-session=[0-9.]+");
  console.log("Current session: " + match);
  if (!match && document.URL.match("\\/admin") && !document.URL.match("?redirect=(.*)\\/admin")) {
    alertDialog("You're not logged in!", () => {
      window.open("/login?redirect=" + document.URL, "_self");
    });
  }
}
let CURRUSER = "";
let CURRACCNAME = "";
let CURRPERMS = "";
let LOADEDQ = false;
let TODOCT = 0;
function newUser(e, accessclass) {
  let id = e.target.id;
  if (id != "loginBTN")
    return;
  validateLogin("add", escapeHtml(accessclass));
}
function deleteAllCookies() {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;Secure;";
  }
}
const escapeHtml = (unsafe) => {
  return unsafe.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
};
function sendMsg() {
  let inp = document.getElementById("textINP");
  let msg = inp.value;
  inp.value = "";
  validateLogin("sendMsg", msg);
}
function validateLogin(action = "login", extData) {
  let user = document.getElementById("userINP");
  let pass = document.getElementById("passINP");
  let confirm = document.getElementById("passINPCONF");
  let CMD = document.getElementById("command");
  if (action == "acquireTodo" && extData == "") {
    if (!document.cookie.match("__Secure-session=[0-9.]+"))
      window.open("/signup?redirect=todo", "_self");
    validateLogin("acquireTodo", "OK");
    return;
  }
  let match2 = action.match("updateTODO([0-9]+)");
  let match3 = action.match("completeTODO([0-9]+)");
  let match4 = action.match("deleteTODO([0-9]+)");
  let inp;
  if (match2 || match3) {
    inp = document.getElementById("todo" + (match2 ? match2[1] : match3[1]));
    if (match2) {
      inp.style.cursor = "pointer";
      inp.readOnly = true;
      inp.style.border = "2px solid #eee";
    }
  }
  if (action == "refresh")
    extData = document.URL.match("\\?room=([0-9a-zA-Z\\-_]{1,20})$")[1];
  if (action != "login" && action != "add" && action != "signup" || user.value.match("^[a-zA-Z0-9_]+$") && pass.value.length !== 0) {
    if (confirm && (action == "add" || action == "signup") && confirm.value != pass.value) {
      alertDialog("Error: Your passwords do not match", () => {
        location.reload();
      });
      return;
    }
    if (confirm)
      confirm.value = "";
    let arr = new BigUint64Array(1);
    let match = document.cookie.match("__Secure-session=([0-9.]+)");
    let sessionID = match ? match[1] : window.crypto.getRandomValues(arr);
    let renickQ = false;
    let params;
    if (action != "logout" && action != "CMD" && action != "sendMsg" && action != "userReq")
      params = "user=" + encodeURIComponent(user ? user.value : "") + "&pass=" + encodeURIComponent(pass ? pass.value : "") + "&action=" + action + "&access=" + extData + "&token=" + sessionID;
    else if (action == "CMD") {
      params = "user=" + encodeURIComponent(CMD.value) + "&action=CMD&token=" + sessionID;
      CMD.value = "";
    } else if (action == "sendMsg") {
      params = "token=" + sessionID + "&action=sendMsg&user=" + encodeURIComponent(extData) + "&access=" + document.URL.match("\\?room=([0-9a-zA-Z\\-_]{1,20})$")[1];
      ;
      let match5 = extData.match("!renick @([a-zA-Z_0-9]+)");
      if (match5) {
        params = "token=" + sessionID + "&action=renick&user=" + encodeURIComponent(match5[1]) + "&access=" + document.URL.match("\\?room=([0-9a-zA-Z\\-_]{1,20})$")[1];
        renickQ = true;
      }
    } else
      params = "user=&pass=&action=" + action + "&token=" + sessionID;
    let newRoomInp = document.getElementById("newroominp");
    if (action == "newRoom") {
      params = "user=" + newRoomInp.value + "&action=newRoom&token=" + sessionID;
      newRoomInp.value = "";
    }
    if (action == "acquireTodo" && extData == "OK") {
      params = "action=acquireTodo&token=" + sessionID;
    }
    if (match2 || match3)
      params = "user=" + encodeURIComponent(inp.value) + "&action=" + action + "&token=" + sessionID;
    if (action == "addTODO")
      params = "user=&action=addTODO&token=" + sessionID;
    if (pass)
      pass.value = "";
    console.log("SENDING " + params);
    var xhr = new XMLHttpRequest();
    let m = document.URL.match("redirect=(.*)");
    let redirectTo = m ? m[1] : "/";
    xhr.open("POST", "login", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (action == "server")
          return;
        let res = xhr.responseText;
        res = JSON.parse(res);
        let ele = document.getElementById("overlay");
        if (ele)
          ele.className = "";
        ele = document.getElementById("h1");
        if (ele)
          ele.className = "beforeoverload";
        if (action != "login") {
          if (action == "newRoom") {
            alertDialog(
              "Room creation: " + (res == "NOACTIVE" || res == "ACCESS" ? "Access denied" : res),
              () => {
                validateLogin("ROOMLISTING", "");
              }
            );
            return;
          }
          if (action != "userReq" && (res == "ERROR" || res == "NOACTIVE" || res == "ACCESS")) {
            if (document.URL.match("betatester1024\\.repl\\.co/?$")) {
              validateLogin("logout", document.URL);
            } else if (res == "ERROR")
              alertDialog("Unknown error occurred.", () => {
                location.reload();
              });
            else if (res == "NOACTIVE")
              alertDialog("You are not logged in.", () => {
                validateLogin("logout", document.URL);
              });
            else
              alertDialog("Access denied!", () => {
                window.open("/login?redirect=" + document.URL), "_self";
              });
            return;
          }
          if (action == "ROOMLISTING") {
            res = res;
            let mainDiv = document.getElementById("innerDiv");
            mainDiv.innerHTML = "";
            for (let i = 0; i < res.length; i++) {
              let match5 = res[i].match("OnlineSUPPORT\\|(.*)");
              if (match5)
                mainDiv.innerHTML += `<button class="unsetWidth" onclick="window.open('/support?room=${match5[1]}', '_self')"><kbd>${match5[1]}</kbd><hr class="btnHr"></hr></button>`;
            }
            return;
          }
          if (action == "acquireTodo") {
            let todoDiv = document.getElementById("todo");
            todoDiv.innerHTML = "";
            let todoList = res;
            for (let i = 0; i < todoList.length; i++) {
              let update = `<p> 
          <span class="material-symbols-outlined" onclick="complete(${i})">task_alt</span>
          <input class="todo" id="todo${i}" value="${todoList[i].replaceAll('"', "&quot;")}" onchange="modify(-1); validateLogin('updateTODO${i}', '')" readonly onclick="modify(${i})"/>
          
          <span id="span${i}" class="material-symbols-outlined" onclick="modify(${i})">edit</span>
          <span class="material-symbols-outlined" onclick="del(${i})">delete</span>
        </p>`;
              todoDiv.innerHTML += update;
              TODOCT = res.length;
            }
            modify();
            resetAlertDiv();
            return;
          }
          if (renickQ && res != "ERROR") {
            CURRUSER = res;
            alertDialog("Renicked successfully to @" + CURRUSER, () => {
            });
          } else if (renickQ) {
            alertDialog("Error in re-nicking!", () => {
            });
          }
          if (action == "sendMsg") {
            return;
          }
          if (action == "userReq") {
            let ele2 = document.getElementById("header");
            CURRUSER = res.split(" ")[0];
            CURRACCNAME = res.split(" ")[0];
            CURRPERMS = res.split(" ")[1];
            if (ele2) {
              if (res != "ERROR" && res != "NOACTIVE" && res != "ACCESS")
                ele2.innerHTML = "Welcome, " + res.split(" ")[0] + "!";
              else
                ele2.innerHTML = "Welcome to BetaOS Services!";
            } else {
              ele2 = document.getElementById("newRoom");
              if (!ele2) {
                switch (res.split(" ")[1]) {
                  case "1":
                    document.getElementById("sel").hidden = true;
                    document.getElementById("loginDIV").hidden = true;
                    document.getElementById("userLoginBTN").hidden = false;
                    let userinp = document.getElementById("userINP");
                    userinp.value = res.split(" ")[0];
                    document.getElementById("userDiv").hidden = true;
                    document.getElementById("danger").hidden = true;
                    break;
                }
              } else {
                ele2.hidden = !CURRPERMS || Number(CURRPERMS) < 2;
              }
            }
            return;
          }
          if (action == "delete" && res != "NOACTIVE" && res != "EXPIRE" && res != "ACCESS" && res != "ERROR") {
            alertDialog("Deleted user:" + res, CURRPERMS == "1" ? () => {
              window.open("/", "_self");
            } : () => {
            });
            if (CURRACCNAME == res)
              validateLogin("logout", "");
            return;
          }
          if (action == "refresh" || action == "refresh_log") {
            if (res == "ACCESS" || res == "EXPIRE" || res == "NOACTIVE" || res == "ERROR") {
              location.reload();
            }
            ele = document.getElementById("msgArea");
            if (action == "refresh_log")
              ele = ele;
            let scrDistOKQ = Math.abs(ele.scrollTop - ele.scrollHeight) < 1e3;
            updateTextArea(res, action == "refresh_log");
            if (!LOADEDQ || extData == "send" || scrDistOKQ) {
              ele.scrollTop = ele.scrollHeight;
              LOADEDQ = true;
            }
            return;
          }
          if (res == "ACCESS") {
            alertDialog("Error: You do not have permissions!", () => {
            });
          } else if (res == "EXPIRE")
            alertDialog("Error: Your login session has expired!", () => {
              validateLogin("logout", "");
            });
          else if (res == "NOACTIVE") {
            alertDialog("Error: You are not logged in!", () => {
              validateLogin("logout", document.URL);
            });
          } else if (action == "logout") {
            document.cookie = "__Secure-session=; Secure;";
            if (extData)
              window.open("/login?redirect=" + extData, "_self");
            alertDialog("You've been logged out", () => {
              window.open("/login?redirect=/", "_self");
            });
          } else if (res == "ERROR") {
            alertDialog("Unknown error!", () => {
            });
          } else if (res == "TAKEN") {
            alertDialog("This username is already taken!", () => {
            });
          } else {
            if (match2 || match3 || match4 || action == "addTODO") {
              if (match3 || match4)
                alertDialog(match3 ? "Task complete!" : "Task deleted!", () => {
                  validateLogin("acquireTodo", "OK");
                });
              validateLogin("acquireTodo", "OK");
              return;
            }
            alertDialog("Action complete!", () => {
              if (action == "signup")
                window.open(redirectTo, "_self");
            });
            if (!match && action == "signup")
              document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
          }
          return;
        }
        if (res == "2") {
          alertDialog("Welcome, " + user.value + "! | Administrative access granted.", () => {
            window.open(redirectTo, "_self");
          });
          CURRUSER = user.value;
          CURRACCNAME = user.value;
          CURRPERMS = "2";
          deleteAllCookies();
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;`;
          document.cookie = `__Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          document.cookie = `__Secure-session=${sessionID}; SameSite=None; Secure;`;
          if (!match && action == "login")
            document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        } else if (res == "3") {
          CURRUSER = user.value;
          CURRACCNAME = user.value;
          CURRPERMS = "3";
          deleteAllCookies();
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;`;
          document.cookie = `__Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          document.cookie = `__Secure-session=${sessionID}; SameSite=None; Secure;`;
          alertDialog("Welcome, " + user.value + "! | Super-administrative access granted.", () => {
            window.open(redirectTo, "_self");
          });
          if (!match && action == "login")
            document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        } else if (res == "1") {
          CURRUSER = user.value;
          CURRACCNAME = user.value;
          CURRPERMS = "1";
          deleteAllCookies();
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;`;
          document.cookie = `__Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          document.cookie = `__Secure-session=${sessionID}; SameSite=None; Secure;`;
          alertDialog("Welcome, " + user.value + "!", () => {
            window.open(redirectTo, "_self");
          });
          if (!match && action == "login")
            document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        } else {
          alertDialog("Error: Invalid login credentials", () => {
            location.reload();
          });
        }
      }
    };
    xhr.send(params);
    if (action != "sendMsg" && action != "refresh" && action != "refreshLog") {
      let ele = document.getElementById("overlay");
      if (ele)
        ele.className += "active";
      ele = document.getElementById("h1");
      if (ele)
        ele.hidden = false;
      if (ele)
        ele.className = "overload";
    }
  } else if (!user.value.match("^[a-zA-Z0-9_]+$")) {
    alertDialog("Please enter a username with only alphanumeric characters, or underscores.", () => {
    });
  } else if (pass.value.length == 0) {
  }
}
function logout() {
  validateLogin("logout", "");
  CURRUSER = "";
  CURRACCNAME = "";
}
let dialog = false;
let cbk;
function alertDialog(txt, callback) {
  let div = document.getElementById("alert");
  div.style.animationName = "incoming";
  div.style.top = "0px";
  let ele = document.getElementById("alerttxt");
  ele.innerText = txt;
  dialog = true;
  cbk = callback;
  div.hidden = false;
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
function updateTextArea(msgs, textAreaQ) {
  let ele = document.getElementById("msgArea");
  let scrollHt = ele.scrollTop;
  if (textAreaQ)
    ele.innerText = msgs.replaceAll("<br>", "\n");
  else
    ele.innerHTML = msgs;
  ele.scrollTop = scrollHt;
}
let MODIFYN = -1;
function modify(n = MODIFYN) {
  MODIFYN = n;
  for (let i = 0; i < TODOCT; i++) {
    let inp = document.getElementById("todo" + i);
    let spn = document.getElementById("span" + i);
    if (i == n && inp && spn) {
      inp.style.cursor = "text";
      inp.readOnly = false;
      inp.style.border = "2px solid #0a84ff";
      inp.focus({ preventScroll: true });
      spn.onclick = () => {
        modify(-1);
        validateLogin("updateTODO" + i, "");
      };
    } else if (inp && spn) {
      inp.style.cursor = "pointer";
      inp.readOnly = true;
      inp.style.border = "2px solid #eee";
      inp.blur();
      spn.onclick = () => {
        modify(i);
      };
    }
  }
}
function complete(n) {
  validateLogin("completeTODO" + n, "");
}
function add() {
  validateLogin("addTODO", "");
  MODIFYN = TODOCT;
}
function del(n) {
  validateLogin("deleteTODO" + n, "");
}
function resetAlertDiv() {
  let div = document.getElementById("alert");
  div.onclick = clearalert;
}
//# sourceMappingURL=login.js.map
