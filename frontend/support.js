let docTitle = "";
function onLoad() {
  // send(JSON.stringify({action:"refresh"}), (res)=>{
  // });
  // send(JSON.stringify({action:"refresh_users"}), (res)=>{
  // });
  // BTTOMNPUT = document.createElement("input");
  // REPLYINPUT.className = "inp";
  BOTTOMINPUT = byId("bottomInput");
  // REPLYINPUT.id = "rep"
  setInterval(updateTime, 5000);
  document.getElementById("header").innerText = "that threaded chat | "+(ISBRIDGE?"&":"#")+
    docURL.pathname.match("^\\/(room|bridge|that)\\/(.+)")[2];
  let match = docURL.pathname.match("^\\/(room|bridge|that)\\/(.+)");
  ROOMNAME = match[2]
  docTitle = "#"+ROOMNAME+" | that threaded chat";//(match[1] == "room"?"#":"&")+ROOMNAME;
  document.title = docTitle;
  document.addEventListener("keydown", onKeyPress);
}
let PINGED = false;
let debounceTimeout = -1;
function onKeyPress(e) {
  if (e.key == "b" && e.ctrlKey && !e.metaKey && !e.shiftKey) {
    toggleSidebar();
    e.preventDefault();
  }
  if (e.target.id == "msgInp" && 
      e.key == "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    byId("inpContainer").submit();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.key == 'Escape' || e.key == "ArrowRight" && byId("msgInp").value=="") {
    byMsgId(ACTIVEREPLY).classList.remove("activeReply");
    ACTIVEREPLY = -1;
    toggleActiveReply(-1, true);
  }
  if (e.key == "ArrowLeft" && byId("msgInp").value=="") {
    if (ACTIVEREPLY == -1) return;
    toggleActiveReply(ACTIVEREPLY);
  }
  if (e.key == "ArrowDown" && byId("msgInp").value=="") 
  {
    if (ACTIVEREPLY == -1) return;
    let leaving = byMsgId(ACTIVEREPLY);
    if (!leaving.nextElementSibling) // falling off the edge to the parent
      toggleActiveReply(leaving.dataset.id);
    else if (leaving.nextElementSibling.children.length == 2) { // the bar and the message content
      // happy days.
      let desiredReplyID = leaving.nextElementSibling.dataset.id
      toggleActiveReply(desiredReplyID, true);
    }
    else if (leaving.nextElementSibling.id == "placeholder") // probably at the end
      toggleActiveReply(-1, true)
    else if (leaving.nextElementSibling.children.length > 2) { // next has children
      // go to deepest and closest child
      leaving = leaving.nextElementSibling;
      while (leaving.children.length > 2) {
        leaving = leaving.children[2]; // #1 is content, #2 is bar, #3 is child messages
      }
      toggleActiveReply(leaving.dataset.id, true)
    }
  } // going down!
  if (e.key == "ArrowUp" && byId("msgInp").value=="") {
    let leaving = byMsgId(ACTIVEREPLY);
    if (ACTIVEREPLY == -1) {
      leaving = byId("placeholder").previousElementSibling;
      // while (leaving.children.length > 2) {
        // leaving = leaving.children[leaving.children.length-1]; // #1 is content, #2 is bar, #3 is child messages
      // }
      toggleActiveReply(leaving.dataset.id, true);
    }
    // else if (!leaving.previousElementSibling) return;
    else if (leaving.children.length > 3) { // can go to child
      // falling off the edge to the parent
      leaving = leaving.children[leaving.children.length-2];
      // while (leaving.children.length > 3) {
        // leaving = leaving.children[2]; // #1 is content, #2 is bar, #3 is child messages, last is text box
      // }
      // toggleActiveReply(leaving.dataset.id, true)
      toggleActiveReply(leaving.dataset.id, true);
    }
    else if (leaving.previousElementSibling && leaving.previousElementSibling.className != "bar") 
    {
      // console.log("prevelement");
      toggleActiveReply(leaving.previousElementSibling.dataset.id, true);
    }
    else {
      // if there are no children and there are no siblings:
      leaving = byMsgId(ACTIVEREPLY).parentElement;
      while (leaving.previousElementSibling && 
             (leaving.previousElementSibling.className == "bar")) {
        leaving = leaving.parentElement;
      }
      if (leaving.previousElementSibling)
        toggleActiveReply(leaving.previousElementSibling.dataset.id, true);
    }
    // else if (leaving.nextElementSibling.children.length == 2) { // the bar and the message content
    //   // happy days.
    //   let desiredReplyID = leaving.nextElementSibling.dataset.id
    //   toggleActiveReply(desiredReplyID, true);
    // }
    // else if (leaving.nextElementSibling.id == "placeholder") // probably at the end
    //   toggleActiveReply(-1, true)
    // else if (leaving.nextElementSibling.children.length > 2) { // next has children
    //   // go to deepest and closest child
    //   leaving = leaving.nextElementSibling;
    //   while (leaving.children.length > 2) {
    //     leaving = leaving.children[2]; // #1 is content, #2 is bar, #3 is child messages
    //   }
    //   toggleActiveReply(leaving.dataset.id, true)
    // }
  }
}
function updateTime() {
  let allElements = document.getElementsByClassName("time");
  for (let ele of allElements) {
    if (ele.dataset.time < 1000)
    ele.innerText = minimalTime(Date.now()-ele.dataset.time*1000);
  }
}

