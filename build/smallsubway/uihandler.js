"use strict";
K.dialog_TIME = 1;
let dialogIDs = ["time"];
function opendialog(toOpen) {
  for (let id of dialogIDs) {
    let dialog = byId(id);
    if (dialog == toOpen) {
    } else {
      dialog.style.opacity = 0;
      dialog.style.touchEvents = "none";
    }
  }
}
//# sourceMappingURL=uihandler.js.map
