"use strict";
K.DIALOG_TIME = 0;
K.DIALOG_SHOP = 1;
let dialogIDs = ["timeMenu", "upgrades"];
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
function openDialog(toOpen) {
  for (let id of dialogIDs) {
    let dialog = byId(id);
    if (id == dialogIDs[toOpen]) {
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
  if (holdState == K.HOLD_TRAIN) {
    byId("topBar").style.pointerEvents = "none";
  } else
    byId("topBar").style.pointerEvents = "all";
  byId("time").innerText = (paused ? "(Paused) " : "") + `${padWithZero(time.h)}:${padWithZero(time.m)}`;
  byId("date").innerText = `Day ${padWithZero(time.d)} (year ${time.y + 1})`;
  if (paused)
    byId("playpause").innerHTML = "resume";
  else
    byId("playpause").innerHTML = "pause";
  byId("trainsAvailable").innerText = trainsAvailable;
  let mInner = byId("popInner");
  byId("balance").innerHTML = (balance / 1e3).toFixed(3);
  mInner.style.width = currPopulationPool / basePopulationPool * 50 + "%";
  mInner.innerText = Math.floor(currPopulationPool) + " passengers";
  byId("linesAvailable").innerText = linesAvailable - lines.length;
  if (currPopulationPool > basePopulationPool)
    mInner.style.backgroundColor = "var(--system-red)";
  else
    mInner.style.backgroundColor = "var(--system-green)";
  if (currCost > 0) {
    let costEle = byId("currCost");
    costEle.classList.remove("displayNone");
    costEle.innerText = (currCost / 1e3).toFixed(2).toLocaleString();
    costEle.style.left = currPos_abs.x + 10 + "px";
    costEle.style.top = currPos_abs.y + "px";
    if (overCost)
      costEle.classList.add("overCost");
    else
      costEle.classList.remove("overCost");
  } else
    byId("currCost").classList.add("displayNone");
  setTimeout(HTMLActions, 100);
}
//# sourceMappingURL=uihandler.js.map
