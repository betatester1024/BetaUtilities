"use strict";
function onLoad() {
  BOTTOMINPUT = byId("bottomInput");
  setInterval(updateTime, 1e3);
  document.getElementById("header").innerText = "Support: " + (ISBRIDGE ? "&" : "#") + docURL.pathname.match("^\\/(room|bridge)\\/(.+)")[2];
  ROOMNAME = docURL.pathname.match("^\\/(room|bridge)\\/(.+)")[2];
  document.addEventListener("keydown", onKeyPress);
}
function onKeyPress(e) {
  if (e.key == "b" && e.ctrlKey && !e.metaKey && !e.shiftKey) {
    let ele2 = byId("right");
    console.log(e);
    ele2.style.display = ele2.style.display == "flex" ? "none" : "flex";
    e.preventDefault();
  }
}
function updateTime() {
  let allElements = document.getElementsByClassName("time");
  for (let ele2 of allElements) {
    ele2.innerText = toTime(Date.now() - ele2.dataset.time * 1e3);
  }
}
let ACTIVEREPLY = -1;
let awaitingParent = [];
let BOTTOMINPUT = null;
function byMsgId(id) {
  return byId("msgArea").querySelector("[data-id='" + id + "']");
}
function toggleActiveReply(id) {
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
}
function updateReplyBox() {
  if (ACTIVEREPLY == "-1") {
    byId("msgInp").focus();
    return;
  }
  byMsgId(ACTIVEREPLY).appendChild(BOTTOMINPUT);
  byId("msgInp").focus();
}
function updateAlias() {
  let newAlias = byId("alias").value;
  if (ISBRIDGE) {
    source.send(JSON.stringify({
      action: "updateAlias",
      data: { alias: newAlias }
    }));
    byId("msgInp").focus();
  } else {
    source.close();
    document.getElementById("userList").innerHTML = ``;
    send(JSON.stringify({ action: "realias", data: { alias: newAliass } }), (res) => {
      if (res.status != "SUCCESS")
        alertDialog("ERROR: " + res.data.error, () => {
        });
      else
        alertDialog("Updated alias!", () => {
          STARTID = -1;
          STARTIDVALID = false;
          loadStatus = -1;
          document.getElementById("msgArea").innerHTML = `<h2 id="placeholder">
        <span class="material-symbols-outlined">update</span> 
        Reloading your messages, a moment please...</h2>`;
          initClient();
        });
    });
  }
}
function sendMsg(ev) {
  if (ev && ev.target.id != "msgInp")
    return;
  let inp = document.getElementById("msgInp");
  if (inp.value.length == 0)
    return;
  let match = inp.value.match("^!alias @(.+)");
  if (match) {
    updateAlias(match[1]);
  } else {
    if (ISBRIDGE)
      source.send(JSON.stringify({ action: "sendMsg", data: { msg: inp.value, room: ROOMNAME, parent: ACTIVEREPLY } }));
    else
      send(JSON.stringify({ action: "sendMsg", data: { msg: inp.value, room: ROOMNAME, parent: ACTIVEREPLY } }), () => {
      }, true);
  }
  inp.value = "";
}
function fitSize() {
  byId("alias-text").innerText = byId("alias").value;
  byId("alias").focus();
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
      source = new WebSocket("wss://" + docURL.host + "/bridge?room=" + docURL.pathname.match("^/(room|bridge)/(.+)")[2]);
    else
      source = new WebSocket("wss://" + docURL.host + "?room=" + docURL.pathname.match("^/(room|bridge)/(.+)")[2]);
    source.onclose = () => {
      console.log("Connection closed by server.");
      setTimeout(initClient, 500);
    };
    source.onerror = () => {
      console.log("Connection ERROR");
      setTimeout(initClient, 500);
    };
    source.onmessage = (message) => {
      console.log("Got", message);
      message = JSON.parse(message.data);
      ele = document.getElementById("userList");
      let action = message.action;
      if (message.action == "CONNECTIONID") {
        CONNECTIONID = message.data.id;
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
        loadStatus = -1;
        CONNECTIONID = -1;
        awaitingParent = [];
        if (message.action == "RESTART")
          source.close();
      }
      if (message.action == "delMsg") {
        let ele2 = byMsgId(message.data.id);
        if (ele2)
          ele2.remove();
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
        if (message.data.isBot)
          span.classList.add("bot");
        ele.appendChild(span);
      }
      if (message.action == "yourAlias") {
        byId("alias").value = message.data.alias;
        byId("alias-text").innerText = message.data.alias;
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
      let area = document.getElementById("msgArea");
      ele = document.createElement("p");
      let scrDistOKQ = area.scrollTop >= area.scrollHeight - area.offsetHeight - 100;
      if (message.action == "msg") {
        matches = ["ERROR", message.data.id, message.data.sender, message.data.perms, message.data.content];
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
        if (message && message.data && message.data.id && byMsgId(matches[1]))
          return;
        if (message.data.time) {
          if (message.data.time < earliestMessageTime) {
            earliestMessageTime = message.data.time;
            earliestMessageID = matches[1];
          }
        }
        let newMsgSender = document.createElement("b");
        newMsgSender.innerText = matches[2];
        newMsgSender.className = classStr[matches[3]];
        let ctn = document.createElement("div");
        ctn.dataset.id = matches[1];
        ctn.className = "msgContainer";
        let msg = " " + matches[4].replaceAll("&gt;", ";gt;").replaceAll(">", ";gt;");
        for (let i2 = 0; i2 < replacements.length; i2++) {
          msg = msg.replaceAll(`:${replacements[i2].from}:`, ">EMOJI" + replacements[i2].to + ">");
        }
        let slashMe = false;
        msg = msg.replaceAll(/(&[a-zA-Z0-9]{1,20})([^;]|$)/gm, ">ROOM$1>$2");
        msg = msg.replaceAll(/(#[a-zA-Z0-9_\-]{1,20})([^;]|$)/gm, ">SUPPORT$1>$2");
        msg = msg.replaceAll(/(;gt;;gt;[^ ]{0,90})/gm, ">INTERNALLINK$1>");
        msg = msg.replaceAll(/((http|ftp|https):\/\/)?(?<test>([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/gmiu, ">LINK$<test>>");
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
            let pref = split[i2].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR)")[1];
            let post = pref != "BR" ? split[i2].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR)(.+)")[2] : "";
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
              replaced.href = post.slice(8).replaceAll(";gt;", ">");
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
        ctn_inner.innerHTML += `<div class="time" data-time="${message.data.time}">${toTime(Date.now() - message.data.time * 1e3)}</div>`;
        if (Date.now() / 1e3 - message.data.time < 60)
          ctn_inner.style.animation = "newMsg " + (60 - (Date.now() / 1e3 - message.data.time)) + "s";
        let optn = document.createElement("div");
        optn.className = "options";
        optn.innerHTML = `
      <button class="btn">
        <span class="material-symbols-outlined">reply</span>
      </button>`;
        ctn_inner.appendChild(optn);
        ctn.appendChild(ctn_inner);
        let bar = document.createElement("div");
        bar.className = "bar";
        ctn.appendChild(bar);
        ctn_inner.onclick = (ev) => {
          toggleActiveReply(ctn.dataset.id);
        };
        if (message.data.perms == 3 && message.data.sender == "[SYSTEM]")
          ctn.dataset.id = "-1";
        if (message.data.parent != void 0 && (isNaN(message.data.parent) || message.data.parent >= 0)) {
          if (byMsgId(message.data.parent)) {
            byMsgId(message.data.parent).appendChild(ctn);
            for (let i2 = 0; i2 < awaitingParent.length; i2++) {
              if (awaitingParent[i2].ele.dataset.id == ctn.dataset.id) {
                awaitingParent.splice(i2, 1);
                break;
              }
            }
          } else {
            awaitingParent.push({ parent: message.data.parent, ele: ctn, prependQ: ISBRIDGE && PREPENDFLAG });
            console.log("awaiting parent", message.data.parent, ctn);
          }
        } else {
          if (PREPENDFLAG)
            area.prepend(ctn);
          else
            area.appendChild(ctn);
        }
        document.getElementById("placeholder").style.display = "none";
        if (!FOCUSSED) {
          UNREAD++;
          document.title = "(" + UNREAD + ") | Support | BetaOS Systems";
        }
        updateReplyBox();
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
let ISBRIDGE = docURL.pathname.match("^\\/bridge") != null;
function onScroll() {
  if (document.getElementById("msgArea").scrollTop < 30 && STARTIDVALID && loadStatus < 0) {
    loadStatus = 0;
    console.log("loading messages from" + STARTID);
    if (ISBRIDGE)
      source.send(JSON.stringify({ action: "loadLogs", data: { before: earliestMessageID } }));
    else
      send(JSON.stringify({ action: "loadLogs", data: { room: ROOMNAME, id: CONNECTIONID, from: STARTID } }), () => {
      });
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
//# sourceMappingURL=support.js.map
