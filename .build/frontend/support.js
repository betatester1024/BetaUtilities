"use strict";
let docTitle = "";
function onLoad() {
  BOTTOMINPUT = byId("bottomInput");
  setInterval(updateTime, 5e3);
  document.getElementById("header").innerText = "that threaded chat | " + (ISBRIDGE ? "&" : "#") + docURL.pathname.match("^\\/(room|bridge|that)\\/(.+)")[2];
  let match = docURL.pathname.match("^\\/(room|bridge|that)\\/(.+)");
  ROOMNAME = match[2];
  docTitle = "#" + ROOMNAME + " | that threaded chat";
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
  if (e.target.id == "msgInp" && e.key == "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    byId("inpContainer").submit();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.shiftKey)
    return;
  if (e.key == "Escape" || e.key == "ArrowRight" && byId("msgInp").value == "") {
    byMsgId(ACTIVEREPLY).classList.remove("activeReply");
    ACTIVEREPLY = -1;
    toggleActiveReply(-1, true);
  }
  if (e.key == "ArrowLeft" && byId("msgInp").value == "") {
    if (ACTIVEREPLY == -1)
      return;
    toggleActiveReply(ACTIVEREPLY);
  }
  if (e.key == "ArrowDown" && byId("msgInp").value == "") {
    if (ACTIVEREPLY == -1)
      return;
    let leaving = byMsgId(ACTIVEREPLY);
    if (!leaving.nextElementSibling)
      toggleActiveReply(leaving.dataset.id);
    else if (leaving.nextElementSibling.children.length == 2) {
      let desiredReplyID = leaving.nextElementSibling.dataset.id;
      toggleActiveReply(desiredReplyID, true);
    } else if (leaving.nextElementSibling.id == "placeholder")
      toggleActiveReply(-1, true);
    else if (leaving.nextElementSibling.children.length > 2) {
      leaving = leaving.nextElementSibling;
      while (leaving.children.length > 2) {
        leaving = leaving.children[2];
      }
      toggleActiveReply(leaving.dataset.id, true);
    }
  }
  if (e.key == "ArrowUp" && byId("msgInp").value == "") {
    let leaving = byMsgId(ACTIVEREPLY);
    if (ACTIVEREPLY == -1) {
      leaving = byId("placeholder").previousElementSibling;
      toggleActiveReply(leaving.dataset.id, true);
    } else if (leaving.children.length > 3) {
      leaving = leaving.children[leaving.children.length - 2];
      toggleActiveReply(leaving.dataset.id, true);
    } else if (leaving.previousElementSibling && leaving.previousElementSibling.className != "bar") {
      toggleActiveReply(leaving.previousElementSibling.dataset.id, true);
    } else {
      leaving = byMsgId(ACTIVEREPLY).parentElement;
      while (leaving.previousElementSibling && leaving.previousElementSibling.className == "bar") {
        leaving = leaving.parentElement;
      }
      if (leaving.previousElementSibling)
        toggleActiveReply(leaving.previousElementSibling.dataset.id, true);
    }
  }
}
function updateTime() {
  let allElements = document.getElementsByClassName("time");
  for (let ele2 of allElements) {
    ele2.innerText = minimalTime(Date.now() - ele2.dataset.time * 1e3);
  }
}
function toggleSidebar() {
  let ele2 = byId("right");
  if (debounceTimeout < 0) {
    ele2.style.display = ele2.style.display == "flex" || ele2.style.display == "" ? "none" : "flex";
    if (ele2.style.display == "flex")
      ele2.classList.add("sidebarOpen");
    else
      ele2.classList.remove("sidebarOpen");
    debounceTimeout = setTimeout(() => {
      debounceTimeout = -1;
    }, 100);
  }
}
let ACTIVEREPLY = -1;
let awaitingParent = [];
let BOTTOMINPUT = null;
function byMsgId(id) {
  return byId("msgArea").querySelector("[data-id='" + id + "']");
}
function toggleActiveReply(id, forceQ = false) {
  try {
    if (forceQ) {
      byMsgId(ACTIVEREPLY).classList.remove("activeReply");
      if (id != "-1")
        byMsgId(id).classList.add("activeReply");
      else
        byId("container").appendChild(BOTTOMINPUT);
      ACTIVEREPLY = id;
      updateReplyBox();
      return;
    }
    if (id == -1) {
      byMsgId(-1).style.display = "none";
      return;
    }
    if (ACTIVEREPLY == id) {
      byMsgId(id).classList.remove("activeReply");
      let parent = byMsgId(id).parentElement;
      if (parent.dataset.id) {
        ACTIVEREPLY = parent.dataset.id;
        parent.classList.add("activeReply");
      } else
        ACTIVEREPLY = -1;
      byId("container").appendChild(BOTTOMINPUT);
    } else {
      if (byMsgId(id).parentElement.dataset.id == ACTIVEREPLY) {
        if (ACTIVEREPLY != -1)
          byMsgId(ACTIVEREPLY).classList.remove("activeReply");
        ACTIVEREPLY = id;
        byMsgId(id).classList.add("activeReply");
      } else if (!byMsgId(id).parentElement.dataset.id) {
        if (ACTIVEREPLY != -1)
          byMsgId(ACTIVEREPLY).classList.remove("activeReply");
        ACTIVEREPLY = id;
        byMsgId(id).classList.add("activeReply");
      } else {
        let parent = byMsgId(id).parentElement;
        if (ACTIVEREPLY != -1)
          byMsgId(ACTIVEREPLY).classList.remove("activeReply");
        ACTIVEREPLY = parent.dataset.id;
        parent.classList.add("activeReply");
      }
    }
    updateReplyBox();
  } catch (e) {
    console.warn("ERROR:", e);
  }
}
function updateReplyBox() {
  if (ACTIVEREPLY == "-1") {
    byId("msgInp").focus();
    return;
  }
  byMsgId(ACTIVEREPLY).appendChild(BOTTOMINPUT);
  byId("msgInp").focus();
}
let failCt = 0;
function updateAlias() {
  let newAlias = byId("alias").value;
  source.send(JSON.stringify({
    action: "updateAlias",
    data: { alias: newAlias }
  }));
  byId("msgInp").focus();
}
function sendMsg(ev) {
  if (ev && ev.target.id != "msgInp")
    return;
  let inp = document.getElementById("msgInp");
  if (inp.value.length == 0)
    return;
  if (ISBRIDGE)
    source.send(JSON.stringify({ action: "sendMsg", data: { msg: inp.value, room: ROOMNAME, parent: ACTIVEREPLY } }));
  else
    send(JSON.stringify({ action: "sendMsg", data: { msg: inp.value, room: ROOMNAME, parent: ACTIVEREPLY } }), (res) => {
    }, true);
  inp.value = "";
  fitSize2();
}
function fitSize() {
  byId("alias-text").innerText = byId("alias").value;
  byId("alias").focus();
}
function fitSize2(event) {
  byId("msg-text").innerText = byId("msgInp").value + " ";
  byId("msgInp").focus();
}
const rmvReg = /(>|^)\-(.+)\([0-9]\)>/gm;
const addReg = /(>|^)\+(.+)\([0-9]\)>/gm;
const classStr = ["error", "user", "admin", "superadmin"];
let source = null;
let CONNECTIONID = -1;
async function initClient() {
  try {
    console.log("Starting client.");
    if (ISBRIDGE)
      source = new WebSocket("wss://" + docURL.host + "/bridge?room=" + docURL.pathname.match("^/(room|bridge|that)/(.+)")[2]);
    else
      source = new WebSocket("wss://" + docURL.host + "?room=" + docURL.pathname.match("^/(room|bridge|that)/(.+)")[2]);
    source.onclose = () => {
      ephemeralDialog("Connection failed, reconnecting...");
      failCt++;
      if (failCt > 5)
        location.reload();
      console.log("Connection closed by server.");
      setTimeout(initClient, 2e3);
    };
    source.onmessage = (message) => {
      message = JSON.parse(message.data);
      if (message.action != "ping")
        console.log("RECV", message);
      ele = document.getElementById("userList");
      let action = message.action;
      if (message.action == "CONNECTIONID") {
        CONNECTIONID = message.data.id;
      }
      let area = document.getElementById("msgArea");
      let scrDistOKQ = area.scrollTop >= area.scrollHeight - area.offsetHeight - 100;
      if (message.action == "logs") {
        for (let i2 = 0; i2 < message.data.logs.length; i2++) {
          handleMessageEvent(message.data.logs[i2], area);
        }
      }
      if (message.action == "forceReload")
        location.reload();
      if (message.action == "ping") {
        console.log("pong sent");
        source.send(JSON.stringify({ action: "pong" }));
      }
      if (message.action == "RELOAD" || message.action == "RESTART") {
        document.getElementById("msgArea").innerHTML = `<h2 id="placeholder">
        <span class="material-symbols-outlined">update</span> 
        Reloading your messages, a moment please...</h2>`;
        document.getElementById("userList").innerHTML = "";
        LOADEDQ2 = false;
        STARTID = -1;
        ACTIVEREPLY = -1;
        STARTIDVALID = false;
        byId("container").appendChild(BOTTOMINPUT);
        UNREAD = 0;
        PINGED = false;
        loadStatus = -1;
        CONNECTIONID = -1;
        awaitingParent = [];
        ephemeralDialog("Connected!");
        if (message.action == "RESTART")
          source.close();
      }
      if (message.action == "delMsg") {
        let ele2 = byMsgId(message.data.id);
        if (ele2)
          ele2.remove();
        if (!byMsgId(ACTIVEREPLY)) {
          ACTIVEREPLY = -1;
          toggleActiveReply(-1, true);
        }
      }
      if (message.action == "autoThreading") {
        toggleActiveReply(message.data.id);
      }
      if (message.action == "LOADCOMPLETE") {
        let thing = document.getElementById("msgArea");
        if (message.data.id < 0) {
          if (!byId("errorEle")) {
            let errorEle = document.createElement("b");
            errorEle.className = "red";
            errorEle.id = "errorEle";
            errorEle.innerText = "No more messages to load";
            errorEle.style.display = "block";
            thing.prepend(errorEle);
          }
        } else {
          loadStatus = -1;
          STARTID = message.data.id;
        }
        setTimeout(() => {
          if (byId("msgArea").scrollHeight <= byId("msgArea").clientHeight)
            onScroll();
        }, 500);
        console.log("Fixing awaitingParent.");
        fixAwaitingParent();
        thing.scrollTop = thing.scrollTop + 1;
      }
      if (message.action == "removeUser") {
        let ele2 = byId((message.data.isBot ? "zbot" : "usr") + message.data.user);
        if (ele2)
          ele2.remove();
      }
      if (message.action == "addUser") {
        let span = document.createElement("p");
        span.innerText = message.data.user;
        span.id = (message.data.isBot ? "zbot" : "usr") + message.data.user;
        span.title = message.data.user;
        span.style.backgroundColor = "hsl(" + (hashIt(message.data.user.replaceAll(" ", "").toLowerCase()) % 255 + 79) % 255 + ", 74.5%, 80%)";
        span.style.color = "#000";
        if (message.data.isBot)
          byId("botList").appendChild(span);
        else
          byId("userList").appendChild(span);
      }
      if (message.action == "yourAlias") {
        byId("alias").value = message.data.alias;
        byId("alias-text").innerText = message.data.alias;
        if (message.data.error && message.data.type == 1)
          ;
        else if (message.data.error)
          ephemeralDialog("Error: You are not logged in and cannot update your alias.");
        byId("msgInp").focus();
      }
      if (message.action == "addUser" || message.action == "removeUser") {
        let children = ele.childNodes;
        let outArr = [];
        for (let i2 = 0; i2 < children.length; i2++)
          outArr.push(children[i2]);
        outArr.sort(function(a, b) {
          return a.id == b.id ? 0 : a.id > b.id ? 1 : -1;
        });
        ele.innerHTML = "";
        for (i = 0; i < outArr.length; i++) {
          ele.appendChild(outArr[i]);
        }
      }
      let modif = "";
      if (message.action == "msg") {
        handleMessageEvent(message.data, area);
      }
      if (!LOADEDQ2 || scrDistOKQ) {
        area.scrollTop = area.scrollHeight;
        LOADEDQ2 = true;
      }
    };
  } catch (e) {
    alert(e);
    console.log("Restartng client (" + e + ")");
    setTimeout(initClient, 0);
  }
  document.getElementById("msgInp").focus();
}
const replacements = [
  { from: "one", to: "counter_1" },
  { from: "two", to: "counter_2" },
  { from: "three", to: "counter_3" },
  { from: "four", to: "counter_4" },
  { from: "five", to: "counter_5" },
  { from: "six", to: "counter_6" },
  { from: "seven", to: "counter_7" },
  { from: "eight", to: "counter_8" },
  { from: "nine", to: "counter_9" },
  { from: "zero", to: "counter_0" },
  { from: "white_check_mark", to: "check_circle" },
  { from: "active", to: "check_circle" },
  { from: "info", to: "info" },
  { from: "confirm", to: "check" },
  { from: "warn", to: "warning" },
  { from: "error", to: "error" },
  { from: "egg", to: "egg_alt" },
  { from: "rotating_light", to: "e911_emergency" },
  { from: "sparkles", to: "magic_button" },
  { from: "mask", to: "medical_mask" }
];
function findReplacement(thing) {
  for (let i2 = 0; i2 < replacements.length; i2++) {
    if (replacements[i2].to == thing)
      return replacements[i2].from;
  }
}
window.addEventListener("blur", () => {
  UNREAD = 0;
  FOCUSSED = false;
});
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
let ISBRIDGE = docURL.pathname.match("^\\/bridge") != null;
function onScroll() {
  if (document.getElementById("msgArea").scrollTop < 30 && STARTIDVALID && loadStatus < 0) {
    loadStatus = 0;
    console.log("loading messages from" + STARTID);
    if (ISBRIDGE)
      source.send(JSON.stringify({ action: "loadLogs", data: { before: earliestMessageID } }));
    else {
      send(JSON.stringify({ action: "loadLogs", data: { room: ROOMNAME, id: CONNECTIONID, from: STARTID } }), () => {
      }, true);
    }
  } else if (document.getElementById("msgArea").scrollTop < 30)
    console.log("loadStatus" + loadStatus);
}
let loadStatus = -1;
function fixAwaitingParent() {
  console.log(awaitingParent);
  for (let i2 = 0; i2 < awaitingParent.length; i2++) {
    if (byMsgId(awaitingParent[i2].parent)) {
      let ctner = byMsgId(awaitingParent[i2].parent);
      if (!byMsgId(awaitingParent[i2].ele.dataset.id)) {
        if (awaitingParent[i2].prependQ)
          ctner.insertBefore(awaitingParent[i2].ele, ctner.children[1]);
        else
          ctner.appendChild(awaitingParent[i2].ele);
      }
      awaitingParent.splice(i2, 1);
      i2 = -1;
    }
  }
}
function handleMessageEvent(data, area) {
  ele = document.createElement("md-span");
  matches = ["ERROR", data.id, data.sender, data.perms, data.content];
  if (!matches)
    return;
  PREPENDFLAG = false;
  if (STARTID < 0 || matches[1] == 0) {
    STARTID = Number(matches[1]);
    STARTIDVALID = true;
  }
  if (matches[1][0] == "-") {
    PREPENDFLAG = true;
    matches[1] = matches[1].toString().slice(1);
    if (loadStatus == 0)
      loadStatus = 1;
  }
  if (data && data.id && byMsgId(matches[1]))
    return;
  if (data.time) {
    if (data.time < earliestMessageTime) {
      earliestMessageTime = data.time;
      earliestMessageID = matches[1];
    }
  }
  let newMsgSender = document.createElement("b");
  newMsgSender.innerText = matches[2];
  newMsgSender.style.backgroundColor = "hsl(" + (hashIt(matches[2].replaceAll(" ", "").toLowerCase()) % 255 + 79) % 255 + ", 74.5%, 80%)";
  newMsgSender.className = classStr[matches[3]];
  let ctn = document.createElement("div");
  ctn.dataset.id = matches[1];
  ctn.dataset.senderID = data.senderID;
  ctn.className = "msgContainer";
  let msg = "" + matches[4].replaceAll("&gt;", ";gt;").replaceAll(">", ";gt;");
  for (let i2 = 0; i2 < replacements.length; i2++) {
    msg = msg.replaceAll(`:${replacements[i2].from}:`, ">EMOJI" + replacements[i2].to + ">");
  }
  let slashMe = false;
  msg = msg.replaceAll(/(&[a-zA-Z0-9]{1,20})([^;]|$)/gm, ">ROOM$1>$2");
  msg = msg.replaceAll(/(#[a-zA-Z0-9_\-]{1,20})([^;]|$)/gm, ">SUPPORT$1>$2");
  msg = msg.replaceAll(/(;gt;;gt;[a-zA-Z0-9\-/]{1,90})/g, ">INTERNALLINK$1>");
  msg = msg.replaceAll(/((http|ftp|https):\/\/)?(?<test>([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/gmiu, ">LINK$<test>>");
  msg = msg.replaceAll(/@([^ ]+)/g, ">MENTION$1>");
  msg = msg.replaceAll(/\n/gmiu, ">BR>");
  if (msg.match("^[ \n]*/me(.*)")) {
    msg = msg.match("^[ \n]*/me(.*)")[1];
    slashMe = true;
    ele.className += " slashMe " + classStr[matches[3]];
  } else
    ele.className = classStr[matches[3]];
  let split = msg.split(">");
  let out = "";
  for (let i2 = 0; i2 < split.length; i2++) {
    if (i2 % 2 == 0) {
      let fragment = document.createTextNode(split[i2].replaceAll(";gt;", ">"));
      fragment.className = classStr[matches[3]];
      ele.appendChild(fragment);
    } else {
      let pref = split[i2].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR|MENTION)")[1];
      let post = pref != "BR" ? split[i2].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR|MENTION)(.+)")[2] : "";
      if (pref == "EMOJI") {
        let replaced = document.createElement("span");
        replaced.title = ":" + findReplacement(post) + ":";
        replaced.className = "material-symbols-outlined supportMsg " + classStr[matches[3]] + (slashMe ? " slashMe " : "");
        replaced.innerText = post;
        ele.appendChild(replaced);
      } else if (pref == "LINK") {
        let replaced = document.createElement("a");
        replaced.className = "supportMsg " + classStr[matches[3]];
        replaced.href = "https://" + post.replaceAll(";gt;", ">");
        replaced.innerText = post.replaceAll(";gt;", ">");
        replaced.setAttribute("target", "_blank");
        ele.appendChild(replaced);
      } else if (pref == "MENTION") {
        let replaced = document.createElement("span");
        replaced.className = "supportMsg " + classStr[matches[3]];
        replaced.innerText = "@" + post.replaceAll(";gt;", ">");
        ele.appendChild(replaced);
        replaced.setAttribute("style", "color:hsl(" + (hashIt(post.replaceAll(";gt;", ">").toLowerCase()) % 255 + 79) % 255 + ", 74.5%, 48%) !important");
        if (replaced.innerText.toLowerCase() == "@" + byId("alias").value.toLowerCase()) {
          replaced.style.border = "2px solid gold";
          replaced.style.boxShadow = "0px 0px 3px gold";
        }
        replaced.style.fontWeight = "600";
      } else if (pref == "ROOM") {
        let replaced = document.createElement("a");
        replaced.className = "supportMsg " + classStr[matches[3]];
        replaced.href = "/bridge/" + post.slice(1);
        replaced.innerText = post;
        ele.appendChild(replaced);
      } else if (pref == "SUPPORT") {
        let replaced = document.createElement("a");
        replaced.className = "supportMsg " + classStr[matches[3]];
        replaced.href = "/room/" + post.slice(1);
        replaced.innerText = post;
        ele.appendChild(replaced);
      } else if (pref == "INTERNALLINK") {
        let replaced = document.createElement("a");
        replaced.className = "supportMsg " + classStr[matches[3]];
        replaced.href = "/" + post.slice(8).replaceAll(";gt;", ">");
        replaced.innerText = ">>" + post.slice(8).replaceAll(";gt;", ">");
        ele.appendChild(replaced);
      } else if (pref == "BR") {
        ele.appendChild(document.createElement("br"));
      }
    }
  }
  let ctn_inner = document.createElement("div");
  ctn_inner.className = "msgContents";
  ctn_inner.appendChild(newMsgSender);
  ctn_inner.appendChild(ele);
  ctn_inner.dataset.message = data.content;
  ctn_inner.innerHTML += `<div class="time" data-time="${data.time}">${minimalTime(Date.now() - data.time * 1e3)}</div>`;
  if (Date.now() / 1e3 - data.time < 60)
    ctn_inner.style.animation = "newMsg " + (60 - (Date.now() / 1e3 - data.time)) + "s";
  let optn = document.createElement("div");
  optn.className = "options";
  optn.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  };
  if (data.sender != "[SYSTEM]")
    optn.innerHTML = `
    <button class="btn" onclick="copyMessage(event)">
      <span class="material-symbols-outlined blu">content_copy</span>
      Copy message contents
    </button>
    <button class="btn" onclick="replyMessage(event)">
      <span class="material-symbols-outlined blu">reply</span>
      Reply
    </button>`;
  else
    optn.remove();
  if (userData.user == ctn.dataset.senderID || byId("alias").value == ctn.dataset.senderID || userData.perms && userData.perms >= 2)
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
  ctn_inner.onclick = (ev) => {
    toggleActiveReply(ctn.dataset.id);
  };
  if (data.perms == 3 && data.sender == "[SYSTEM]")
    ctn.dataset.id = "-1";
  if (data.parent != void 0 && (isNaN(data.parent) || data.parent >= 0)) {
    if (byMsgId(data.parent)) {
      byMsgId(data.parent).appendChild(ctn);
      for (let i2 = 0; i2 < awaitingParent.length; i2++) {
        if (awaitingParent[i2].ele.dataset.id == ctn.dataset.id) {
          awaitingParent.splice(i2, 1);
          break;
        }
      }
    } else {
      awaitingParent.push({ parent: data.parent, ele: ctn, prependQ: ISBRIDGE && PREPENDFLAG });
      console.log("awaiting parent", data.parent, ctn);
    }
  } else {
    if (PREPENDFLAG)
      area.prepend(ctn);
    else
      area.appendChild(ctn);
  }
  document.getElementById("placeholder").style.display = "none";
  if (!FOCUSSED) {
    if (data.content.match("@" + byId("alias").value), "gi")
      PINGED = true;
    UNREAD++;
    document.title = "(" + UNREAD + ")" + (PINGED ? "!" : "") + " | " + docTitle;
  }
  updateReplyBox();
  if (data.autoThread)
    toggleActiveReply(data.id);
  if (byMsgId(-1))
    byMsgId(-1).querySelector(".msgContents").style.animation = "";
  if (byMsgId(-1))
    byId("msgArea").appendChild(byMsgId(-1));
  byId("msgArea").insertBefore(byId("placeholder"), byMsgId(-1));
}
function copyMessage(ev) {
  let el = ev.currentTarget.parentElement.parentElement;
  navigator.clipboard.writeText(el.dataset.message);
  ephemeralDialog("<span class='material-symbols-outlined grn'>check_circle</span> Copied");
}
function replyMessage(ev) {
  let id = ev.currentTarget.parentElement.parentElement.parentElement.dataset.id;
  toggleActiveReply(id, true);
}
function deleteMessage(ev) {
  let id = ev.currentTarget.parentElement.parentElement.parentElement.dataset.id;
  send(JSON.stringify({ action: "delMsg", data: { id, room: ROOMNAME } }), (res) => {
    console.log(res);
  });
}
//# sourceMappingURL=support.js.map
