K.DIALOG_TIME = 0;
let dialogIDs = ["time"]
function opendialog(toOpen) {
  for (let id of dialogIDs) {
    let dialog = byId(id);
    if (dialog == toOpen) {
      dialog.style.opacity = 1;
      dialog.style.touchEvents = '';
    } else {
      dialog.style.opacity = 0;
      dialog.style.touchEvents = 'none';
    }
    
    
  }
}

function HTMLActions() {
  byId("pServed").innerText = passengersServed;
  let time = ingametime();
  byId("time").innerText = `${padWithZero(time.d)}d ${padWithZero(time.h)}:${padWithZero(time.m)} (year ${time.y})`;
  if (paused) {
    byId("playpause").innerHTML = "resume";
  }
  else byId("playpause").innerHTML = "pause";
  let mInner = byId("popInner");
  mInner.style.width = (currPopulationPool/basePopulationPool)*50+"%"; // 0% to 200%
  mInner.innerText = Math.floor(currPopulationPool)+" passengers";
  if (currPopulationPool > basePopulationPool) mInner.style.backgroundColor = "var(--system-red)";
  else mInner.style.backgroundColor = "var(--system-green)";
  
  setTimeout(HTMLActions, 100);
}