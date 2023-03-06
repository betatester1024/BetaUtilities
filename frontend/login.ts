function onLoad() {
  let match = document.cookie.match("__Secure-session=[0-9.]+");
  console.log("Current session: " + match);
  if (!match && document.URL.match("admin")) {
    alertDialog("You're not logged in!", () => { window.open("/signup", "_self"); });
  }
  // document.getElementById("alert").hidden=true;
  // document.getElementById("h1").hidden=true;
}

let CURRUSER = "";
let CURRACCNAME = "";
let CURRPERMS = "";
let LOADEDQ = false;

function newUser(e: Event, accessclass: string) {
  let id = (e.target as HTMLElement).id;
  console.log(id);
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
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
  // alert(document.cookie);
}

const escapeHtml = (unsafe:string) => {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
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

    let renickQ = false;
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
      let match = extData.match("!renick @([a-zA-Z_0-9]+)");
      if (match) {
        params = "token="+sessionID+"&action=renick&user="+encodeURIComponent(match[1]);
        renickQ = true;
      }
      // temporarily add this message to the div (until refresh handles it)
      let ele = document.getElementById('msgArea') as HTMLDivElement;
      ele.innerHTML += `<p><b class='${CURRPERMS=="2"?"admin":(CURRPERMS=="3"?"beta":"")}''>${CURRUSER} [SendingAWAIT]:</b> ${extData}</p><br>`;
      ele.scrollTop = ele.scrollHeight;
    }
    else params = "user=&pass=&action="+action+"&token=" + sessionID;
    if (pass) pass.value = "";
    if (action != "refresh" && action != "refresh_log") console.log("SENDING " + params);
    var xhr = new XMLHttpRequest();
    let m = document.URL.match("redirect=(.*)");
    let redirectTo = m?m[1]:"/";
    // console.log(redirectTo);
    xhr.open("POST", "login", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (action == "server") return;
        let res = xhr.responseText;
        res = JSON.parse(res);
        let ele = document.getElementById('overlay');
        if (ele) ele.className = "";
        console.log(res);
        console.log("action:"+action);
        ele = document.getElementById('h1');
        if (ele) ele.className = "beforeoverload";
        if (action != "login") {
          
          if (renickQ && res != "ERROR") {
            CURRUSER = res;
            alertDialog("Renicked successfully to @"+CURRUSER, ()=>{});
          }
          else if (renickQ) {
            alertDialog("Error in re-nicking!", ()=>{});
          }
          if (action == "sendMsg") {
            validateLogin("refresh", "send");
            return;
          }
          if (action == "userReq") {
            let ele = document.getElementById("header") as HTMLHeadingElement;
            CURRUSER = res.split(" ")[0];
            CURRACCNAME = res.split(" ")[0];
            CURRPERMS = res.split(" ")[1];
            if (ele) {
              if (res != "ERROR" && res !="NOACTIVE" && res != "ACCESS")
                ele.innerHTML = "Welcome, "+res.split(" ")[0]+"!";
              else ele.innerHTML = "Welcome to BetaOS Services!"
            } else{
              if (res == "ERROR" || res == "NOACTIVE" || res == "ACCESS") {
                alertDialog("You're not logged in!", () => { window.open("/signup", "_self"); });
              }
              switch(res.split(" ")[1]) {
                case "1": 
                  (document.getElementById("sel") as HTMLSelectElement).hidden=true;
                  (document.getElementById('loginDIV') as HTMLDivElement).hidden=true;
                  (document.getElementById("userLoginBTN")as HTMLButtonElement).hidden=false;
                  let userinp=document.getElementById("userINP") as HTMLInputElement;
                  userinp.value = res.split(" ")[0];
                  (document.getElementById("userDiv") as HTMLDivElement).hidden=true;
                  (document.getElementById("danger") as HTMLDivElement).hidden=true;
                break;
              }
            } // admin page
            return;
          }
          if (action == "delete" && res != "NOACTIVE" && res !="EXPIRE" && res != "ACCESS" && res != "ERROR") {
            alertDialog("Deleted user:"+res, (CURRPERMS=="1")?()=>{window.open("/","_self");}:()=>{})
            // deleteAllCookies();
            if (CURRACCNAME == res) validateLogin("logout", "");
            return;
          }
          if (action == "refresh" || action== "refresh_log") {
            if (res == "ACCESS" || res == "EXPIRE" || res == "NOACTIVE" || res == "ERROR") {
              location.reload();
            }
            ele = document.getElementById("msgArea") as HTMLDivElement;
            // console.log(ele.scrollTop - ele.scrollHeight)
            let scrDistOKQ =     Math.abs(ele.scrollTop - ele.scrollHeight) < 1000;
            updateTextArea(res);
            
            if (!LOADEDQ || extData == "send" || scrDistOKQ)
            {
              ele.scrollTop = ele.scrollHeight;
              // console.log("Scrolling to bottom.")
              LOADEDQ = true;
            }
            return;
          }
          if (res == "ACCESS") {
            alertDialog("Error: You do not have permissions!", () => { });
          }
          else if (res == "EXPIRE")
            alertDialog("Error: Your login session has expired!", () => { validateLogin("logout", "") });
          else if (res == "NOACTIVE") {
            
            alertDialog("Error: Your login session is invalid!", () => {validateLogin("logout", "");});
          }
          else if (action == "logout") {
            // alert("Logging out");
            document.cookie = "__Secure-session=; Secure;";
            alertDialog("You've been logged out", () => { window.open(redirectTo, "_self") });
          }
          else if (res == "ERROR") {
            alertDialog("Unknown error!", () => { });
          }
          else if (res == "TAKEN") {
            alertDialog("This username is already taken!", () => { });
          }
          else {
            alertDialog("Action complete!", () => { if (action == "signup") window.open(redirectTo, "_self") });
            if (!match && action == "signup") document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
          }
          return;
        } // not login
        if (res == "2") {
          alertDialog("Welcome, " + user.value + "! | Administrative access granted.", () => { window.open(redirectTo, "_self"); })
          CURRUSER = user.value;
          CURRACCNAME = user.value;
          CURRPERMS = "2";
          deleteAllCookies();
          console.log(document.cookie);
          
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;`
          document.cookie = `__Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          if (!match && action == "login") document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        }
        else if (res == "3") {
          CURRUSER = user.value;
          CURRACCNAME = user.value;
          CURRPERMS = "3";
          deleteAllCookies();
          console.log(document.cookie);
          
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;`
          document.cookie = `__Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          alertDialog("Welcome, betatester1024.", () => { window.open(redirectTo, "_self") });
          if (!match && action == "login") document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        }
        else if (res == "1") {
          CURRUSER = user.value;
          CURRACCNAME = user.value;
          CURRPERMS = "1";
          deleteAllCookies();
          console.log(document.cookie);
          document.cookie = `__Secure-user=${CURRUSER}; SameSite=None; Secure;`
          document.cookie = `__Secure-perms=${CURRPERMS}; SameSite=None; Secure;`;
          alertDialog("Welcome, " + user.value + "!", () => { window.open(redirectTo, "_self"); });
          if (!match && action == "login") document.cookie = "__Secure-session=" + sessionID + "; SameSite=None; Secure;";
        }
        else {
          alertDialog("Error: Invalid login credentials", () => { location.reload()});
        }
      }
    }
    xhr.send(params);
    if (action != 'sendMsg' && action != "refresh" && action != "refreshLog") {
      let ele = document.getElementById('overlay');
      if (ele) ele.className += "active";
      ele = document.getElementById('h1');
      if (ele) ele.hidden=false;
      if (ele) ele.className = "overload";
    }
  } else if (!(user.value.match("^[a-zA-Z0-9_]+$"))) {
    alertDialog("Please enter a username with only alphanumeric characters, or underscores.", () => { });
  } else if (pass.value.length == 0) {
    // alertDialog("Please enter a password.", () => { })
  }
}

function logout() {
  // document.cookie = "__Secure-session=";
  // console.log("Cookie should be removed.")
  validateLogin("logout", "");
  CURRUSER="";
  CURRACCNAME="";
}

let dialog = false;
let cbk: null|(()=>any);

function alertDialog(txt: string, callback: () => any) {
  let div = document.getElementById("alert") as HTMLDivElement;
  div.style.animationName = "incoming";
  div.style.top = "0px";
  let ele = document.getElementById("alerttxt") as HTMLParagraphElement;
  ele.innerText = txt;
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
    // alert.hidden=true;
  }
}

function updateTextArea(msgs:string) {
  
  let ele = document.getElementById("msgArea") as HTMLDivElement;
  let scrollHt = ele.scrollTop;
  ele.innerHTML = msgs;
  
  ele.scrollTop = scrollHt;
  
}