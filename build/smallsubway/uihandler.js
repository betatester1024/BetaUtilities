"use strict";
K.DIALOG_TIME = 0;
let dialogIDs = ["timeMenu"];
function toggleDialog(toOpen) {
  for (let id of dialogIDs) {
    let dialog = byId(id);
    if (id == dialogIDs[toOpen]) {
      if (dialog.classList.contains("open"))
        dialog.classList.remove("open");
      else
        dialog.classList.add("open");
    } else {
      dialog.classList.remove("open");
    }
  }
}
function toggleSpeed() {
  currSpeed = currSpeed == 1 ? 2 : 1;
  byId("speed").innerHTML = `Current speed: ${currSpeed}x`;
}
function HTMLActions() {
  byId("pServed").innerText = passengersServed;
  let time = ingametime();
  byId("time").innerText = `${padWithZero(time.d)}d ${padWithZero(time.h)}:${padWithZero(time.m)} (year ${time.y + 1})`;
  if (paused) {
    byId("playpause").innerHTML = "resume";
  } else
    byId("playpause").innerHTML = "pause";
  let mInner = byId("popInner");
  mInner.style.width = currPopulationPool / basePopulationPool * 50 + "%";
  mInner.innerText = Math.floor(currPopulationPool) + " passengers";
  if (currPopulationPool > basePopulationPool)
    mInner.style.backgroundColor = "var(--system-red)";
  else
    mInner.style.backgroundColor = "var(--system-green)";
  setTimeout(HTMLActions, 100);
}
//# sourceMappingURL=uihandler.js.map
