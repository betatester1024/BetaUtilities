"use strict";
function onLoad() {
  document.getElementById("header").innerHTML = "Support: #" + document.URL.match("\\?room=(.*)")[1];
  ROOMNAME = document.URL.match("\\?room=(.*)")[1];
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
    source = new EventSource("/stream?room=" + document.URL.match("\\?room=([0-9a-zA-Z\\-_]{1,20})$")[1]);
    source.addEventListener("message", (message) => {
      console.log("Got", message);
      ele = document.getElementById("userList");
      let modif = message.data;
      let cnMatch = modif.match(/(>|^)CONNECTIONID ([0-9]+)>/);
      if (cnMatch) {
        CONNECTIONID = cnMatch[2];
      }
      modif = modif.replace(/(>|^)CONNECTIONID ([0-9]+)>/, "");
      let clMatch = modif.match(/(>|^)CONNECTIONRELOAD>/);
      if (clMatch) {
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
      modif = modif.replace(/(>|^)CONNECTIONRELOAD>/, "");
      let lcMatch = modif.match(/LOADCOMPLETE (-?[0-9]+)>/);
      if (lcMatch) {
        let thing = document.getElementById("msgArea");
        if (lcMatch[1] < 0) {
          let errorEle = document.createElement("b");
          errorEle.className = "red";
          errorEle.innerText = "No more messages to load";
          errorEle.style.display = "block";
          thing.prepend(errorEle);
        } else {
          loadStatus = -1;
          STARTID = lcMatch[1];
        }
        thing.scrollTop = thing.scrollTop + 100;
      }
      modif = modif.replace(/LOADCOMPLETE (-?[0-9]+)>/, "");
      let removed = rmvReg.exec(modif);
      let added = addReg.exec(modif);
      while (removed || added) {
        if (removed) {
          ele.innerHTML = ele.innerHTML.replace(removed[2] + "<br>", "");
        }
        if (added) {
          ele.innerHTML += added[2] + "<br>";
        }
        modif = modif.replaceAll(rmvReg, "");
        modif = modif.replaceAll(addReg, "");
        removed = modif.match(rmvReg);
        added = modif.match(addReg);
      }
      console.log(modif);
      let area = document.getElementById("msgArea");
      ele = document.createElement("p");
      let scrDistOKQ = area.scrollTop >= area.scrollHeight - area.offsetHeight - 100;
      let msgs = modif.split(">");
      for (let i = 0; i < msgs.length; i++) {
        let matches = msgs[i].match(/{(-?[0-9]+)}\[(.+)\]\(([0-9])\)(.*)/);
        if (!matches)
          continue;
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
        if (!PREPENDFLAG)
          area.appendChild(newMsgSender);
        let msg = " " + matches[4].replaceAll("&gt;", ";gt;");
        for (let i2 = 0; i2 < replacements.length; i2++) {
          msg = msg.replaceAll(`:${replacements[i2].from}:`, ">EMOJI" + replacements[i2].to + ">");
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
              replaced.href = "https://" + post;
              replaced.innerText = post;
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
              replaced.href = post.slice(8);
              replaced.innerText = ">>" + post.slice(8);
              ele.appendChild(replaced);
            } else if (pref == "BR") {
              ele.appendChild(document.createElement("br"));
            }
          }
        }
        if (!PREPENDFLAG) {
          area.appendChild(ele);
          area.appendChild(document.createElement("br"));
        } else {
          area.prepend(document.createElement("br"));
          area.prepend(ele);
          area.prepend(newMsgSender);
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
    });
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
