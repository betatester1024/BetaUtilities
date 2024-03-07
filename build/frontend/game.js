"use strict";
const K = {
  MOVING: 1,
  STOPPED: 2,
  NOHOLD: 0,
  HOLD: 1,
  HOLD_NEWLINE: 2,
  WAITING: 0,
  ONTHEWAY: 1,
  DELAYPERPASSENGER: 400,
  INF: 9e99,
  PIANDABIT: Math.PI + 0.1,
  NOACTION: 0,
  BOARDPENDING: 1,
  DEBOARDPENDING: 2,
  TRANSFERPENDING: 3
};
const trainSpeed = 100 / 1e3;
let holdState = K.NOHOLD;
let ctx = null;
let canv = null;
let totalScaleFac = 1;
let hovering = null;
let stops = [];
let connections = [];
let lineTypes = [];
let stopCt = 0;
let minSclFac = 0.5;
const maxSclFac = 3;
let viewportW = 0;
let viewportH = 0;
let viewportMax, viewportMin;
let currPath = [];
let typesOnLine = [];
let trains = [];
let maxUnlockedType = 0;
const acceptRadius = 30;
const stopSz = 20;
let adj = [];
let passengers = [];
let currPos_canv = null;
let lineCt = 0;
let shiftStatus = false;
let downPt = null;
let types = [triangle, square, circ, star];
let defaultClr = "#000";
const colours = ["green", "yellow", "blue", "orange", "purple", "grey"];
let DEBUG = true;
function onLoad() {
}
function getNextStop(currTrain) {
  let currToIdx = currTrain.path.indexOf(nearestStop(currTrain.to, 1));
  if (currTrain.revDir && currToIdx == 0) {
    currTrain.revDir = !currTrain.revDir;
    nextStop = currTrain.from;
  } else if (!currTrain.revDir && currToIdx == currTrain.path.length - 1) {
    nextStop = currTrain.from;
    currTrain.revDir = !currTrain.revDir;
  } else if (currTrain.revDir) {
    nextStop = currTrain.path[currToIdx - 1];
  } else
    nextStop = currTrain.path[currToIdx + 1];
  return nearestStop(nextStop, 1);
}
function handlePassenger(pass2) {
  if (pass2.status != K.WAITING)
    return;
  let minRouteLength = K.INF;
  for (let l = 0; l < pass2.from.linesServed.size; l++) {
    let lIdx = Array.from(pass2.from.linesServed)[l];
    for (let i = 0; i < typesOnLine.length; i++) {
      if (!typesOnLine[i].has(pass2.to))
        continue;
      if (minRouteLength > adj[lIdx][i].val) {
        minRouteLength = adj[lIdx][i].val;
        pass2.route = [];
        for (let e of adj[lIdx][i].route)
          pass2.route.push(e);
      }
    }
  }
}
function redraw() {
  function circle(pt) {
    ctx.save();
    clearCircle(pt, acceptRadius);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, stopSz, 0, K.PIANDABIT * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, acceptRadius, 0, K.PIANDABIT * 2);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
  }
  function clearCircle(pt, rad) {
    ctx.beginPath();
    ctx.fillStyle = getCSSProp("--system-grey3");
    ctx.save();
    ctx.arc(pt.x, pt.y, rad + 2, 0, K.PIANDABIT * 2);
    ctx.clip();
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canv.width, canv.height);
    ctx.restore();
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
  }
  updateMinScl();
  ctx.beginPath();
  ctx.save();
  ctx.resetTransform();
  ctx.fillStyle = getCSSProp("--system-grey3");
  ctx.clearRect(0, 0, canv.width, canv.height);
  ctx.fillRect(0, 0, canv.width, canv.height);
  ctx.restore();
  if (DEBUG) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.moveTo(-viewportW / 2, -viewportH / 2);
    ctx.lineTo(viewportW / 2, -viewportH / 2);
    ctx.lineTo(viewportW / 2, viewportH / 2);
    ctx.lineTo(-viewportW / 2, viewportH / 2);
    ctx.lineTo(-viewportW / 2, -viewportH / 2);
    ctx.stroke();
  }
  ctx.beginPath();
  if (hovering) {
    ctx.save();
    ctx.fillStyle = getCSSProp("--system-green2");
    ctx.beginPath();
    ctx.arc(hovering.x, hovering.y, acceptRadius, 0, K.PIANDABIT * 2);
    ctx.fill();
    clearCircle({ x: hovering.x, y: hovering.y }, stopSz);
    ctx.restore();
  }
  for (let i = 0; i < stops.length; i++) {
    ctx.save();
    if (stops[i].failureTimer > 0) {
    }
    ctx.restore();
    ctx.arc(stops[i].x, stops[i].y, stopSz, 0, K.PIANDABIT * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = defaultClr;
    let out = " ";
    for (let j = 0; j < stops[i].waiting.length; j++) {
      out += stops[i].waiting[j].to.toString();
    }
    ctx.fillText(out, stops[i].x + stopSz, stops[i].y - stopSz / 2);
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y);
  }
  for (let i = 0; i < connections.length; i++) {
    let angBtw = Math.atan2(
      connections[i].to.y - connections[i].from.y,
      connections[i].to.x - connections[i].from.x
    );
    ctx.save();
    ctx.beginPath();
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    ctx.strokeStyle = connections[i].colour;
    ctx.moveTo(
      connections[i].from.x + c * stopSz,
      connections[i].from.y + s * stopSz
    );
    ctx.lineTo(
      connections[i].to.x - c * stopSz,
      connections[i].to.y - s * stopSz
    );
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.lineWidth = 4;
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = defaultClr;
  ctx.stroke();
  for (let i = 1; i < currPath.length; i++) {
    let angBtw = Math.atan2(
      currPath[i].y - currPath[i - 1].y,
      currPath[i].x - currPath[i - 1].x
    );
    ctx.beginPath();
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
    ctx.moveTo(currPath[i - 1].x + c * acceptRadius, currPath[i - 1].y + s * acceptRadius);
    ctx.lineTo(currPath[i].x - c * acceptRadius, currPath[i].y - s * acceptRadius);
    ctx.stroke();
    ctx.strokeStyle = defaultClr;
  }
  ctx.beginPath();
  for (let i = 0; i < currPath.length; i++) {
    ctx.save();
    ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
    circle(currPath[i]);
    ctx.restore();
  }
  for (let i = 0; i < connections.length; i++) {
    clearCircle(connections[i].from, stopSz);
    clearCircle(connections[i].to, stopSz);
    ctx.beginPath();
    ctx.strokeStyle = defaultClr;
    ctx.arc(connections[i].from.x, connections[i].from.y, stopSz, 0, K.PIANDABIT * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(connections[i].to.x, connections[i].to.y, stopSz, 0, K.PIANDABIT * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.restore();
  ctx.beginPath();
  if (holdState == K.HOLD_NEWLINE) {
    let lastPt = currPath[currPath.length - 1];
    let angBtw = Math.atan2(
      currPos_canv.y - lastPt.y,
      currPos_canv.x - lastPt.x
    );
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    let nextStop2 = nearestStop(currPos_canv, acceptRadius);
    if (nextStop2 && samePt(nextStop2, lastPt)) {
      clearCircle(lastPt, acceptRadius);
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.arc(lastPt.x, lastPt.y, stopSz, 0, K.PIANDABIT * 2);
      ctx.stroke();
      circle(lastPt);
      ctx.restore();
    }
    ctx.beginPath();
    if (nextStop2 && samePt(nextStop2, lastPt))
      ;
    else if (nextStop2) {
      angBtw = Math.atan2(
        nextStop2.y - lastPt.y,
        nextStop2.x - lastPt.x
      );
      c = Math.cos(angBtw);
      s = Math.sin(angBtw);
      ctx.moveTo(lastPt.x + c * acceptRadius, lastPt.y + s * acceptRadius);
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineTo(nextStop2.x - c * acceptRadius, nextStop2.y - s * acceptRadius);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = getCSSProp("--system-red");
      ctx.arc(nextStop2.x, nextStop2.y, stopSz, 0, K.PIANDABIT * 2);
      ctx.stroke();
      circle(nextStop2);
      ctx.restore();
    } else {
      ctx.moveTo(lastPt.x + c * acceptRadius, lastPt.y + s * acceptRadius);
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineTo(currPos_canv.x, currPos_canv.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  for (let i = 0; i < stops.length; i++)
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y);
  for (let i = 0; i < trains.length; i++) {
    ctx.beginPath();
    let angBtw = Math.atan2(
      trains[i].to.y - trains[i].from.y,
      trains[i].to.x - trains[i].from.x
    );
    let nStop = nearestStop(trains[i].to, stopSz);
    if (nStop) {
      let pctRemaining = distBtw(nStop, trains[i].to) / stopSz;
      let nextTrainTo = getNextStop(trains[i]);
      let angBtw2 = Math.atan2(
        trains[i].to.y - trains[i].from.y,
        trains[i].to.x - trains[i].from.x
      );
    }
    let center = { x: trains[i].x, y: trains[i].y };
    const w = 15;
    const h = 30;
    const c = Math.cos(angBtw);
    const c2 = Math.cos(angBtw + K.PIANDABIT / 2);
    const s = Math.sin(angBtw);
    const s2 = Math.sin(angBtw + K.PIANDABIT / 2);
    ctx.save();
    ctx.fillStyle = getCSSProp("--system-grey");
    ctx.moveTo(center.x + c * h / 2 + c2 * w / 2, center.y + s * h / 2 + s2 * w / 2);
    ctx.lineTo(center.x + c * h / 2 - c2 * w / 2, center.y + s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 - c2 * w / 2, center.y - s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 + c2 * w / 2, center.y - s * h / 2 + s2 * w / 2);
    ctx.fill();
    ctx.fillStyle = defaultClr;
    let str = "";
    for (let pass2 of trains[i].passengers)
      str += pass2.to.toString();
    ctx.fillText(str, center.x, center.y);
    ctx.restore();
  }
}
function registerMaximisingCanvas(id, widthPc, heightPc, redrawFcn) {
  window.addEventListener("resize", (ev) => {
    canv.width = window.innerWidth * widthPc;
    canv.height = window.innerHeight * heightPc;
    applyTransfm();
    redrawFcn();
  });
  canv.style.height = 100 * heightPc + "vh";
  canv.style.width = 100 * widthPc + "vw";
  canv.width = window.innerWidth * widthPc;
  canv.height = window.innerHeight * heightPc;
  redrawFcn();
}
function populateStops() {
  for (let i = 0; i < stops.length; i++) {
    if (Math.random() < 0.4)
      continue;
    let toAdd = Math.floor(Math.random() * stops.length / 3) + 1;
    for (let j = 0; j < toAdd; j++) {
      let stopAdded = Math.floor(Math.random() * stops.length);
      let currType = getNextType(stops[stopAdded].type);
      let pass2 = {
        from: stops[stopAdded],
        to: currType,
        route: [],
        status: K.WAITING,
        actionStatus: K.NOACTION,
        train: null,
        stop: null
      };
      passengers.push(pass2);
      handlePassenger(pass2);
      stops[stopAdded].waiting.push(pass2);
      if (stops[stopAdded].waiting.length > stops[stopAdded].capacity)
        stops[stopAdded].failureTimer = Date.now();
    }
  }
}
function preLoad() {
  canv = byId("canv");
  ctx = canv.getContext("2d");
  registerMaximisingCanvas("canv", 1, 0.95, redraw);
  if ((docURL.searchParams.get("debug") ?? "yesplease").match(/false|no|beans/)) {
    DEBUG = false;
  }
  canv.addEventListener("pointermove", onmove);
  canv.addEventListener("pointerdown", (ev) => {
    holdState = K.HOLD;
    downPt = { x: ev.clientX, y: ev.clientY };
    let actualPos = fromCanvPos(ev.clientX, ev.clientY);
    let nStop = nearestStop(actualPos, acceptRadius);
    if (nStop && colours.length > 0) {
      holdState = K.HOLD_NEWLINE;
      currPath = [nStop];
      redraw();
    }
    if (holdState == K.HOLD) {
      document.body.style.cursor = "grabbing";
    }
  });
  window.addEventListener("keydown", keyUpdate);
  window.addEventListener("keyup", keyUpdate);
  window.addEventListener("pointerup", pointerUp);
  canv.addEventListener("wheel", (ev) => {
    let sclFac = ev.deltaY < 0 ? 1.15 : 1 / 1.15;
    if (sclFac * totalScaleFac > maxSclFac)
      sclFac = maxSclFac / totalScaleFac;
    if (sclFac * totalScaleFac < minSclFac)
      sclFac = minSclFac / totalScaleFac;
    translate(-ev.clientX, -ev.clientY);
    scale(sclFac);
    translate(ev.clientX, ev.clientY);
    totalScaleFac *= sclFac;
    redraw();
  });
  updateMinScl();
  for (let i = 0; i < 3; i++) {
    addNewStop(i);
  }
  totalScaleFac *= 0.8;
  redraw();
  scale(totalScaleFac);
  redraw();
  translate(canv.width / 2, canv.height / 2);
  redraw();
  requestAnimationFrame(animLoop);
  startTime = Date.now();
  setTimeout(stopPopulationLoop, 5e3);
}
function animLoop() {
  for (let i = 0; i < trains.length; i++) {
    let currTrain = trains[i];
    let distTotal = distBtw(trains[i].to, trains[i].from);
    let distTravelled = (Date.now() - currTrain.startT) * trainSpeed;
    let percentCovered = distTravelled / distTotal;
    if (percentCovered < 0)
      continue;
    if (percentCovered >= 1) {
      let startT = Date.now();
      percentCovered = 0;
      let currentTo = trains[i].to;
      let currStop = nearestStop(currentTo, 1);
      currTrain.onCompletion = currTrain.passengers.length;
      let delay = dropOff(currTrain, currentTo) * K.DELAYPERPASSENGER;
      let reverseQ = true;
      let nextStop2 = null;
      nextStop2 = getNextStop(currTrain);
      currStop = nearestStop(currentTo, 1);
      let upcomingLinesServed = new Set(JSON.parse(JSON.stringify([...currStop.linesServed])));
      for (let j = 0; j < currTrain.passengers.length; j++) {
        let pass2 = currTrain.passengers[j];
        if (pass2.route.length > 0 && pass2.status == K.ONTHEWAY && pass2.actionStatus == K.NOACTION && upcomingLinesServed.has(pass2.route[0])) {
          pass2.actionStatus = K.TRANSFERPENDING;
          pass2.stop = currStop;
          pass2.train = currTrain;
          pass2.route.shift();
          delay += K.DELAYPERPASSENGER;
        }
      }
      for (let j = 0; j < connections.length; j++) {
        if (connections[j].lineID == currTrain.lineID) {
          let fStop = nearestStop(connections[j].from, 1);
          let tStop = nearestStop(connections[j].to, 1);
          for (const nextLine of fStop.linesServed)
            upcomingLinesServed.add(nextLine);
          for (const nextLine of tStop.linesServed)
            upcomingLinesServed.add(nextLine);
        }
      }
      for (let j = 0; j < currStop.waiting.length; j++) {
        let pass2 = currStop.waiting[j];
        if (currStop.waiting[j].actionStatus != K.NOACTION)
          continue;
        if (pass2.route.length > 0 && upcomingLinesServed.has(pass2.route[0])) {
          currStop.waiting[j].actionStatus = K.BOARDPENDING;
          currStop.waiting[j].stop = currStop;
          currStop.waiting[j].train = currTrain;
          delay += K.DELAYPERPASSENGER;
        }
      }
      for (let k = 0; k < currStop.waiting.length; k++) {
        if (currStop.waiting[k].actionStatus != K.NOACTION)
          continue;
        if (typesOnLine[currTrain.lineID].has(currStop.waiting[k].to)) {
          let adding = currStop.waiting[k];
          currStop.waiting[k].actionStatus = K.BOARDPENDING;
          currStop.waiting[k].stop = currStop;
          currStop.waiting[k].train = currTrain;
        }
        delay += K.DELAYPERPASSENGER;
      }
      if (delay > 0)
        currTrain.startT = K.INF;
      handleAwaiting(currTrain, currStop);
      currTrain.from = currTrain.to;
      currTrain.to = nextStop2;
      if (Date.now() - startT > 25)
        console.log("WARNING: StopHandler took ", Date.now() - startT + "ms");
    }
    currTrain.x = currTrain.from.x + (currTrain.to.x - currTrain.from.x) * percentCovered;
    currTrain.y = currTrain.from.y + (currTrain.to.y - currTrain.from.y) * percentCovered;
  }
  redraw();
  requestAnimationFrame(animLoop);
}
function handleAwaiting(currTrain, currStop) {
  let handled = false;
  for (const pass2 of passengers) {
    if (pass2.train != currTrain || pass2.stop != currStop)
      continue;
    else if (pass2.actionStatus == K.NOACTION)
      continue;
    else if (currTrain.passengers.length >= currTrain.cap && pass2.actionStatus == K.BOARDPENDING) {
      pass2.actionStatus = K.NOACTION;
      continue;
    } else if (pass2.actionStatus == K.BOARDPENDING) {
      pass2.actionStatus = K.NOACTION;
      for (let i = 0; i < currStop.waiting.length; i++)
        if (currStop.waiting[i] == pass2) {
          currStop.waiting.splice(i, 1);
          currTrain.passengers.push(pass2);
          break;
        }
      pass2.status = K.ONTHEWAY;
      pass2.actionStatus = K.NOACTION;
      handled = true;
      break;
    } else if (pass2.actionStatus == K.DEBOARDPENDING) {
      pass2.actionStatus = K.NOACTION;
      for (let i = 0; i < currTrain.passengers.length; i++)
        if (currTrain.passengers[i] == pass2) {
          currTrain.passengers.splice(i, 1);
          break;
        }
      pass2.status = K.WAITING;
      pass2.actionStatus = K.NOACTION;
      handled = true;
      break;
    } else if (pass2.actionStatus == K.TRANSFERPENDING) {
      pass2.actionStatus = K.NOACTION;
      for (let i = 0; i < currTrain.passengers.length; i++)
        if (currTrain.passengers[i] == pass2) {
          currTrain.passengers.splice(i, 1);
          currStop.waiting.push(pass2);
          break;
        }
      pass2.status = K.WAITING;
      pass2.actionStatus = K.NOACTION;
      handled = true;
      break;
    } else
      throw "invalid actionStatus!";
  }
  if (handled)
    setTimeout(() => {
      handleAwaiting(currTrain, currStop);
    }, K.DELAYPERPASSENGER);
  else {
    currTrain.startT = Date.now();
  }
}
function dropOff(currTrain, pt) {
  let stop = nearestStop(pt, 1);
  let matching = 0;
  for (let i = 0; i < currTrain.passengers.length; i++)
    if (currTrain.passengers[i].to == stop.type && currTrain.passengers[i].actionStatus == K.NOACTION) {
      matching++;
      currTrain.passengers[i].actionStatus = K.DEBOARDPENDING;
      currTrain.passengers[i].stop = stop;
      currTrain.passengers[i].train = currTrain;
    }
  return matching;
}
function stopPopulationLoop() {
  populateStops();
  redraw();
  setTimeout(stopPopulationLoop, 5e3 + Math.random() * 7e3);
}
function updateMinScl(newVal = minSclFac) {
  minSclFac = newVal;
  viewportW = canv.width / minSclFac * 0.4;
  viewportH = canv.height / minSclFac * 0.4;
  viewportMax = Math.max(viewportW, viewportH);
  viewportMin = Math.min(viewportW, viewportH);
}
function addNewStop(type = -1) {
  let newPt;
  if (type < 0)
    type = getNextType();
  if (stops.length > 0)
    do {
      refPt = stops[Math.floor(Math.random() * stops.length)];
      ang = Math.random() * 2 * K.PIANDABIT;
      dist = 150 + Math.random() * 100;
      newPt = { x: refPt.x + dist * Math.cos(ang), y: refPt.y + dist * Math.sin(ang) };
    } while (!(!nearestStop(newPt, 150) && withinViewport(newPt)));
  else
    newPt = genRandomPt();
  stops.push(newPt);
  maxUnlockedType = Math.max(maxUnlockedType, type);
  updateMinScl(minSclFac * 0.98);
  newPt.waiting = [];
  newPt.linesServed = /* @__PURE__ */ new Set();
  newPt.type = type;
  newPt.toAdd = [];
  newPt.capacity = 8;
  redraw();
}
function keyUpdate(ev) {
}
function onmove(ev) {
  hovering = null;
  currPos_canv = fromCanvPos(ev.clientX, ev.clientY);
  if (holdState == K.HOLD) {
    translate(ev.movementX, ev.movementY);
    redraw();
  }
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  let nStop = nearestStop(actualPos, acceptRadius);
  if (holdState == K.HOLD_NEWLINE) {
    let lastStop = currPath[currPath.length - 1];
    if (nStop) {
      let canAdd = true;
      for (let i = 0; i < currPath.length && canAdd; i++) {
        if (samePt(currPath[i], nStop))
          canAdd = false;
      }
      if (!canAdd && currPath.length > 2 && samePt(nStop, currPath[0]) && !samePt(nStop, lastStop)) {
        canAdd = true;
        holdState = K.NOHOLD;
      }
      if (canAdd) {
        currPath.push(nStop);
      }
    }
    redraw();
  } else if (nStop) {
    hovering = nStop;
    document.body.style.cursor = "pointer";
  } else if (holdState == K.NOHOLD)
    document.body.style.cursor = "";
}
function pointerUp(ev) {
  holdState = K.NOHOLD;
  document.body.style.cursor = holdState == K.HOLD ? "grab" : "";
  if (currPath.length > 1) {
    let currCol = getCSSProp("--system-" + colours[0]);
    colours.shift();
    for (let i = 1; i < currPath.length; i++) {
      connections.push({
        from: currPath[i - 1],
        to: currPath[i],
        colour: currCol,
        lineID: lineCt
      });
    }
    let supportedTypes = /* @__PURE__ */ new Set();
    for (let i = 0; i < currPath.length; i++) {
      supportedTypes.add(currPath[i].type);
      currPath[i].linesServed.add(lineCt);
    }
    typesOnLine.push(supportedTypes);
    adj = [];
    for (let i = 0; i < typesOnLine.length; i++) {
      let row = [];
      for (let j = 0; j < typesOnLine.length; j++) {
        row.push({ route: [], val: K.INF });
      }
      adj.push(row);
    }
    for (let i = 0; i < stops.length; i++) {
      let served = Array.from(stops[i].linesServed);
      for (let j = 0; j < served.length; j++) {
        for (let k = 0; k < served.length; k++) {
          adj[served[j]][served[k]].val = 1;
          adj[served[j]][served[k]].route = [served[k]];
          adj[served[k]][served[j]].val = 1;
          adj[served[k]][served[j]].route = [served[j]];
        }
      }
      for (let j = 0; j < served.length; j++) {
        adj[served[j]][served[j]].val = 0;
        adj[served[j]][served[j]].route = [];
      }
    }
    for (let k = 0; k < adj.length; k++) {
      for (let j = 0; j < adj.length; j++) {
        for (let i = 0; i < adj.length; i++) {
          if (i == k || j == k)
            continue;
          let newCost = adj[i][k].val + adj[k][j].val;
          if (newCost < adj[i][j].val) {
            adj[i][j].val = newCost;
            adj[i][j].route = [];
            for (let n = 0; n < adj[i][k].route.length; n++)
              adj[i][j].route.push(adj[i][k].route[n]);
            for (let n = 0; n < adj[k][j].route.length; n++)
              adj[i][j].route.push(adj[k][j].route[n]);
          }
        }
      }
    }
    console.log("==== RECALCULATION SUCCESS ====");
    for (pass of passengers) {
      handlePassenger(pass);
    }
    trains.push({
      x: currPath[0].x,
      y: currPath[0].y,
      from: currPath[0],
      to: currPath[1],
      path: currPath,
      lineID: lineCt,
      colour: currCol,
      startT: Date.now(),
      status: K.MOVING,
      passengers: [],
      cap: 12,
      revDir: false,
      toAdd: [],
      toRemove: [],
      onCompletion: 0
    });
    trains.push({
      x: currPath[0].x,
      y: currPath[0].y,
      from: currPath[currPath.length - 1],
      to: currPath[currPath.length - 2],
      path: currPath,
      lineID: lineCt,
      colour: currCol,
      startT: Date.now(),
      status: K.MOVING,
      passengers: [],
      cap: 12,
      revDir: true,
      toAdd: [],
      toRemove: [],
      onCompletion: 0
    });
    lineCt++;
  }
  currPath = [];
  redraw();
  if (!downPt || distBtw({ x: ev.clientX, y: ev.clientY }, downPt) > 10)
    return;
  ctx.beginPath();
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  ctx.moveTo(actualPos.x - 0.5, actualPos.y - 0.5);
  ctx.lineTo(actualPos.x + 0.5, actualPos.y + 0.5);
  ctx.stroke();
  ctx.fillText(actualPos.x.toFixed(2) + ", " + actualPos.y.toFixed(2), actualPos.x, actualPos.y);
}
function samePt(pt1, pt2) {
  return Math.abs(pt1.x - pt2.x) < 0.1 && Math.abs(pt1.y - pt2.y) < 0.1;
}
function genRandomPt() {
  return {
    x: Math.random() * viewportW - viewportW / 2,
    y: Math.random() * viewportH - viewportH / 2
  };
}
function nearestStop(newPt, minDist) {
  let found = null;
  for (let i = 0; i < stops.length; i++) {
    let dist2 = distBtw(stops[i], newPt);
    if (dist2 < minDist) {
      found = stops[i];
      minDist = dist2;
    }
  }
  return found;
}
function withinViewport(newPt) {
  if (newPt.x < -viewportW / 2)
    return false;
  if (newPt.x > viewportW / 2)
    return false;
  if (newPt.y < -viewportH / 2)
    return false;
  if (newPt.y > viewportH / 2)
    return false;
  return true;
}
function distBtw(pt1, pt2) {
  function sq(x) {
    return x * x;
  }
  return Math.sqrt(sq(pt1.x - pt2.x) + sq(pt1.y - pt2.y));
}
let transfm = [
  1,
  0,
  0,
  0,
  1,
  0
];
function translate(x, y) {
  transfm[2] += x;
  transfm[5] += y;
  applyTransfm();
}
function fromCanvPos(canvX, canvY) {
  return { x: (canvX - transfm[2]) / transfm[0], y: (canvY - transfm[5]) / transfm[4] };
}
function scale(scl) {
  for (let i = 0; i < 6; i++)
    transfm[i] *= scl;
  applyTransfm();
}
function applyTransfm() {
  ctx.setTransform(transfm[0], transfm[3], transfm[1], transfm[4], transfm[2], transfm[5]);
}
function triangle() {
}
function square() {
}
function circ() {
}
function star() {
}
function getNextType(exclude = -1) {
  let type = Math.floor(Math.random() * (exclude < 0 ? types.length : maxUnlockedType));
  if (type >= exclude && exclude >= 0)
    return type + 1;
  return type;
}
//# sourceMappingURL=game.js.map
