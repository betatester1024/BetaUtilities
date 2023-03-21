"use strict";
function onLoad() {
  validateLogin("refresh", "");
  validateLogin("refresh_users", "");
  document.getElementById("alert").hidden = true;
  document.getElementById("h1").hidden = true;
  let match = document.cookie.match("__Secure-user=(.+)");
  if (match)
    CURRUSER = match[1];
  match = document.cookie.match("__Secure-perms=([0-9]+)");
  if (match)
    CURRPERMS = match[1];
  document.getElementById("header").innerHTML = "Support: #" + document.URL.match("\\?room=(.*)")[1];
}
let LOADEDQ2 = false;
async function initClient() {
  try {
    console.log("Starting client.");
    const source = new EventSource("/stream?room=" + document.URL.match("\\?room=([0-9a-zA-Z\\-_]{1,20})$")[1] + "&token=" + sessionID);
    source.addEventListener("message", (message) => {
      console.log("Got", message);
      ele = document.getElementById("users");
      let modif = message.data;
      let removed = modif.match("^\\-(.+)\\\\n");
      let added = modif.match("^\\+(.+)\\\\n");
      while (removed || added) {
        if (removed) {
          ele.innerHTML = ele.innerHTML.replace(removed[1] + "<br>", "");
          console.log("removed" + removed[1]);
        }
        if (added) {
          ele.innerHTML += added[1] + "<br>";
          console.log("added" + added[1]);
        }
        modif = modif.replaceAll(/^\-(.+)\\n/gm, "");
        modif = modif.replaceAll(/^\+(.+)\\n/gm, "");
        removed = modif.match("^\\-(.+)\\\\n");
        added = modif.match("^\\+(.+)\\\\n");
      }
      ele = document.getElementById("msgArea");
      let scrDistOKQ = ele.scrollTop >= ele.scrollHeight - ele.offsetHeight - 100;
      document.getElementById("msgArea").innerHTML += modif;
      if (!LOADEDQ2 || scrDistOKQ) {
        ele.scrollTop = ele.scrollHeight;
        LOADEDQ2 = true;
      }
    });
  } catch (e) {
    console.log("Restartng client (" + e + ")");
    setTimeout(initClient, 0);
  }
}
//# sourceMappingURL=support.js.map
