function onLoad() {
  let match = document.cookie.match("__Secure-session=[0-9.]+");
  console.log("Current session: " + match);
  if (!match && document.URL.match("admin")) {
    alertDialog("You're not logged in!", () => { window.open("/signup", "_self"); });
  }
  document.getElementById("alert").hidden=true;
  document.getElementById("h1").hidden=true;
}

let CURRUSER = "";
let CURRPERMS = "";

function newUser(e: Event, accessclass: string) {
  let id = (e.target as HTMLElement).id;
  console.log(id);
  if (id != "loginBTN")
    return;
  validateLogin("add", accessclass);
}

function deleteAllCookies() {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

function sendMsg() {
  let inp = document.getElementById("textINP") as HTMLInputElement;
  let msg = inp.value;
  inp.value = "";
  validateLogin("sendMsg", msg);
}

function validateLogin(action: string = "login", extData: string) {
  let user = document.getElementById("userINP") as HTMLInputElement;
  let pass = document.getElementById("passINP") as HTMLInputElement;
  let confirm = document.getElementById("passINPCONF") as HTMLInputElement;
  // console.log(confirm.value);
  let CMD = document.getElementById("command") as HTMLInputElement;



  if ((action != "login" && action != "add" && action != "signup") || (user.value.match("^[a-zA-Z0-9_]+$") && pass.value.length !== 0)) {
    if (confirm && (action == "add" || action == "signup") && confirm.value != pass.value) {
      console.log("Nomatch");
      alertDialog("Error: Your passwords do not match", () => { location.reload(); });
      return;
    }
    if (confirm) confirm.value = "";
    let arr = new BigUint64Array(1);
    let match = document.cookie.match("__Secure-session=([0-9.]+)");
    let sessionID = match ? match[1] : window.crypto.getRandomValues(arr);
    // ONLY USE THE sessionID WHEN ADDING A NEW session


    // alert/(document.cookie);
    let params;
    if (action != "logout" && action != "CMD" 
        && action != "sendMsg" && action!="userReq") 
      params = "user=" + encodeURIComponent(user?user.value:"") + "&pass=" + encodeURIComponent(pass?pass.value:"") + "&action=" + action + "&access=" + extData + "&token=" + sessionID;
    else if (action == "CMD") {
      params = "user=" + encodeURIComponent(CMD.value) + "&action=CMD&token=" + sessionID;
      CMD.value = "";
    }
    else if (action == "sendMsg") {
      params = "token=" + sessionID + "&action=sendMsg&user=" + encodeURIComponent(extData);
      // temporarily add this message to the div (until refresh handles it)
      let ele = document.getElementById('msgArea') as HTMLDivElement;
      ele.innerHTML += `<p><b class='${CURRPERMS=="2"?"admin":(CURRPERMS=="3"?"beta":"")}''>${CURRUSER}:</b>${extData}</p>`;
      ele.scrollTop = ele.scrollHeight;
    }
    else params = "user=&pass=&action="+action+"&token=" + sessionID;
    if (pass) pass.value = "";
    if (action != "refresh" && action != "refresh_log") console.log("SENDING " + params);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "login", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (action == "server") return;
        let res = xhr.responseText;
        res = JSON.parse(res);
        let ele = document.getElementById('overlay');
        if (ele) ele.className = "";
        ele = document.getElementById('h1');
        if (ele) ele.className = "beforeoverload";
        if (action != "login") {
          if (action == "sendMsg") {
            validateLogin("refresh", "");
            return;
          }
          if (action == "userReq") {
            let ele = document.getElementById("header");
            if (res != "ERROR" && res !="NOACTIVE" && res != "ACCESS")
              ele.innerHTML = "Welcome, "+res+"!";
            else ele.innerHTML = "Welcome to BetaOS Services!"
          }
          if (action == "refresh" || action== "refresh_log") {
            if (res == "ACCESS" || res == "EXPIRE" || res == "NOACTIVE" || res == "ERROR") {
              location.reload();
            }
            updateTextArea(res);
            return;
          }
          if (res == "ACCESS") {
            alertDialog("Error: You do not have permissions!", () => { });
          }
          else if (res == "EXPIRE")
            alertDialog("Error: Your login session has expired!", () => { validateLogin("logout", "") });
          else if (res == "NOACTIVE") {
            alertDialog("Error: You are not logged in!", () => { window.open("/", "_self") });
          }
          else if (action == "logout") {
            // alert("Logging out");
            document.cookie = "__Secure-session=; Secure;";
            alertDialog("You've been logged out", () => { window.open("/", "_self") });
          }
          else if (res == "ERROR") {
            alertDialog("Unknown error!", () => { });
          }
          else if (res == "TAKEN") {
            alertDialog("This username is already taken!", () => { });
          }
          else {
            alertDialog("Action complete!", () => { if (action == "signup") window.open("/", "_self") });
            if (!match && action == "signup") document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
          }
          return;
        } // not login
        if (res == "2") {
          alertDialog("Welcome, " + user.value + "! | Administrative access granted.", () => { window.open("/admin", "_self"); })
          CURRUSER = user.value;
          CURRPERMS = "2";
          console.log(document.cookie);
          deleteAllCookies();
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;
                            __Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          if (!match && action == "login") document.cookie += "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        }
        else if (res == "3") {
          CURRUSER = user.value;
          CURRPERMS = "3";
          console.log(document.cookie);
          deleteAllCookies();
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;
                            __Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          alertDialog("Welcome, betatester1024.", () => { window.open("/admin", "_self") });
          if (!match && action == "login") document.cookie += "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        }
        else if (res == "1") {
          CURRUSER = user.value;
          CURRPERMS = "1";
          console.log(document.cookie);
          deleteAllCookies();
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;
                            __Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          alertDialog("Welcome, " + user.value + "!", () => { window.open("/", "_self"); });
          if (!match && action == "login") document.cookie += "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        }
        else {
          alertDialog("Error: Invalid login credentials", () => { window.open("/login", "_self"); });
        }
      }
    }
    xhr.send(params);
    if (action != 'sendMsg' && action != "refresh" && action != "refreshLog") {
      let ele = document.getElementById('overlay');
      if (ele) ele.className += "active";
      ele = document.getElementById('h1');
      ele.hidden=false;
      if (ele) ele.className = "overload";
    }
  } else if (!(user.value.match("^[a-zA-Z0-9_]+$"))) {
    alertDialog("Please enter a username with only alphanumeric characters, or underscores.", () => { });
  } else if (pass.value.length == 0) {
    alertDialog("Please enter a password.", () => { })
  }
}

function logout() {
  // document.cookie = "__Secure-session=";
  // console.log("Cookie should be removed.")
  validateLogin("logout", "");
}

let dialog = false;
let cbk: ()=>any;

function alertDialog(txt: string, callback: () => any) {
  let div = document.getElementById("alert") as HTMLDivElement;
  div.style.animationName = "incoming";
  div.style.top = "0px";
  let ele = document.getElementById("alerttxt") as HTMLParagraphElement;
  ele.innerHTML = txt;
  dialog = true;
  cbk = callback;
  div.hidden=false;
  // console.log("ALERT");
}

function clearalert() {
  if (dialog && cbk) {
    let div = document.getElementById("alert") as HTMLDivElement;
    div.style.animationName = "outgoing";
    div.style.top = "100vh";
    dialog = false;
    cbk()
    cbk = null;
    alert.hidden=true;
  }
}

function updateTextArea(msgs:string) {
  let ele = document.getElementById("msgArea") as HTMLDivElement;
  ele.innerHTML = msgs;
  ele.scrollTop = ele.scrollHeight;
  
}