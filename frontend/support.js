function onLoad() {
  // send(JSON.stringify({action:"refresh"}), (res)=>{
  // });
  // send(JSON.stringify({action:"refresh_users"}), (res)=>{
  // });
  document.getElementById("header").innerText = "Support: "+(ISBRIDGE?"&":"#")+
    new URL(document.URL).searchParams.get("room");
  ROOMNAME = new URL(document.URL).searchParams.get("room");
  
}
// system refresh auto!
let ACTIVEREPLY = -1;
let awaitingParent = [];

function byMsgId(id) 
{
  return byId("msgArea").querySelector("[data-id='"+id+"']")
}
function toggleActiveReply(id) 
{
  if (ACTIVEREPLY == id) {
    byMsgId(id).classList.remove("activeReply");
    ACTIVEREPLY = -1;
  }
  else {
    if (ACTIVEREPLY!=-1) toggleActiveReply(ACTIVEREPLY);
    byMsgId(id).classList.add("activeReply");
    ACTIVEREPLY = id;
  }
}

function sendMsg() {
  let inp = document.getElementById("msgInp");
  let match = inp.value.match("^!alias @(.+)");
  if (match) {
    source.close();
    
    document.getElementById("userList").innerHTML = ``;
    send(JSON.stringify({action:"realias", data:{alias:match[1]}}), (res)=>{
      if (res.status != "SUCCESS") alertDialog("ERROR: "+res.data.error, ()=>{});
      else alertDialog("Updated alias!", ()=>{
        STARTID = -1;
        STARTIDVALID = false;
        loadStatus = -1;
        document.getElementById("msgArea").innerHTML = `<h2 id="placeholder">
        <span class="material-symbols-outlined">update</span> 
        Reloading your messages, a moment please...</h2>`;
        initClient();
      });
    }, true);
  }
  else {
    if (ISBRIDGE) source.send(JSON.stringify({action:"sendMsg", data:{msg:inp.value, room:ROOMNAME, parent:ACTIVEREPLY}}));
    else send(JSON.stringify({action:"sendMsg", data:{msg:inp.value, room:ROOMNAME, parent:ACTIVEREPLY}}), ()=>{}, true);
  }
  inp.value="";
}

