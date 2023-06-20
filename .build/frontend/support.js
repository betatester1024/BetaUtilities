"use strict";
function onLoad() {
  document.getElementById("header").innerHTML = "Support: #" + new URL(document.URL).searchParams.get("room");
  ROOMNAME = new URL(document.URL).searchParams.get("room");
}
function sendMsg() {
  let inp = document.getElementById("msgInp");
  let match = inp.value.match("^!alias @(.+)");
  if (match) {
    source.close();
    document.getElementById("userList").innerHTML = ``;
    send(JSON.stringify({ action: "realias", data: { alias: match[1] } }), (res) => {
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
    }, true);
  } else
    send(JSON.stringify({ action: "sendMsg", data: { msg: inp.value, room: ROOMNAME } }), () => {
    }, true);
  inp.value = "";
}
const rmvReg = /(>|^)\-(.+)\([0-9]\)>/gm;
const addReg = /(>|^)\+(.+)\([0-9]\)>/gm;
const classStr = ["error", "user", "admin", "superadmin"];
let source = null;
async function initClient() {
  try {
    console.log("Starting client.");
    source = new WebSocket("wss://" + new URL(document.URL).host + "?room=" + new URL(document.URL).searchParams.get("room"));
    source.onmessage = (message) => {
      console.log("Got", message);
      message = JSON.parse(message.data);
      ele = document.getElementById("userList");
      let action = message.action;
      if (message.action == "CONNECTIONID") {
        CONNECTIONID = message.data.id;
      }
      if (message.action == "RELOAD") {
        document.getElementById("msgArea").innerHTML = `<h2 id="placeholder">
        <span class="material-symbols-outlined">update</span> 
        Reloading your messages, a moment please...</h2>`;
        document.getElementById("userList").innerHTML = "";
        LOADEDQ2 = false;
        STARTID = -1;
        STARTIDVALID = false;
        UNREAD = 0;
        loadStatus = -1;
      }
      if (message.action == "LOADCOMPLETE") {
        let thing = document.getElementById("msgArea");
        if (message.data.id < 0) {
          let errorEle = document.createElement("b");
          errorEle.className = "red";
          errorEle.innerText = "No more messages to load";
          errorEle.style.display = "block";
          thing.prepend(errorEle);
        } else {
          loadStatus = -1;
          STARTID = message.data.id;
        }
        thing.scrollTop = thing.scrollTop + 100;
      }
      if (message.action == "removeUser") {
        ele.innerHTML = ele.innerHTML.replace(message.data.user + "<br>", "");
      }
      if (message.action == "addUser") {
        ele.innerHTML += message.data.user + "<br>";
      }
      let modif = "";
      console.log(modif);
      let area = document.getElementById("msgArea");
      ele = document.createElement("p");
      let scrDistOKQ = area.scrollTop >= area.scrollHeight - area.offsetHeight - 100;
      let msgs = modif.split(">");
      if (message.action == "msg") {
        matches = ["ERROR", message.data.id, message.data.sender, message.data.perms, message.data.content];
        if (!matches)
          return;
        PREPENDFLAG = false;
        if (STARTID < 0) {
          STARTID = Number(matches[1]);
          STARTIDVALID = true;
        }
        if (matches[1][0] == "-") {
          PREPENDFLAG = true;
          if (loadStatus == 0)
            loadStatus = 1;
        }
        let newMsgSender = document.createElement("b");
        newMsgSender.innerText = matches[2];
        newMsgSender.className = classStr[matches[3]];
        let ctn = document.createElement("div");
        ctn.id = matches[1];
        ctn.className = "msgContainer";
        if (!PREPENDFLAG)
          ctn.appendChild(newMsgSender);
        let msg = " " + matches[4].replaceAll("&gt;", ";gt;").replaceAll(">", ";gt;");
        for (let i = 0; i < replacements.length; i++) {
          msg = msg.replaceAll(`:${replacements[i].from}:`, ">EMOJI" + replacements[i].to + ">");
        }
        let slashMe = false;
        msg = msg.replaceAll(/(&[a-zA-Z0-9]{1,20})([^;]|$)/gm, ">ROOM$1>$2");
        msg = msg.replaceAll(/(#[a-zA-Z0-9_\-]{1,20})([^;]|$)/gm, ">SUPPORT$1>$2");
        msg = msg.replaceAll(/(;gt;;gt;[^ ]{0,90})/gm, ">INTERNALLINK$1>");
        msg = msg.replaceAll(/((http|ftp|https):\/\/)?(?<test>([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/gmiu, ">LINK$<test>>");
        msg = msg.replaceAll(/\\n/gmiu, ">BR>");
        console.log(msg);
        if (msg.match("^[ \n]*/me(.*)")) {
          msg = msg.match("^[ \n]*/me(.*)")[1];
          slashMe = true;
          ele.className += " slashMe " + classStr[matches[3]];
        } else
          ele.className = classStr[matches[3]];
        let split = msg.split(">");
        let out = "";
        for (let i = 0; i < split.length; i++) {
          if (i % 2 == 0) {
            let fragment = document.createTextNode(split[i].replaceAll(";gt;", ">"));
            fragment.className = classStr[matches[3]];
            ele.appendChild(fragment);
          } else {
            let pref = split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR)")[1];
            let post = pref != "BR" ? split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|INTERNALLINK|BR)(.+)")[2] : "";
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
              replaced.href = "https://euphoria.io/room/" + post.slice(1);
              replaced.innerText = post;
              ele.appendChild(replaced);
            } else if (pref == "SUPPORT") {
              let replaced = document.createElement("a");
              replaced.className = "supportMsg " + classStr[matches[3]];
              replaced.href = "/support?room=" + post.slice(1);
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
        if (!PREPENDFLAG) {
          ctn.appendChild(ele);
          ctn.appendChild(document.createElement("br"));
          area.appendChild(ctn);
        } else {
          ctn.prepend(document.createElement("br"));
          ctn.prepend(ele);
          ctn.prepend(newMsgSender);
          area.prepend(ctn);
        }
        document.getElementById("placeholder").style.display = "none";
        if (!FOCUSSED) {
          UNREAD++;
          document.title = "(" + UNREAD + ") | Support | BetaOS Systems";
        }
      }
      if (!LOADEDQ2 || scrDistOKQ) {
        area.scrollTop = area.scrollHeight;
        console.log("Scrolling to bottom.");
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
  for (let i = 0; i < replacements.length; i++) {
    if (replacements[i].to == thing)
      return replacements[i].from;
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
function onScroll() {
  if (document.getElementById("msgArea").scrollTop < 30 && STARTIDVALID && loadStatus < 0) {
    loadStatus = 0;
    console.log("loading messages from" + STARTID);
    send(JSON.stringify({ action: "loadLogs", data: { room: ROOMNAME, id: CONNECTIONID, from: STARTID } }), () => {
    });
  } else if (document.getElementById("msgArea").scrollTop < 30)
    console.log("loadStatus" + loadStatus);
}
let loadStatus = -1;
//# sourceMappingURL=support.js.map
