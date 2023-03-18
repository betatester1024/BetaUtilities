"use strict";
function send(params, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "server", true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(JSON.parse(xhr.responseText));
    }
  };
  xhr.send(params);
}
//# sourceMappingURL=serversend.js.map
