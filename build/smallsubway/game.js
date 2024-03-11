"use strict";
const K = {
  MOVING: 1,
  STOPPED: 2,
  NOHOLD: 0,
  HOLD: 1,
  HOLD_NEWLINE: 2,
  HOLD_CONNECTION: 3,
  HOLD_EXTEND: 4,
  WAITING: 0,
  ONTHEWAY: 1,
  SETTINGSHEIGHT: 50,
  DELAYPERPASSENGER: 400,
  INF: 9e99,
  PI: Math.PI,
  ANIM_SETTINGSDIALOG: 100,
  FAILTIME: 3e4,
  PCTPERTICK: 1 / 3e4,
  LINEWIDTH: 10,
  LINEACCEPTDIST: 20,
  NOACTION: 0,
  BOARDPENDING: 1,
  DEBOARDPENDING: 2,
  TRANSFERPENDING: 3
};
let paused = false;
const trainSpeed = 100 / 1e3;
let holdState = K.NOHOLD;
let activeSettingsDialog = null;
let ctx = null;
let canv = null;
let startTick = -1;
let startTime = -1;
let totalScaleFac = 1;
let minSclFac = 0.5;
const maxSclFac = 3;
let hovering = null, hoveringConn = null;
let modifyingConn = null;
let stops = [];
let recentlyRemoved = [];
let connections = [];
let lineTypes = [];
let passengers = [];
let lines = [];
let lineCt = 0;
let trains = [];
let typesOnLine = [];
let passengersServed = 0;
let extendInfo = null;
let asyncEvents = [];
let viewportW = 0;
let viewportH = 0;
let viewportMax, viewportMin;
let currPath = [];
let downPt = null;
let currPos_canv = { x: 0, y: 0 };
let maxUnlockedType = 0;
const acceptRadius = 30;
const stopSz = 17;
let adj = [];
let defaultClr = "#555";
const colours = ["green", "yellow", "blue", "orange", "purple", "grey"];
let DEBUG = true;
let globalTicks = 0;
let currSpeed = 2;
function onLoad() {
}
function timeNow() {
  return globalTicks;
}
function togglePause() {
  paused = !paused;
  redraw();
  if (!paused) {
    requestAnimationFrame(tickLoop);
  }
}
function getNextStop(currTrain, actQ = true) {
  let line = lines[currTrain.lineID];
  let currToIdx = line.path.indexOf(nearestStop(currTrain.to, 1));
  if (currTrain.revDir && currToIdx == 0) {
    if (line.loopingQ) {
      nextStop = line.path[line.path.length - 2];
    } else {
      if (actQ)
        currTrain.revDir = !currTrain.revDir;
      nextStop = line.path[1];
    }
  } else if (!currTrain.revDir && currToIdx == line.path.length - 1) {
    nextStop = line.path[line.path.length - 2];
    if (actQ)
      currTrain.revDir = !currTrain.revDir;
  } else if (currTrain.revDir) {
    nextStop = line.path[currToIdx - 1];
  } else
    nextStop = line.path[currToIdx + 1];
  if (!nextStop)
    debugger;
  return nearestStop(nextStop, 1);
}
function handlePassenger(pass) {
  if (pass.status != K.WAITING)
    return;
  let minRouteLength = K.INF;
  for (let l = 0; l < pass.from.linesServed.size; l++) {
    let lIdx = Array.from(pass.from.linesServed)[l];
    for (let i = 0; i < typesOnLine.length; i++) {
      if (!typesOnLine[i].has(pass.to))
        continue;
      if (minRouteLength > adj[lIdx][i].val) {
        minRouteLength = adj[lIdx][i].val;
        pass.route = [];
        for (let e of adj[lIdx][i].route)
          pass.route.push(e);
      }
    }
  }
}
function getAssociatedConnection(train) {
  for (let cn of connections) {
    if (samePt(cn.to, train.to) && samePt(cn.from, train.from) || samePt(cn.from, train.to) && samePt(cn.to, train.from)) {
      if (cn.lineID == train.lineID)
        return cn;
    }
  }
  return null;
}
function populateStops() {
  for (let i = 0; i < stops.length; i++) {
    if (Math.random() < 0.4)
      continue;
    let toAdd = Math.floor(Math.random() * stops.length / 3) + 1;
    for (let j = 0; j < toAdd; j++) {
      let stopAdded = Math.floor(Math.random() * stops.length);
      let currType = getNextType(stops[stopAdded].type);
      let pass = {
        from: stops[stopAdded],
        to: currType,
        route: [],
        status: K.WAITING,
        actionStatus: K.NOACTION,
        train: null,
        stop: null
      };
      passengers.push(pass);
      handlePassenger(pass);
      stops[stopAdded].waiting.push(pass);
      let stop = stops[stopAdded];
      if (stop.waiting.length > stop.capacity && !stop.failing) {
        stop.failing = true;
        stop.failureTimer = 0;
      }
    }
  }
}
function preLoad() {
  vis(() => {
    if (vis())
      document.title = "thing";
    else {
      paused = true;
      document.title = "thing (paused)";
    }
  });
  canv = byId("canv");
  ctx = canv.getContext("2d");
  registerMaximisingCanvas("canv", 1, 0.95, redraw);
  if ((docURL.searchParams.get("debug") ?? "yesplease").match(/false|no|beans/)) {
    DEBUG = false;
  }
  canv.addEventListener("pointermove", onmove);
  canv.addEventListener("pointerdown", pointerdown);
  window.addEventListener("keydown", keyUpdate);
  window.addEventListener("keyup", keyUpdate);
  window.addEventListener("pointerup", (e) => {
    routeConfirm(e);
    onmove(e);
  });
  canv.addEventListener("wheel", onWheel);
  updateMinScl();
  for (let i = 0; i < 3; i++) {
    addNewStop(i);
  }
  totalScaleFac *= 0.8;
  scale(totalScaleFac);
  translate(canv.width / 2, canv.height / 2);
  redraw();
  requestAnimationFrame(tickLoop);
  requestAnimationFrame(animLoop);
  startTick = timeNow();
  startTime = Date.now();
  asyncEvents.push({ fcn: stopPopulationLoop, time: timeNow() + 5e3 / currSpeed });
}
function animLoop() {
  let delta = Date.now() - startTime;
  startTime = Date.now();
  redraw(delta);
  requestAnimationFrame(animLoop);
}
function tickLoop() {
  globalTicks += 16.66667 * currSpeed;
  for (let i = 0; i < asyncEvents.length; i++) {
    if (timeNow() > asyncEvents[i].time) {
      asyncEvents[i].fcn();
      asyncEvents.splice(i, 1);
      i--;
    }
  }
  for (let i = 0; i < trains.length; i++) {
    let currTrain = trains[i];
    let distTotal = distBtw(trains[i].to, trains[i].from);
    let distTravelled = (timeNow() - currTrain.startT) * trainSpeed;
    let percentCovered = distTravelled / distTotal;
    if (percentCovered < 0)
      continue;
    if (percentCovered >= 1) {
      let startT = timeNow();
      percentCovered = 0;
      let currentTo = trains[i].to;
      let currStop = nearestStop(currentTo, 1);
      let delay = dropOff(currTrain, currentTo) * K.DELAYPERPASSENGER / currSpeed;
      let reverseQ = true;
      let nextStop2 = null;
      let prevStop = currTrain.from;
      nextStop2 = getNextStop(currTrain);
      currStop = nearestStop(currentTo, 1);
      let upcomingLinesServed = new Set(JSON.parse(JSON.stringify([...currStop.linesServed])));
      for (let j = 0; j < currTrain.passengers.length; j++) {
        let pass = currTrain.passengers[j];
        if (pass.route.length > 0 && pass.status == K.ONTHEWAY && pass.actionStatus == K.NOACTION && upcomingLinesServed.has(pass.route[0])) {
          pass.actionStatus = K.TRANSFERPENDING;
          pass.stop = currStop;
          pass.train = currTrain;
          pass.route.shift();
          delay += K.DELAYPERPASSENGER / currSpeed;
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
        let pass = currStop.waiting[j];
        if (currStop.waiting[j].actionStatus != K.NOACTION)
          continue;
        if (pass.route.length > 0 && upcomingLinesServed.has(pass.route[0])) {
          currStop.waiting[j].actionStatus = K.BOARDPENDING;
          currStop.waiting[j].stop = currStop;
          currStop.waiting[j].train = currTrain;
          delay += K.DELAYPERPASSENGER / currSpeed;
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
        delay += K.DELAYPERPASSENGER / currSpeed;
      }
      if (delay > 0)
        currTrain.startT = K.INF;
      let connBeforeUpdate = getAssociatedConnection(currTrain);
      currTrain.from = currTrain.to;
      currTrain.to = nextStop2;
      handleAwaiting(currTrain, currStop);
      if (timeNow() - startT > 25)
        console.log("WARNING: StopHandler took ", timeNow() - startT + "ms");
    }
    currTrain.x = currTrain.from.x + (currTrain.to.x - currTrain.from.x) * percentCovered;
    currTrain.y = currTrain.from.y + (currTrain.to.y - currTrain.from.y) * percentCovered;
  }
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].failurePct < 0)
      continue;
    let pctRemaining = stops[i].failurePct;
    if (pctRemaining > 1) {
      currSpeed *= 0.99;
    }
  }
  let delta = timeNow() - startTick;
  startTick = timeNow();
  for (let stop of stops) {
    if (stop.failing)
      stop.failurePct += K.PCTPERTICK * delta;
    else
      stop.failurePct = Math.max(0, stop.failurePct - K.PCTPERTICK * delta);
  }
  if (!paused)
    requestAnimationFrame(tickLoop);
}
function handleAwaiting(currTrain, currStop) {
  let handled = false;
  for (const pass of passengers) {
    if (pass.train != currTrain || pass.stop != currStop)
      continue;
    else if (pass.actionStatus == K.NOACTION)
      continue;
    else if (currTrain.passengers.length >= currTrain.cap && pass.actionStatus == K.BOARDPENDING) {
      pass.actionStatus = K.NOACTION;
      continue;
    } else if (pass.actionStatus == K.BOARDPENDING) {
      pass.actionStatus = K.NOACTION;
      for (let i = 0; i < currStop.waiting.length; i++)
        if (currStop.waiting[i] == pass) {
          currStop.waiting.splice(i, 1);
          currTrain.passengers.push(pass);
          break;
        }
      if (currStop.waiting.length < currStop.capacity) {
        currStop.failing = false;
      }
      pass.status = K.ONTHEWAY;
      pass.actionStatus = K.NOACTION;
      handled = true;
      break;
    } else if (pass.actionStatus == K.DEBOARDPENDING) {
      pass.actionStatus = K.NOACTION;
      for (let i = 0; i < currTrain.passengers.length; i++)
        if (currTrain.passengers[i] == pass) {
          currTrain.passengers.splice(i, 1);
          break;
        }
      pass.status = K.WAITING;
      if (currStop.waiting.length < currStop.capacity)
        currStop.failing = false;
      pass.actionStatus = K.NOACTION;
      passengersHandled++;
      handled = true;
      break;
    } else if (pass.actionStatus == K.TRANSFERPENDING) {
      pass.actionStatus = K.NOACTION;
      for (let i = 0; i < currTrain.passengers.length; i++)
        if (currTrain.passengers[i] == pass) {
          currTrain.passengers.splice(i, 1);
          currStop.waiting.push(pass);
          break;
        }
      pass.status = K.WAITING;
      pass.actionStatus = K.NOACTION;
      let stop = currStop;
      if (stop.waiting.length > stop.capacity && stop.failurePct < 1)
        stop.failing = true;
      handled = true;
      break;
    } else
      throw "invalid actionStatus!";
  }
  if (handled) {
    let toCall = { fcn: () => {
      handleAwaiting(currTrain, currStop);
    }, time: timeNow() + K.DELAYPERPASSENGER / currSpeed };
    asyncEvents.push(toCall);
  } else {
    currTrain.startT = timeNow();
    for (const affectedConn of connections) {
      if (affectedConn.pendingRemove) {
        let canUpdate = true;
        let currLine = lines[affectedConn.lineID];
        for (affectedTrain of currLine.trains) {
          if (getAssociatedConnection(affectedTrain) == affectedConn) {
            canUpdate = false;
            break;
          }
        }
        if (canUpdate)
          updateToNow(currLine, affectedConn);
      }
    }
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
  asyncEvents.push({ fcn: stopPopulationLoop, time: timeNow() + (5e3 + Math.random() * 7e3) / currSpeed });
}
function addNewStop(type = -1) {
  let newPt;
  if (type < 0)
    type = getNextType();
  if (stops.length > 0)
    do {
      refPt = stops[Math.floor(Math.random() * stops.length)];
      ang = Math.random() * 2 * K.PI;
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
  newPt.failing = false;
  newPt.failurePct = 0;
  newPt.capacity = 6;
  redraw();
}
function keyUpdate(ev) {
}
function terminals(stop) {
  let out = [];
  for (let i = 0; i < lines.length; i++)
    if ((lines[i].path[0] == stop || lines[i].path[lines[i].path.length - 1] == stop) && lines[i].path[0] != lines[i].path[lines[i].path.length - 1])
      out.push(lines[i]);
  return out.length == 0 ? null : out;
}
function updateToNow(currLine, conn) {
  let idx = connections.indexOf(conn);
  connections.splice(idx, 1);
  recentlyRemoved.push({ conn, time: timeNow() });
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
function distBtw(pt1, pt2) {
  function sq(x) {
    return x * x;
  }
  return Math.sqrt(sq(pt1.x - pt2.x) + sq(pt1.y - pt2.y));
}
function getNextType(exclude = -1) {
  let type = Math.floor(Math.random() * (exclude < 0 ? types.length : maxUnlockedType));
  if (type >= exclude && exclude >= 0)
    return type + 1;
  return type;
}
//# sourceMappingURL=game.js.map