function toggleSidebar() {
  let ele = byId("right");
  if (debounceTimeout < 0) {
    // console.log(e);
    ele.style.display = (ele.style.display=="flex" || ele.style.display == "")?"none":"flex";
    if (ele.style.display == "flex") ele.classList.add("sidebarOpen")
    else ele.classList.remove("sidebarOpen")
    debounceTimeout = setTimeout(()=>{debounceTimeout = -1;}, 100)
  }
}
// system refresh auto!
let ACTIVEREPLY = -1;
let awaitingParent = [];
let BOTTOMINPUT = null
function byMsgId(id) 
{
  return byId("msgArea").querySelector("[data-id='"+id+"']")
}
function toggleActiveReply(id, forceQ = false) // force to set reply to ID ALWAYS 
{ 
  try {
    if (forceQ) {
      byMsgId(ACTIVEREPLY).classList.remove("activeReply");
      if (id != "-1") byMsgId(id).classList.add("activeReply");
      else byId("container").appendChild(BOTTOMINPUT);
      ACTIVEREPLY = id;
      updateReplyBox();
      return;
    }
    if (id == -1) { // you clicked the banner
      byMsgId(-1).style.display = "none";
      return;
      // byMsgId(-1).style.transition= "all 0.5s";
      // byMsgId(-1).style.height = "0px";
      // byMsgId(-1).style.opacity = "0";
      // byMsgId(-1).style.touchAction = "none";
    }
    if (ACTIVEREPLY == id) { // clicking again: activereply parent or clear activereply
      byMsgId(id).classList.remove("activeReply");
      let parent = byMsgId(id).parentElement;
      if (parent.dataset.id) {
        ACTIVEREPLY = parent.dataset.id;
        parent.classList.add("activeReply");
      }
      else ACTIVEREPLY = -1;
      byId("container").appendChild(BOTTOMINPUT);
      // BOTTOMINPUT.style.display="flex";
    }
    else { // okay, not clicking again
      // are you clicking on the direct child?
      if (byMsgId(id).parentElement.dataset.id == ACTIVEREPLY) {
        // that's right!
        // okay so now activereply is the one you clickedre
        if (ACTIVEREPLY != -1)
          byMsgId(ACTIVEREPLY).classList.remove("activeReply");
        ACTIVEREPLY = id;
        byMsgId(id).classList.add("activeReply");
  
      }
      // are you clicking on something else?
      // at this point you definitely are
      // does it even have a parent?
      else if (!byMsgId(id).parentElement.dataset.id) {
        if (ACTIVEREPLY != -1)
          byMsgId(ACTIVEREPLY).classList.remove("activeReply");
        ACTIVEREPLY = id;
        byMsgId(id).classList.add("activeReply");
      }
      // okay, it does
      else {
        let parent = byMsgId(id).parentElement;
        if (ACTIVEREPLY != -1) 
          byMsgId(ACTIVEREPLY).classList.remove("activeReply");
        ACTIVEREPLY = parent.dataset.id;
        parent.classList.add("activeReply");
        
      }
    }
    updateReplyBox();
  } catch(e) {
    console.warn("ERROR:", e)
  }
  // BOTTOMINPUT.style.display=(ACTIVEREPLY=="-1"?"flex":"none");
}

