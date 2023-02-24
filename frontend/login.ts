function onLoad() {
  let match = document.cookie.match("__Secure-session=[0-9.]+");
  console.log("Current session: "+match);
  if (!match && document.URL.match("admin")) {
    alertDialog("You're not logged in!", ()=>{window.open("/signup", "_self");}); 
  }
}

function newUser(e:Event, accessclass:string) {
  let id=(e.target as HTMLElement).id;
  console.log(id);
  if (id !="loginBTN")
    return;
  validateLogin("add", accessclass);
}
function validateLogin(action:string="login", access:string) {
  let user = document.getElementById("userINP") as HTMLInputElement;
  let pass = document.getElementById("passINP") as HTMLInputElement;
  let confirm = document.getElementById("passINPCONF") as HTMLInputElement;
  // console.log(confirm.value);
  let CMD = document.getElementById("command") as HTMLInputElement;
  
  
  
  if ((action !="login" && action !="add" && action !="signup") || (user.value.match("^[a-zA-Z0-9_]+$") && pass.value.length!==0)) {
    if (confirm && (action=="add" || action=="signup") && confirm.value != pass.value) {
      console.log("Nomatch");
      alertDialog("Error: Your passwords do not match", ()=>{location.reload();});
      return;
    }
    if (confirm) confirm.value = "";
    let arr = new BigUint64Array(1);
    let match = document.cookie.match("__Secure-session=([0-9.]+)");
    let sessionID = match?match[1]:window.crypto.getRandomValues(arr);
    // ONLY USE THE sessionID WHEN ADDING A NEW session
    
    console.log(match);
    
    // alert/(document.cookie);
    let params;
    if (action!="logout" && action != "CMD") params= "user="+encodeURIComponent(user.value)+"&pass="+encodeURIComponent(pass.value)+"&action="+action+"&access="+access+"&token="+sessionID;
    else if (action=="CMD") {
      params="user="+encodeURIComponent(CMD.value)+"&action=CMD&token="+sessionID;
      CMD.value="";
    }
    else params="user=&pass=&action=logout&token="+sessionID;
    if (pass) pass.value="";
    console.log("SENDING "+params);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "login", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4 && xhr.status == 200){
        if (action=="server") return;
        let res = xhr.responseText;
        res = JSON.parse(res);
        let ele = document.getElementById('overlay');
        if (ele) ele.className = "";
        ele = document.getElementById('h1');
        if (ele) ele.className = "beforeoverload";
        if (action != "login") {
          if (res == "ACCESS") {
            alertDialog("Error: You do not have permissions!", ()=>{});
          }
          else if (res == "EXPIRE")
            alertDialog("Error: Your login session has expired!", ()=>{validateLogin("logout", "")});
          else if (res == "NOACTIVE") {
            alertDialog("Error: You are not logged in!", ()=>{window.open("/", "_self")});
          }
          else if (action=="logout") {
            // alert("Logging out");
            document.cookie = "__Secure-session=; Secure;";
            alertDialog("You've been logged out", ()=>{window.open("/", "_self")});
          }
          else if (res == "ERROR") {
            alertDialog("Unknown error!", ()=>{});
          }
          else if (res == "TAKEN") {
            alertDialog("This username is already taken!", ()=>{});
          }
          else {
            alertDialog("Action complete!", ()=>{if (action=="signup") window.open("/", "_self")});
            if (!match && action =="signup") document.cookie = "__Secure-session="+sessionID+"; SameSite=None; Secure";
          }
          return;
        } // not login
        if (res == "2") {
          alertDialog("Welcome, "+user.value+"! | Administrative access granted.", ()=>{ window.open("/admin", "_self");})
          if (!match && action =="login") document.cookie = "__Secure-session="+sessionID+"; SameSite=None; Secure";
        }
        else if (res == "3") {
          alertDialog("Welcome, betatester1024.", ()=>{window.open("/admin", "_self")});
          if (!match && action =="login") document.cookie = "__Secure-session="+sessionID+"; SameSite=None; Secure";
        }
        else if (res == "1") {
          alertDialog("Welcome, "+user.value+"!", ()=> {window.open("/", "_self");});
          if (!match && action =="login") document.cookie = "__Secure-session="+sessionID+"; SameSite=None; Secure";
        }
        else {
          alertDialog("Error: Invalid login credentials", ()=>{window.open("/login", "_self");});
        }
      }
    }
    xhr.send(params);
    let ele = document.getElementById('overlay');
    if (ele) ele.className += "active";
    ele = document.getElementById('h1');
    if (ele) ele.className ="overload";
  } else if(!(user.value.match("^[a-zA-Z0-9_]+$"))) 
  {
    alertDialog("Please enter a username with only alphanumeric characters, or underscores.", ()=>{});
  } else if( pass.value.length==0) {
    alertDialog("Please enter a password.", ()=>{})
  }
}

function logout() {
  // document.cookie = "__Secure-session=";
  // console.log("Cookie should be removed.")
  validateLogin("logout","");
}

let dialog = false;
let cbk;

function alertDialog(txt:string, callback:()=>any) {
  let div = document.getElementById("alert") as HTMLDivElement;
  div.style.animationName = "incoming";
  div.style.top = "0px";
  let ele = document.getElementById("alerttxt") as HTMLParagraphElement;
  ele.innerHTML = txt;
  dialog = true;
  cbk = callback;
}

function clearalert() {
  if (dialog && cbk) {
    let div = document.getElementById("alert") as HTMLDivElement;
    div.style.animationName = "outgoing";
    div.style.top = "100vh";
    dialog = false;
    cbk()
    cbk = null;
  }
}