const rmvReg = /(>|^)\-(.+)\([0-9]\)>/gm;
const addReg = /(>|^)\+(.+)\([0-9]\)>/gm;
const classStr = ["error", "user", "admin", "superadmin"]
let source = null;
let CONNECTIONID = -1;
async function initClient()
{
  
  try {
  console.log("Starting client.")
  let isBridge = new URL(document.URL).searchParams.get("bridge");
  if (isBridge && isBridge == "true")
    source = new WebSocket('wss://'+new URL(document.URL).host+'/bridge?room='+
       new URL(document.URL).searchParams.get("room"));
  else source = new WebSocket('wss://'+new URL(document.URL).host+'?room='+
                                 new URL(document.URL).searchParams.get("room"));
  source.onclose = ()=>{console.log("connection failed"); setTimeout(initClient, 500)};
  source.onerror = ()=>{console.log("connection failed"); setTimeout(initClient, 500)};
  source.onmessage = (message) => {
    console.log('Got', message);
    message = JSON.parse(message.data);
    ele = document.getElementById("userList");
    // let modif = message.data;
    let action = message.action;
    if (message.action == "CONNECTIONID") {
      
      CONNECTIONID = message.data.id;
    }    
    if (message.action == "RELOAD" || message.action == "RESTART") {
      document.getElementById("msgArea").innerHTML = `<h2 id="placeholder">
        <span class="material-symbols-outlined">update</span> 
        Reloading your messages, a moment please...</h2>`;
      document.getElementById("userList").innerHTML = "";
      LOADEDQ2=false;
      STARTID=-1;
      ACTIVEREPLY = -1;
      STARTIDVALID = false;
      UNREAD = 0;
      loadStatus = -1;
      CONNECTIONID = -1;
      awaitingParent = [];
      if (message.action == "RESTART") source.close();
    }    
    if (message.action == "delMsg") {
      let ele = byMsgId(message.data.id);
      if (ele) ele.remove();
    }
    if (message.action == "LOADCOMPLETE") {
      let thing = document.getElementById("msgArea")
      if (message.data.id<0) {
        if (!byId("errorEle")) {
        let errorEle = document.createElement("b");
        errorEle.className = "red";
        errorEle.id="errorEle";
        errorEle.innerText = "No more messages to load";
        errorEle.style.display="block";
        thing.prepend(errorEle);
        }
      }
      else {
        loadStatus = -1;
        STARTID=message.data.id;
        // alert("lcMatchId updated"+ STARTID);
      }
      console.log("Fixing awaitingParent.")
      fixAwaitingParent();
      thing.scrollTop = thing.scrollTop+1;
    }    
    if (message.action == "removeUser") {
      let ele2 = byId((message.data.isBot?"zbot":"usr")+message.data.user);
      if (ele2) ele2.remove();
    }
    if (message.action=="addUser") {
      let span = document.createElement("p");
      span.innerText = message.data.user;
      span.id = (message.data.isBot?"zbot":"usr")+message.data.user;
      span.title = message.data.user;
      if (message.data.isBot) span.classList.add("bot");
      ele.appendChild(span);
    }
    if (message.action == "addUser" || message.action == "removeUser") {
      // console.log("sorting");
      let children = ele.childNodes;
      let outArr = [];
      for (let i=0; i<children.length; i++) 
        outArr.push(children[i]);
      outArr.sort(function(a, b) {
        return a.id == b.id?0:(a.id > b.id?1:-1);
      });
      ele.innerHTML = "";
      for (i=0; i<outArr.length; i++) {
        ele.appendChild(outArr[i]);
      }
    }
    let modif = "";
    // console.log(modif);
    let area = document.getElementById("msgArea");
    ele = document.createElement("p");

    let scrDistOKQ =  (area.scrollTop) >= (area.scrollHeight-area.offsetHeight - 100)
    // let msgs = modif.split(">");
    if (message.action == "msg") {
      // console.log(message.data.time);
      matches = ["ERROR", message.data.id, message.data.sender, message.data.perms, message.data.content];
      // let matches = msgs[i].match(/{(-?[0-9]+)}\[(.+)\]\(([0-9])\)(.*)/)
      if (!matches) return;
      
      PREPENDFLAG = false;
      if (STARTID<0 || matches[1] == 0) {
        STARTID = Number(matches[1]);
        STARTIDVALID = true;
        // alert(STARTID);
      }
      if (matches[1][0] == "-") {
        // console.log("PREPENDING")p
        PREPENDFLAG = true;
        matches[1] = matches[1].toString().slice(1);
        if (loadStatus == 0) loadStatus = 1;
      }
      if (message && message.data && message.data.id && 
        byMsgId(matches[1])) return;
      if (message.data.time) 
      if (message.data.time < earliestMessageTime) {
        earliestMessageTime = message.data.time;
        earliestMessageID = matches[1];
      }
      // let newMsgBody = document.createTextNode();
      let newMsgSender = document.createElement("b");
      // parse things
      newMsgSender.innerText = matches[2];
      newMsgSender.className = classStr[matches[3]];
      
      let ctn = document.createElement("div");
      ctn.dataset.id=matches[1];
      
      ctn.className='msgContainer';
      // if (!PREPENDFLAG) ctn.appendChild(newMsgSender);
      // newMsgBody.className = classStr[matches[3]];
      let msg = " "+matches[4].replaceAll("&gt;", ";gt;").replaceAll(">", ";gt;");
      for (let i=0; i<replacements.length; i++) {
        msg = msg.replaceAll(`:${replacements[i].from}:`, ">EMOJI"+replacements[i].to+">");
      }
      let slashMe = false;
      msg = msg.replaceAll(/(&[a-zA-Z0-9]{1,20})([^;]|$)/gm,">ROOM$1>$2")
      msg = msg.replaceAll(/(#[a-zA-Z0-9_\-]{1,20})([^;]|$)/gm,">SUPPORT$1>$2")
      msg = msg.replaceAll(/(;gt;;gt;[^ ]{0,90})/gm,">INTERNALLINK$1>");
      msg = msg.replaceAll(/((http|ftp|https):\/\/)?(?<test>([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/gmiu,">LINK$<test>>")
      msg = msg.replaceAll(/\n/gmiu,">BR>")
      // console.log(msg);
      if (msg.match("^[ \n]*/me(.*)")) {
        msg = msg.match("^[ \n]*/me(.*)")[1];
        slashMe = true;
        ele.className += " slashMe " + classStr[matches[3]];
      }
      else ele.className = classStr[matches[3]];
      
      let split = msg.split(">");
      // console.log("message fragments:", split.length, split);
      let out= "";
      for (let i=0; i<split.length; i++) {
        if (i%2 == 0) {
          let fragment = document.createTextNode(split[i].replaceAll(";gt;", ">"));
          fragment.className = classStr[matches[3]] //+ (slashMe?" slashMe ":"");
          // fragment.innerText = split[i].replaceAll(";gt;", ">");
          ele.appendChild(fragment);
        }
        else {
          let pref = split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR)")[1];
          let post = pref!="BR"?(split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR)(.+)")[2]):"";
          if (pref == "EMOJI") {
            let replaced = document.createElement("span");
            replaced.title = ":"+findReplacement(post)+":";
            replaced.className="material-symbols-outlined supportMsg "+classStr[matches[3]] + (slashMe?" slashMe ":"");
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
          else if (pref == "LINK") {
            let replaced = document.createElement("a");
            replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
            replaced.href = "https://"+post.replaceAll(";gt;", ">");
            replaced.innerText = post.replaceAll(";gt;", ">");
            replaced.setAttribute("target", "_blank");
            ele.appendChild(replaced);
          }
          else if (pref == "ROOM") {
            let replaced = document.createElement("a");
            replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
            replaced.href = "https://euphoria.io/room/"+post.slice(1);
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
          else if (pref == "SUPPORT") {
            let replaced = document.createElement("a");
            replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
            replaced.href = "/support?room="+post.slice(1);
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
          else if (pref == "INTERNALLINK") {
            let replaced = document.createElement("a");
            replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
            replaced.href = post.slice(8).replaceAll(";gt;", ">");
            // replaced.setAttribute("target", "_blank");
            replaced.innerText = ">>"+post.slice(8).replaceAll(";gt;", ">");
            ele.appendChild(replaced);
          }
          else if (pref == "BR") {
            ele.appendChild(document.createElement("br"));
          }
        }
      }
      
      let ctn_inner = document.createElement("div");
      ctn_inner.className = "msgContents";
      ctn_inner.appendChild(newMsgSender);
      ctn_inner.appendChild(ele);
      ctn_inner.innerHTML += `<div class="time">${toTime(Date.now()-message.data.time*1000)}</div>`
      let optn = document.createElement("div");
      optn.className = "options";
      optn.innerHTML = `
      <button class="btn">
        <span class="material-symbols-outlined">reply</span>
      </button>`
      ctn_inner.appendChild(optn);
      ctn.appendChild(ctn_inner);
      let bar = document.createElement("div");
      bar.className = "bar";
      ctn.appendChild(bar);
      ctn_inner.onclick=
        (ev)=>{ 
          toggleActiveReply(ctn.dataset.id);
        }
      // area.appendChild(document.createElement("br"));
      if (message.data.perms == 3 && message.data.sender == "[SYSTEM]") ctn.dataset.id="-1";
      
      if (message.data.parent != undefined && 
          (isNaN(message.data.parent) || message.data.parent >= 0)) { // euph: parent is a NaN string
        if (byMsgId(message.data.parent)) {
          // if (PREPENDFLAG) byId(message.data.parent).prepend(ctn);
          byMsgId(message.data.parent).appendChild(ctn);
          for (let i=0; i<awaitingParent.length; i++) {
            if (awaitingParent[i].ele.dataset.id == ctn.dataset.id) {
              awaitingParent.splice(i, 1);
              break;
            }
          } // remove already awaiting parent
        }
        else {
          awaitingParent.push({parent:message.data.parent, ele:ctn, prependQ:ISBRIDGE&&PREPENDFLAG});
          console.log("awaiting parent", message.data.parent, ctn);
        }
      }
      else {
        if (PREPENDFLAG) area.prepend(ctn);
        else area.appendChild(ctn);
      }
      document.getElementById("placeholder").style.display="none";
      if (!FOCUSSED) {
        UNREAD ++ 
        document.title = "("+UNREAD+") | Support | BetaOS Systems"
      }
    } // received message element // 
    // alert("here")
    if (!LOADEDQ2 || scrDistOKQ)
    {
      area.scrollTop = area.scrollHeight;
      // console.log("Scrolling to bottom.")
      LOADEDQ2 = true;
      // alert("scrolled")
    }
    // else alert("invalid")

    
  } // handler function;
  } catch (e) {
    alert(e);
    console.log("Restartng client ("+e+")")
    setTimeout(initClient, 0);
  }
  document.getElementById("msgInp").focus();
} // initClient();


const replacements = [
  {from: "one", to: "counter_1"},
  {from: "two", to: "counter_2"},
  {from: "three", to: "counter_3"},
  {from: "four", to: "counter_4"},
  {from: "five", to: "counter_5"},
  {from: "six", to: "counter_6"},
  {from: "seven", to: "counter_7"},
  {from: "eight", to: "counter_8"},
  {from: "nine", to: "counter_9"},
  {from: "zero", to: "counter_0"},
  {from: "white_check_mark", to: "check_circle"},
  {from: "active", to: "check_circle"},
  {from: "info", to: "info"},
  {from: "confirm", to:"check"},
  {from: "warn", to: "warning"},
  {from: "error", to:"error"},
  {from: "egg", to:"egg_alt"},
  {from: "rotating_light", to:"e911_emergency"},
  {from: "sparkles", to:"magic_button"},
  {from: "mask", to:"medical_mask"}
]

// function replaceAll(msg, ele, matches) {
//   console.log(msg, ele, matches);
//   for (let j=0; j<replacements.length; j++) {
//     let regex = new RegExp(replacements[j].from, "gmiu");
//     while ((arr = regex.exec(msg)) !== null) {
//       console.log(`Found ${arr[0]}. `, arr.index);
//       let fragment = document.createElement("span");
//       fragment.className = classStr[matches[3]];
//       console.log(msg.slice(0, arr.index));
//       if (msg.slice(0, arr.index)) replaceAll(msg.slice(0, arr.index), ele, matches);
//       let replaced = document.createElement("span");
//       replaced.className="material-symbols-outlined supportMsg "+classStr[matches[3]];
//       replaced.innerText = replacements[j].to;
//       console.log(replaced);
//       ele.appendChild(replaced);
//       msg = msg.slice(arr.index+replacements[j].from.length);
//       console.log(msg);
//     }
//   } // for replacements
// }

function findReplacement(thing) {
  for (let i=0; i<replacements.length; i++) {
    if (replacements[i].to == thing) return replacements[i].from;
  }
}

window.addEventListener("blur", () => {
  UNREAD = 0;
  FOCUSSED = false;
});

// when the user's focus is back to your tab (website) again
window.addEventListener("focus", () => {
  document.title = "Support | BetaOS Systems";
  FOCUSSED = true;
  UNREAD = 0;
});

let UNREAD = 0;
let FOCUSSED = true;
let STARTID = -1;
let LOADEDQ2 = false;
let STARTIDVALID = false;
let earliestMessageTime = 9e99;
let earliestMessageID = "";
let ISBRIDGE = new URL(document.URL).searchParams.get("bridge")=="true";
function onScroll() {
  
  if (document.getElementById("msgArea").scrollTop < 30 && STARTIDVALID && loadStatus<0) {
    loadStatus = 0;
    console.log("loading messages from" + STARTID)
    if (ISBRIDGE)
      source.send(JSON.stringify({action:"loadLogs", data:{before:earliestMessageID}}));
    else
      send(JSON.stringify({action:"loadLogs", data:{room:ROOMNAME, id:CONNECTIONID, from:STARTID}}), ()=>{});
  }
  
  else if (document.getElementById("msgArea").scrollTop < 30) console.log("loadStatus" + loadStatus)
}
let loadStatus = -1;

function fixAwaitingParent() 
{
  console.log(awaitingParent);
  for (let i=0; i<awaitingParent.length; i++) {
    if (byMsgId(awaitingParent[i].parent)) {
      let ctner = byMsgId(awaitingParent[i].parent);
      if (!byMsgId(awaitingParent[i].ele.dataset.id)) {// do not add if it has already been added
        if (awaitingParent[i].prependQ) 
          // referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
          ctner.insertBefore(awaitingParent[i].ele, ctner.children[1]);
        else ctner.appendChild(awaitingParent[i].ele);
        // console.log("actually added", awaitingParent[i].ele);
      }
      // else console.log("didnt'actually add")
      // console.log("added");
      awaitingParent.splice(i, 1);
      // console.log(awaitingParent);
      i=-1;
    }
  }
}