function updateReplyBox() 
{
  if (ACTIVEREPLY == "-1") {
    byId("msgInp").focus();
    return;
  }
  byMsgId(ACTIVEREPLY).appendChild(BOTTOMINPUT);
  byId("msgInp").focus();
}
let failCt = 0;
function updateAlias() {
  // source.close();
  let newAlias = byId("alias").value;

  // if (true) {
    // console.log("here");

    source.send(JSON.stringify({
      action:"updateAlias", 
      data:{alias:newAlias}
    }));
    byId("msgInp").focus();
  // }
  // else {
  //   source.close();
  //   document.getElementById("userList").innerHTML = ``;
  //   send(JSON.stringify({action:"realias", data:{alias:newAliass}}), (res)=>{
  //     if (res.status != "SUCCESS") alertDialog("ERROR: "+res.data.error, ()=>{});
  //     else alertDialog("Updated alias!", ()=>{
  //       STARTID = -1;
  //       STARTIDVALID = false;
  //       loadStatus = -1;
  //       document.getElementById("msgArea").innerHTML = `<h2 id="placeholder">
  //       <span class="material-symbols-outlined">update</span> 
  //       Reloading your messages, a moment please...</h2>`;
  //       initClient();
  //     });
  //   });
  // }
}

function sendMsg(ev) {
  if (ev && ev.target.id != "msgInp") return;
  let inp = document.getElementById("msgInp");
  if (inp.value.length == 0) return;
  // byId("msgInp").value = "";
  // let match = inp.value.match("^!alias @(.+)");
  // if (match) {
  //   updateAlias(match[1])
  //   // } // not bridge
  // }
  // else {
    if (ISBRIDGE) source.send(JSON.stringify({action:"sendMsg", data:{msg:inp.value, room:ROOMNAME, parent:ACTIVEREPLY}}));
    else send(JSON.stringify({action:"sendMsg", data:{msg:inp.value, room:ROOMNAME, parent:ACTIVEREPLY}}), (res)=>{
      
    }, true);
    // toggleActiveReply()
  // }
  inp.value="";
  fitSize2();
  // byId("alias-text").value=""
}

function fitSize() {
  byId("alias-text").innerText = byId("alias").value;
  byId("alias").focus();
}

