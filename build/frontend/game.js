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
  LINEWIDTH: 10,
  LINEACCEPTDIST: 20,
  NOACTION: 0,
  BOARDPENDING: 1,
  DEBOARDPENDING: 2,
  TRANSFERPENDING: 3
};
const trainSpeed = 100 / 1e3;
let holdState = K.NOHOLD;
let activeSettingsDialog = null;
let ctx = null;
let canv = null;
let startTime = -1;
let totalScaleFac = 1;
let hovering = null, hoveringConn = null;
let stops = [];
let modifyingConn = null;
let recentlyRemoved = [];
let connections = [];
let lineTypes = [];
let stopCt = 0;
let extendInfo = null;
let minSclFac = 0.5;
const maxSclFac = 3;
let viewportW = 0;
let viewportH = 0;
let viewportMax, viewportMin;
let currPath = [];
let typesOnLine = [];
let lines = [];
let trains = [];
let ticketCost = 10;
let passengersServed = 0;
let cash = 0;
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
let defaultClr = "#555";
const colours = ["green", "yellow", "blue", "orange", "purple", "grey"];
let DEBUG = true;
function onLoad() {
}
function bezier(t, p1, p2, p3) {
  return (1 - t) ** 2 * p1 + 2 * (1 - t) * t * p2 + t ** 2 * p3;
}
function parallelStops(cmp) {
  let ct = 0;
  let idx = -1;
  let flipped = 0;
  for (let i = 0; i < connections.length; i++) {
    let cnn = connections[i];
    if (samePt(cnn.from, cmp.from) && samePt(cnn.to, cmp.to) || samePt(cnn.from, cmp.to) && samePt(cnn.to, cmp.from)) {
      if (cmp == cnn && idx == -1) {
        idx = ct;
      }
      if (samePt(cnn.from, cmp.to) && flipped == 0)
        flipped = 1;
      else if (flipped == 0)
        flipped = 2;
      ct++;
    }
  }
  return { idx, flipped: flipped == 1, ct };
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
function handleOffset(connection) {
  let angBtw = Math.atan2(
    connection.to.y - connection.from.y,
    connection.to.x - connection.from.x
  );
  let info = parallelStops(connection);
  let offsetR = K.LINEWIDTH / 2 * (2 * info.idx + 1 - info.ct);
  let newAng = info.flipped ? angBtw + Math.PI : angBtw;
  return { x: offsetR * Math.cos(newAng + Math.PI / 2), y: offsetR * Math.sin(newAng + Math.PI / 2) };
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
function redraw(delta) {
  let fpsCurr = 1e3 / delta;
  ctx.lineCap = "round";
  function circle(pt, clear = true) {
    ctx.save();
    if (clear)
      clearCircle(pt, acceptRadius);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, stopSz, 0, K.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, acceptRadius, 0, K.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
  }
  function clearCircle(pt, rad) {
    ctx.beginPath();
    ctx.fillStyle = getCSSProp("--system-grey3");
    ctx.save();
    ctx.arc(pt.x, pt.y, rad + 2, 0, K.PI * 2);
    ctx.clip();
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canv.width, canv.height);
    ctx.restore();
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
  }
  ctx.strokeStyle = defaultClr;
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
    ctx.fillText(fpsCurr.toFixed(2) + "fps", -viewportW / 2 + 30, -viewportH / 2 + 30);
  }
  ctx.beginPath();
  if (hovering && !activeSettingsDialog) {
    ctx.save();
    ctx.fillStyle = getCSSProp("--system-green2");
    ctx.beginPath();
    ctx.arc(hovering.x, hovering.y, acceptRadius, 0, K.PI * 2);
    ctx.fill();
    clearCircle({ x: hovering.x, y: hovering.y }, stopSz);
    ctx.beginPath();
    ctx.restore();
  }
  if (holdState == K.HOLD_CONNECTION) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = modifyingConn.colour;
    ctx.lineWidth = K.LINEWIDTH;
    ctx.moveTo(modifyingConn.from.x, modifyingConn.from.y);
    ctx.lineTo(currPos_canv.x, currPos_canv.y);
    ctx.moveTo(modifyingConn.to.x, modifyingConn.to.y);
    ctx.lineTo(currPos_canv.x, currPos_canv.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.restore();
  }
  if (holdState == K.HOLD_EXTEND) {
    ctx.save();
    ctx.beginPath();
    let line = extendInfo.line;
    let stop = extendInfo.stop;
    ctx.strokeStyle = line.colour;
    ctx.lineWidth = K.LINEWIDTH;
    ctx.moveTo(stop.x, stop.y);
    ctx.lineTo(currPos_canv.x, currPos_canv.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.restore();
  }
  for (let i = 0; i < stops.length; i++) {
    clearCircle(stops[i], stopSz);
    renderStop(stops[i]);
  }
  for (let i = 0; i < connections.length; i++) {
    let offset = handleOffset(connections[i]);
    let angBtw = Math.atan2(
      connections[i].to.y - connections[i].from.y,
      connections[i].to.x - connections[i].from.x
    );
    ctx.save();
    ctx.lineWidth = K.LINEWIDTH;
    ctx.lineCap = "round";
    if (hoveringConn && hoveringConn != connections[i] || holdState == K.HOLD_CONNECTION || connections[i].pendingRemove)
      ctx.strokeStyle = getCSSProp("--system-grey3");
    else
      ctx.strokeStyle = connections[i].colour;
    ctx.beginPath();
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    ctx.moveTo(
      connections[i].from.x + c * stopSz + offset.x,
      connections[i].from.y + s * stopSz + offset.y
    );
    ctx.lineTo(
      connections[i].to.x - c * stopSz + offset.x,
      connections[i].to.y - s * stopSz + offset.y
    );
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < recentlyRemoved.length; i++) {
    ctx.beginPath();
    ctx.save();
    ctx.strokeStyle = getCSSProp("--system-red");
    if (Date.now() - recentlyRemoved[i].time > 500) {
      recentlyRemoved.splice(i, 1);
      i--;
      continue;
    }
    ctx.globalAlpha = (1 - (Date.now() - recentlyRemoved[i].time) / 500) * 0.5;
    ctx.lineWidth = K.LINEWIDTH;
    ctx.moveTo(recentlyRemoved[i].conn.from.x, recentlyRemoved[i].conn.from.y);
    ctx.lineTo(recentlyRemoved[i].conn.to.x, recentlyRemoved[i].conn.to.y);
    ctx.stroke();
    ctx.beginPath();
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
    ctx.lineWidth = K.LINEWIDTH;
    ctx.moveTo(currPath[i - 1].x + c * acceptRadius, currPath[i - 1].y + s * acceptRadius);
    ctx.lineTo(currPath[i].x - c * acceptRadius, currPath[i].y - s * acceptRadius);
    ctx.stroke();
    ctx.strokeStyle = defaultClr;
  }
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < connections.length; i++) {
    clearCircle(connections[i].from, stopSz);
    clearCircle(connections[i].to, stopSz);
    ctx.beginPath();
    ctx.strokeStyle = defaultClr;
    ctx.arc(connections[i].from.x, connections[i].from.y, stopSz, 0, K.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(connections[i].to.x, connections[i].to.y, stopSz, 0, K.PI * 2);
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
      ctx.arc(lastPt.x, lastPt.y, stopSz, 0, K.PI * 2);
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
      ctx.lineWidth = K.LINEWIDTH;
      ctx.lineTo(nextStop2.x - c * acceptRadius, nextStop2.y - s * acceptRadius);
      ctx.stroke();
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = getCSSProp("--system-red");
      ctx.arc(nextStop2.x, nextStop2.y, stopSz, 0, K.PI * 2);
      ctx.stroke();
      circle(nextStop2);
      ctx.restore();
    } else {
      ctx.moveTo(lastPt.x + c * acceptRadius, lastPt.y + s * acceptRadius);
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineWidth = K.LINEWIDTH;
      ctx.lineTo(currPos_canv.x, currPos_canv.y);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < currPath.length; i++) {
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      circle(currPath[i]);
      ctx.restore();
    }
  }
  for (let i = 0; i < stops.length; i++) {
    ctx.save();
    ctx.beginPath();
    if (stops[i].failureTimer > 0) {
      ctx.fillStyle = getCSSProp("--system-red2");
      let pctRemaining = (Date.now() - stops[i].failureTimer) / K.FAILTIME;
      let pctOneSec = (Date.now() - stops[i].failureTimer) / 300;
      let radScl = 0;
      if (pctOneSec < 1)
        radScl = -4 * (pctOneSec - 0.5) ** 2 + 0.5;
      if (pctRemaining > 1 && pctRemaining < 2) {
        radScl = pctRemaining ** 120;
      }
      let currRad = stopSz + (acceptRadius - stopSz) * 2 + 10 * radScl;
      ctx.beginPath();
      ctx.moveTo(stops[i].x, stops[i].y);
      ctx.arc(stops[i].x, stops[i].y, currRad, 0, Math.PI * pctRemaining * 2);
      ctx.fill();
      ctx.fill();
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(stops[i].x + currRad, stops[i].y);
      ctx.arc(stops[i].x, stops[i].y, currRad, 0, Math.PI * pctRemaining * 2);
      ctx.strokeStyle = getCSSProp("--system-red");
      ctx.stroke();
      ctx.beginPath();
    }
    ctx.restore();
  }
  for (let i = 0; i < stops.length; i++)
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y);
  for (let i = 0; i < trains.length; i++) {
    ctx.beginPath();
    let angBtw = Math.atan2(
      trains[i].to.y - trains[i].from.y,
      trains[i].to.x - trains[i].from.x
    );
    let nStop = nearestStop(trains[i], stopSz);
    let associatedConnection = getAssociatedConnection(trains[i]);
    let offset = handleOffset(associatedConnection);
    let center = { x: trains[i].x + offset.x, y: trains[i].y + offset.y };
    const w = 15;
    const h = 30;
    const c = Math.cos(angBtw);
    const c2 = Math.cos(angBtw + K.PI / 2);
    const s = Math.sin(angBtw);
    const s2 = Math.sin(angBtw + K.PI / 2);
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = associatedConnection.colour;
    ctx.moveTo(center.x + c * h / 2 + c2 * w / 2, center.y + s * h / 2 + s2 * w / 2);
    ctx.lineTo(center.x + c * h / 2 - c2 * w / 2, center.y + s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 - c2 * w / 2, center.y - s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 + c2 * w / 2, center.y - s * h / 2 + s2 * w / 2);
    ctx.fill();
    ctx.fillStyle = defaultClr;
    let str = "";
    for (let pass2 of trains[i].passengers)
      str += pass2.to.toString();
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.translate(center.x, center.y);
    ctx.beginPath();
    ctx.rotate(angBtw + (trains[i].revDir ? Math.PI : 0));
    let y = 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let uSz = w / 2;
    let cap = trains[i].cap;
    for (let j = 0; j < trains[i].passengers.length; j++) {
      if (j >= cap / 2)
        y = 1;
      let px = j % (cap / 2) * uSz + uSz / 2 - h / 2;
      let py = y * uSz + uSz / 2 - w / 2;
      if (trains[i].passengers[j].to == 0)
        star(1.1, px, py);
      else if (trains[i].passengers[j].to == 1)
        square(0.9, px, py);
      else if (trains[i].passengers[j].to == 2)
        triangle(1, px, py);
      else
        ctx.fillText(trains[i].passengers[j].to, px, py);
    }
    ctx.beginPath();
    ctx.restore();
    ctx.restore();
  }
  if (activeSettingsDialog) {
    let stop = activeSettingsDialog.stop;
    let h = -activeSettingsDialog.hgt * Math.min(1, (Date.now() - activeSettingsDialog.time) / K.ANIM_SETTINGSDIALOG);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = getCSSProp("--system-overlay");
    ctx.moveTo(stop.x + acceptRadius, stop.y);
    ctx.lineTo(stop.x + acceptRadius, stop.y + h);
    ctx.arc(stop.x, stop.y + h, acceptRadius, 0, K.PI, true);
    ctx.lineTo(stop.x - acceptRadius, stop.y);
    ctx.arc(stop.x, stop.y, acceptRadius, 0, K.PI);
    ctx.fill();
    renderStop(stop);
    ctx.beginPath();
    for (let i = 0; i < Math.floor(-h / K.SETTINGSHEIGHT); i++) {
      ctx.beginPath();
      ctx.save();
      ctx.fillStyle = activeSettingsDialog.lines[i].colour + "95";
      if (activeSettingsDialog.selected == i) {
        ctx.fillStyle = activeSettingsDialog.lines[i].colour;
      }
      ctx.arc(stop.x, stop.y - (i + 1) * K.SETTINGSHEIGHT, stopSz, 0, K.PI * 2);
      ctx.fill();
      if (activeSettingsDialog.selected == i) {
        ctx.lineWidth = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = defaultClr;
        ctx.font = "30px Noto Sans Display";
        let baseX = stop.x;
        let baseY = stop.y - (i + 1) * K.SETTINGSHEIGHT;
        ctx.moveTo(baseX - stopSz * 0.5, baseY);
        ctx.lineTo(baseX + stopSz * 0.5, baseY);
        ctx.moveTo(baseX, baseY - stopSz * 0.5);
        ctx.lineTo(baseX, baseY + stopSz * 0.5);
        ctx.strokeStyle = defaultClr;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.restore();
    }
    ctx.restore();
    ctx.beginPath();
  }
}
function renderStop(stop) {
  ctx.beginPath();
  ctx.arc(stop.x, stop.y, stopSz, 0, K.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = defaultClr;
  let out = " ";
  for (let j = 0; j < stop.waiting.length; j++) {
    out += stop.waiting[j].to.toString();
  }
  ctx.fillText(out, stop.x + stopSz, stop.y - stopSz / 2);
  ctx.fillText(stop.type, stop.x, stop.y);
  ctx.beginPath();
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
      let stop = stops[stopAdded];
      if (stop.waiting.length > stop.capacity && stop.failureTimer < 0)
        stop.failureTimer = Date.now();
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
    if (event.button != 0)
      return;
    holdState = K.HOLD;
    downPt = { x: ev.clientX, y: ev.clientY };
    let actualPos = fromCanvPos(ev.clientX, ev.clientY);
    let nStop = nearestStop(actualPos, acceptRadius);
    let nConn = nearestConnection(actualPos.x, actualPos.y);
    if (nStop && colours.length > 0) {
      holdState = K.HOLD_NEWLINE;
      activeSettingsDialog = null;
      currPath = [nStop];
      redraw();
    } else if (activeSettingsDialog && activeSettingsDialog.selected != null) {
      let sel = activeSettingsDialog.selected;
      holdState = K.HOLD_EXTEND;
      extendInfo = { line: lines[sel], stop: activeSettingsDialog.stop };
      activeSettingsDialog = null;
    } else if (nConn) {
      holdState = K.HOLD_CONNECTION;
      modifyingConn = nConn;
    }
    if (holdState == K.HOLD || holdState == K.HOLD_CONNECTION) {
      document.body.style.cursor = "grabbing";
    }
  });
  window.addEventListener("keydown", keyUpdate);
  window.addEventListener("keyup", keyUpdate);
  window.addEventListener("pointerup", (e) => {
    routeConfirm(e);
    onmove(e);
  });
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
  scale(totalScaleFac);
  translate(canv.width / 2, canv.height / 2);
  redraw();
  requestAnimationFrame(animLoop);
  startTime = Date.now();
  setTimeout(stopPopulationLoop, 5e3);
}
function nearestConnection(x, y) {
  let bestDist = K.INF;
  let bestConn = null;
  for (let i = 0; i < connections.length; i++) {
    let cn = connections[i];
    let off = handleOffset(cn);
    let currDist = pDist(x, y, cn.from.x + off.x, cn.from.y + off.y, cn.to.x + off.x, cn.to.y + off.y);
    if (currDist < bestDist) {
      bestDist = currDist;
      bestConn = cn;
    }
  }
  return bestDist < K.LINEACCEPTDIST ? bestConn : null;
}
function pDist(x, y, x1, y1, x2, y2) {
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;
  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0)
    param = dot / len_sq;
  var xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
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
      let delay = dropOff(currTrain, currentTo) * K.DELAYPERPASSENGER;
      let reverseQ = true;
      let nextStop2 = null;
      let prevStop = currTrain.from;
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
      let connBeforeUpdate = getAssociatedConnection(currTrain);
      currTrain.from = currTrain.to;
      currTrain.to = nextStop2;
      handleAwaiting(currTrain, currStop);
      if (Date.now() - startT > 25)
        console.log("WARNING: StopHandler took ", Date.now() - startT + "ms");
    }
    currTrain.x = currTrain.from.x + (currTrain.to.x - currTrain.from.x) * percentCovered;
    currTrain.y = currTrain.from.y + (currTrain.to.y - currTrain.from.y) * percentCovered;
  }
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].failureTimer < 0)
      continue;
    let pctRemaining = (Date.now() - stops[i].failureTimer) / K.FAILTIME;
    if (pctRemaining > 1.1) {
      alertDialog("loser!", () => {
        location.reload();
      });
      return;
    }
  }
  let delta = Date.now() - startTime;
  startTime = Date.now();
  redraw(delta);
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
      if (currStop.waiting.length < currStop.capacity)
        currStop.failureTimer = -1;
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
      if (currStop.waiting.length < currStop.capacity)
        currStop.failureTimer = -1;
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
      let stop = currStop;
      if (stop.waiting.length > stop.capacity && stop.failureTimer < 0)
        stop.failureTimer = Date.now();
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
    let canUpdate = true;
    for (const affectedConn of connections) {
      if (affectedConn.pendingRemove) {
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
  newPt.failureTimer = -1;
  newPt.capacity = 6;
  redraw();
}
function keyUpdate(ev) {
}
function onmove(ev) {
  hovering = null;
  let rmSettings = true;
  hoveringConn = null;
  currPos_canv = fromCanvPos(ev.clientX, ev.clientY);
  if (holdState == K.HOLD) {
    translate(ev.movementX, ev.movementY);
    redraw();
  }
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  let nConn = nearestConnection(actualPos.x, actualPos.y);
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
        currPath.push(nStop);
        routeConfirm();
      }
      if (canAdd) {
        currPath.push(nStop);
      }
    }
    redraw();
  } else if (holdState == K.HOLD_CONNECTION) {
    if (nStop) {
      let currLine = lines[modifyingConn.lineID];
      let newConn = {
        from: modifyingConn.from,
        to: nStop,
        lineID: modifyingConn.lineID,
        colour: modifyingConn.colour
      };
      let newConn2 = {
        from: nStop,
        to: modifyingConn.to,
        lineID: modifyingConn.lineID,
        colour: modifyingConn.colour
      };
      if (parallelStops(newConn).ct < 3 && parallelStops(newConn2).ct < 3 && !lines[modifyingConn.lineID].stops.has(nStop)) {
        for (affectedTrain of currLine.trains) {
          if (getAssociatedConnection(affectedTrain) == modifyingConn) {
            modifyingConn.pendingRemove = true;
            break;
          }
        }
        currLine.stops.add(nStop);
        connections.push(newConn);
        connections.push(newConn2);
        if (!modifyingConn.pendingRemove) {
          modifyingConn.pendingRemove = true;
          updateToNow(currLine, modifyingConn);
        }
        typesOnLine[modifyingConn.lineID].add(nStop.type);
        nStop.linesServed.add(modifyingConn.lineID);
        for (let pass2 of passengers)
          handlePassenger(pass2);
        let idx = currLine.path.indexOf(modifyingConn.from);
        currLine.path.splice(idx + 1, 0, nStop);
        holdState = K.NOHOLD;
        routeConfirm();
      }
    }
  } else if (holdState == K.HOLD_EXTEND && nStop) {
    let currLine = lines[modifyingConn.lineID];
    if (currLine.stops.has(nStop))
      ;
    else {
      let newConn = {
        from: modifyingConn.from,
        to: nStop,
        lineID: modifyingConn.lineID,
        colour: modifyingConn.colour
      };
      holdState = K.NOHOLD;
      connections.push(newConn);
      typesOnLine[currLine.lineID].add(nStop.type);
      nStop.linesServed.add(currLine.lineID);
      currLine.stops.add(nStop);
      if (currLine.path[currLine.length - 1] == extendInfo.stop)
        currLine.path.push(nStop);
      else
        currLine.path.splice(0, 0, nStop);
      routeConfirm();
    }
  } else if (nStop) {
    let terms = terminals(nStop);
    if (terms && holdState == K.NOHOLD && (!activeSettingsDialog || activeSettingsDialog.stop != nStop)) {
      activeSettingsDialog = {
        stop: nStop,
        time: Date.now() + 50,
        hgt: K.SETTINGSHEIGHT * terms.length,
        lines: terms,
        selected: null
      };
      redraw();
    }
    if (terms)
      rmSettings = false;
    hovering = nStop;
    if (activeSettingsDialog)
      activeSettingsDialog.selected = null;
    document.body.style.cursor = "pointer";
  } else {
    let setSelected = false;
    for (let stop of stops) {
      if (activeSettingsDialog && currPos_canv.x < stop.x + acceptRadius && currPos_canv.x > stop.x - acceptRadius && currPos_canv.y < stop.y + acceptRadius && currPos_canv.y > stop.y - activeSettingsDialog.hgt - acceptRadius) {
        rmSettings = false;
        let dy = (currPos_canv.y - (stop.y - acceptRadius - activeSettingsDialog.hgt)) / K.SETTINGSHEIGHT;
        let activeSel = activeSettingsDialog.lines.length - Math.floor(dy) - 1;
        activeSettingsDialog.selected = activeSel < 0 ? null : activeSel;
        if (activeSettingsDialog.selected != null)
          setSelected = true;
        document.body.style.cursor = "pointer";
      }
    }
    if (!setSelected && activeSettingsDialog)
      activeSettingsDialog.selected = null;
    if (rmSettings && nConn) {
      hoveringConn = nConn;
      document.body.style.cursor = "pointer";
    } else if (rmSettings && holdState == K.NOHOLD)
      document.body.style.cursor = "";
  }
  if (rmSettings) {
    activeSettingsDialog = null;
  }
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
  recentlyRemoved.push({ conn, time: Date.now() });
}
function routeConfirm(ev) {
  holdState = K.NOHOLD;
  extendInfo = null;
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
    let currLine = [];
    let stopsOnLine = /* @__PURE__ */ new Set();
    for (const e of currPath) {
      currLine.push(e);
      stopsOnLine.add(e);
    }
    let currLine2 = {
      lineID: lineCt,
      path: currLine,
      colour: currCol,
      stops: stopsOnLine,
      loopingQ: currPath[0] == currPath[currPath.length - 1],
      trains: []
    };
    lines.push(currLine2);
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
    let t1 = {
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
      cap: 6,
      revDir: false
    };
    let t2 = {
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
      cap: 6,
      revDir: true
    };
    trains.push(t1);
    trains.push(t2);
    currLine2.trains = [t1, t2];
    lineCt++;
  }
  currPath = [];
  redraw();
  if (!ev || !downPt || distBtw({ x: ev.clientX, y: ev.clientY }, downPt) > 10)
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
function square(scl, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 3 * scl, y - 3 * scl);
  ctx.lineTo(x + 3 * scl, y - 3 * scl);
  ctx.lineTo(x + 3 * scl, y + 3 * scl);
  ctx.lineTo(x - 3 * scl, y + 3 * scl);
  ctx.lineTo(x - 3 * scl, y - 3 * scl);
  ctx.fill();
  ctx.beginPath();
  ctx.restore();
}
function triangle(scl, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 3 * scl, y + 3 * scl);
  ctx.lineTo(x, y - 3 * scl);
  ctx.lineTo(x + 3 * scl, y + 3 * scl);
  ctx.lineTo(x - 3 * scl, y + 3 * scl);
  ctx.fill();
  ctx.beginPath();
  ctx.restore();
}
function circ() {
}
function star(scl, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 3 * scl, y + 1 * scl);
  ctx.lineTo(x - 0.75 * scl, y + 1 * scl);
  ctx.lineTo(x, y + 3 * scl);
  ctx.lineTo(x + 0.75 * scl, y + 1 * scl);
  ctx.lineTo(x + 3 * scl, y + 1 * scl);
  ctx.lineTo(x + 1.25 * scl, y - 0.5 * scl);
  ctx.lineTo(x + 2 * scl, y - 2.5 * scl);
  ctx.lineTo(x, y - 1.25 * scl);
  ctx.lineTo(x - 2 * scl, y - 2.5 * scl);
  ctx.lineTo(x - 1.25 * scl, y - 0.5 * scl);
  ctx.lineTo(x - 3 * scl, y + 1 * scl);
  ctx.fill();
  ctx.beginPath();
  ctx.restore();
}
function getNextType(exclude = -1) {
  let type = Math.floor(Math.random() * (exclude < 0 ? types.length : maxUnlockedType));
  if (type >= exclude && exclude >= 0)
    return type + 1;
  return type;
}
//# sourceMappingURL=game.js.map