function fitSize2(event) {
  // console.log(event);

  // console.log(byId("msgInp").value)
  byId("msg-text").innerText = byId("msgInp").value+" ";
  byId("msgInp").focus();
  // event.preventDefault();
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
  // let isBridge = docURL.searchParams.get("bridge");
  if (ISBRIDGE)
    source = new WebSocket('wss://'+docURL.host+'/bridge?room='+
       docURL.pathname.match("^\/(room|bridge|that)\/(.+)")[2]);
  else source = new WebSocket('wss://'+docURL.host+'?room='+
                                 docURL.pathname.match("^\/(room|bridge|that)\/(.+)")[2]);
  source.onclose = ()=>{
    ephemeralDialog("Connection failed, reconnecting...");
    failCt++;
    if (failCt>5) location.reload();
    console.log("Connection closed by server."); setTimeout(initClient, 2000);
  };
  // source.onerror = ()=>{
  //   ephemeralDialog("Connection error, reconnecting...")
  //   // source.close();
  //   failCt++;
  //   if (failCt>5) location.reload();
  //   console.log("Connection ERROR"); setTimeout(initClient, 2000)
  // };
  source.onmessage = (message) => {
    message = JSON.parse(message.data);
    
    if (message.action != "ping") console.log('RECV', message);
    ele = document.getElementById("userList");
    // let modif = message.data;
    let action = message.action;
    if (message.action == "CONNECTIONID") {
      
      CONNECTIONID = message.data.id;
    }   
    let area = document.getElementById("msgArea");
    let scrDistOKQ =  (area.scrollTop) >= (area.scrollHeight-area.offsetHeight - 100)
    if (message.action == "logs") {
      // message.data.logs.sort((a, b)=>{
      //   // console.log(Math.abs(a.id));
      //   return Math.abs(a.id)-Math.abs(b.id)
      // });
      // console.log(message.data.logs);
      for (let i=0; i<message.data.logs.length; i++) {
        // console.log(message.data.logs[i].id)
        handleMessageEvent(message.data.logs[i], area);
      }
    }
    if (message.action == "forceReload") location.reload();
    if (message.action == "ping") {
      console.log("pong sent");
      source.send(JSON.stringify({action:"pong"}));
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
      byId("container").appendChild(BOTTOMINPUT);
      UNREAD = 0;
      PINGED = false;
      // document.title = "Support"
      loadStatus = -1;
      CONNECTIONID = -1;
      awaitingParent = [];
      ephemeralDialog("Connected!");
      if (message.action == "RESTART") source.close();
    }    
    if (message.action == "delMsg") {
      let ele = byMsgId(message.data.id);
      if (ele) ele.remove();
      if (!byMsgId(ACTIVEREPLY)) {
        ACTIVEREPLY = -1;
        toggleActiveReply(-1, true);
      }
      // if (ele.closest())
    }
    if (message.action == "autoThreading") {
      toggleActiveReply(message.data.id);
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
      setTimeout(()=>{
        if (byId("msgArea").scrollHeight <= byId("msgArea").clientHeight) 
          onScroll();
      }, 500);
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
      span.style.backgroundColor = "hsl("+
        // make @BetaOS blue!
        (hashIt(message.data.user.replaceAll(" ", "").toLowerCase())%255+79)%255+
        ", 74.5%, 80%)";
      span.style.color = "#000"; // has background color so DO NOT INVERT ON DARK MODE
      // if (message.data.isBot) span.classList.add("bot");
      if (message.data.isBot) byId("botList").appendChild(span);
      else byId("userList").appendChild(span);
    }
    if (message.action== "yourAlias") {
      byId("alias").value = message.data.alias;
      byId("alias-text").innerText = message.data.alias
      if (message.data.error) ephemeralDialog("Error: You are not logged in and cannot update your alias.")
      byId("msgInp").focus();
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
    // let msgs = modif.split(">");
    if (message.action == "msg") {
      // first fix things for arrow navigation
      // console.log(message.data.time);
      handleMessageEvent(message.data, area);
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
  document.title = docTitle;
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
let ISBRIDGE = docURL.pathname.match("^\\/bridge")!= null;
function onScroll() {
  
  if (document.getElementById("msgArea").scrollTop < 30 && STARTIDVALID && loadStatus<0) {
    loadStatus = 0;
    console.log("loading messages from" + STARTID)
    if (ISBRIDGE)
      source.send(JSON.stringify({action:"loadLogs", data:{before:earliestMessageID}}));
    else {
      
      send(JSON.stringify({action:"loadLogs", data:{room:ROOMNAME, id:CONNECTIONID, from:STARTID}}), ()=>{}, true);
    }
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

function handleMessageEvent(data, area) {
  ele = document.createElement("md-span");
  matches = ["ERROR", data.id, data.sender, data.perms, data.content];
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
  if (data && data.id && 
    byMsgId(matches[1])) return;
  if (data.time) 
  if (data.time < earliestMessageTime) {
    earliestMessageTime = data.time;
    earliestMessageID = matches[1];
  }
  // let newMsgBody = document.createTextNode();
  let newMsgSender = document.createElement("b");
  // parse things
  newMsgSender.innerText = matches[2];
  newMsgSender.style.backgroundColor = "hsl("+
      // make @BetaOS blue!
      (hashIt(matches[2].replaceAll(" ", "").toLowerCase())%255+79)%255+
      ", 74.5%, 80%)";
  newMsgSender.className = classStr[matches[3]];

  let ctn = document.createElement("div");
  ctn.dataset.id=matches[1];
  ctn.dataset.senderID = data.senderID
  ctn.className='msgContainer';
  // if (!PREPENDFLAG) ctn.appendChild(newMsgSender);
  // newMsgBody.className = classStr[matches[3]];
  let msg = ""+matches[4].replaceAll("&gt;", ";gt;").replaceAll(">", ";gt;");
  for (let i=0; i<replacements.length; i++) {
    msg = msg.replaceAll(`:${replacements[i].from}:`, ">EMOJI"+replacements[i].to+">");
  }
  let slashMe = false;
  msg = msg.replaceAll(/(&[a-zA-Z0-9]{1,20})([^;]|$)/gm,">ROOM$1>$2")
  msg = msg.replaceAll(/(#[a-zA-Z0-9_\-]{1,20})([^;]|$)/gm,">SUPPORT$1>$2")
  msg = msg.replaceAll(/(;gt;;gt;[a-zA-Z0-9\-/]{1,90})/g,">INTERNALLINK$1>");
  msg = msg.replaceAll(/((http|ftp|https):\/\/)?(?<test>([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/gmiu,">LINK$<test>>")
  msg = msg.replaceAll(/@([^ ]+)/g,">MENTION$1>");
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
      let pref = split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR|MENTION)")[1];
      let post = pref!="BR"?(split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR|MENTION)(.+)")[2]):"";
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
      else if (pref == "MENTION") {
        let replaced = document.createElement("span");
        replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
        replaced.innerText = "@"+post.replaceAll(";gt;", ">");
        ele.appendChild(replaced);
        // console.log(hashIt(post.replaceAll(";gt;", ">"))%360)
        replaced.setAttribute("style", "color:hsl("+
          // make @BetaOS blue!
          (hashIt(post.replaceAll(";gt;", ">").toLowerCase())%255+79)%255+
          ", 74.5%, 48%) !important");
        if (replaced.innerText.toLowerCase() == "@"+byId("alias").value.toLowerCase()) {
          replaced.style.border = "2px solid gold";
          replaced.style.boxShadow = "0px 0px 3px gold";
        }
        replaced.style.fontWeight = "600";
      }
      else if (pref == "ROOM") {
        let replaced = document.createElement("a");
        replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
        replaced.href = "/bridge/"+post.slice(1);
        replaced.innerText = post;
        ele.appendChild(replaced);
      }
      else if (pref == "SUPPORT") {
        let replaced = document.createElement("a");
        replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
        replaced.href = "/room/"+post.slice(1);
        replaced.innerText = post;
        ele.appendChild(replaced);
      }
      else if (pref == "INTERNALLINK") {
        let replaced = document.createElement("a");
        replaced.className="supportMsg "+classStr[matches[3]] //+ (slashMe?" slashMe ":"");
        replaced.href = "/"+post.slice(8).replaceAll(";gt;", ">");
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
  ctn_inner.dataset.message = data.content
  ctn_inner.innerHTML += `<div class="time" data-time="${data.time}">${minimalTime(Date.now()-data.time*1000)}</div>`
  if (Date.now()/1000 - data.time < 60)
    ctn_inner.style.animation = "newMsg "+(60-(Date.now()/1000-data.time))+"s";
  let optn = document.createElement("div");
  optn.className = "options";
  optn.onclick = (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
  };
  // console.log(data.perms, data.sender);
  if (data.sender != "[SYSTEM]") optn.innerHTML = `
    <button class="btn" onclick="copyMessage(event)">
      <span class="material-symbols-outlined blu">content_copy</span>
      Copy message contents
    </button>
    <button class="btn" onclick="replyMessage(event)">
      <span class="material-symbols-outlined blu">reply</span>
      Reply
    </button>`;
  else optn.remove();
  // console.log(byId("alias").value);
  if (userData.user == ctn.dataset.senderID
   || byId("alias").value == ctn.dataset.senderID
     || userData.perms && userData.perms >=2 )
    optn.innerHTML += `
    <!-- <button class="btn">
    //   <span class="material-symbols-outlined ylw">edit</span>
    //   Edit message
    // </button>-->
    <button class="btn" onclick="deleteMessage(event)">
      <span class="material-symbols-outlined red nooutline">delete</span>
      Delete message
    </button>`;
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
  if (data.perms == 3 && data.sender == "[SYSTEM]") ctn.dataset.id="-1";

  if (data.parent != undefined && 
      (isNaN(data.parent) || data.parent >= 0)) { // euph: parent is a NaN string
    if (byMsgId(data.parent)) {
      // if (PREPENDFLAG) byId(data.parent).prepend(ctn);
      byMsgId(data.parent).appendChild(ctn);
      for (let i=0; i<awaitingParent.length; i++) {
        if (awaitingParent[i].ele.dataset.id == ctn.dataset.id) {
          awaitingParent.splice(i, 1);
          break;
        }
      } // remove already awaiting parent
    }
    else {
      awaitingParent.push({parent:data.parent, ele:ctn, prependQ:ISBRIDGE&&PREPENDFLAG});
      console.log("awaiting parent", data.parent, ctn);
    }
  }
  else {
    if (PREPENDFLAG) area.prepend(ctn);
    else area.appendChild(ctn);
  }
  document.getElementById("placeholder").style.display="none";
  if (!FOCUSSED) {
    if (data.content.match("@"+byId("alias").value), "gi") PINGED = true;
    UNREAD ++ 
    document.title = "("+UNREAD+")"+(PINGED?"!":"")+" | "+docTitle;
  }
  updateReplyBox();
  if (data.autoThread) 
    toggleActiveReply(data.id);
  if (byMsgId(-1)) byMsgId(-1).querySelector(".msgContents").style.animation = "";
  if (byMsgId(-1)) byId("msgArea").appendChild(byMsgId(-1));
  byId("msgArea").insertBefore(byId("placeholder"), byMsgId(-1))
  // byMsgId(-1).style.display = "none";
}

function copyMessage(ev) {
  let el = ev.currentTarget.parentElement.parentElement;
  navigator.clipboard.writeText(el.dataset.message);
  ephemeralDialog("<span class='material-symbols-outlined grn'>check_circle</span> Copied")
}
function replyMessage(ev) {
  // console.log(ev.currentTarget.parentElement.parentElement)
  let id = ev.currentTarget.parentElement.parentElement.parentElement.dataset.id;
  toggleActiveReply(id, true);
  // console.log("hello", id);
}
function deleteMessage(ev) {
  let id = ev.currentTarget.parentElement.parentElement.parentElement.dataset.id;
  send(JSON.stringify({action:"delMsg", data:{id:id, room:ROOMNAME}}), (res)=>{
    console.log(res);
  });
}