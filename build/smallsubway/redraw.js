"use strict";
function bezier(t, p1, p2, p3) {
  return (1 - t) ** 2 * p1 + 2 * (1 - t) * t * p2 + t ** 2 * p3;
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
    ctx.fillStyle = getCSSProp("--system-bg");
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
  function clearShape(pt, rad) {
    ctx.save();
    ctx.fillStyle = getCSSProp("--system-bg");
    types[pt.type](rad / 3, pt.x, pt.y);
    ctx.restore();
  }
  ctx.strokeStyle = defaultClr;
  updateMinScl();
  ctx.beginPath();
  ctx.save();
  ctx.resetTransform();
  ctx.fillStyle = getCSSProp("--system-bg");
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
    types[hovering.type](acceptRadius / 3, hovering.x, hovering.y);
    ctx.fill();
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
      connections[i].from.x + offset.x,
      connections[i].from.y + offset.y
    );
    ctx.lineTo(
      connections[i].to.x + offset.x,
      connections[i].to.y + offset.y
    );
    ctx.stroke();
    ctx.beginPath();
    for (let stop of stops) {
      let dist = pDist(stop.x, stop.y, connections[i].from.x, connections[i].from.y, connections[i].to.x, connections[i].to.y);
      if (!samePt(stop, connections[i].from) && !samePt(stop, connections[i].to) && dist < acceptRadius) {
        let basex = stop.x + dist * Math.cos(angBtw + K.PI / 2);
        let basey = stop.y + dist * Math.sin(angBtw + K.PI / 2);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(basex - c * acceptRadius, basey - s * acceptRadius);
        ctx.lineTo(basex + c * acceptRadius, basey + s * acceptRadius);
        ctx.lineWidth = K.LINEWIDTH / 2;
        console.log("found!");
        ctx.strokeStyle = getCSSProp("--system-bg");
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
      }
    }
    ctx.restore();
  }
  let lastPt = currPath ? currPath[currPath.length - 1] : null;
  let nextStop = nearestStop(currPos_canv, acceptRadius);
  if (holdState == K.HOLD_NEWLINE && (!nextStop || !samePt(nextStop, lastPt))) {
    ctx.moveTo(lastPt.x, lastPt.y);
    ctx.save();
    ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
    ctx.lineWidth = K.LINEWIDTH;
    ctx.lineTo(currPos_canv.x, currPos_canv.y);
    ctx.stroke();
    ctx.restore();
  }
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
    ctx.moveTo(currPath[i - 1].x, currPath[i - 1].y);
    ctx.lineTo(currPath[i].x, currPath[i].y);
    ctx.stroke();
    ctx.strokeStyle = defaultClr;
  }
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < stops.length; i++) {
    renderStop(stops[i]);
  }
  for (let i = 0; i < recentlyRemoved.length; i++) {
    ctx.beginPath();
    ctx.save();
    ctx.strokeStyle = getCSSProp("--system-red");
    if (timeNow() - recentlyRemoved[i].time > 500) {
      recentlyRemoved.splice(i, 1);
      i--;
      continue;
    }
    ctx.globalAlpha = (1 - (timeNow() - recentlyRemoved[i].time) / 500) * 0.5;
    ctx.lineWidth = K.LINEWIDTH;
    ctx.moveTo(recentlyRemoved[i].conn.from.x, recentlyRemoved[i].conn.from.y);
    ctx.lineTo(recentlyRemoved[i].conn.to.x, recentlyRemoved[i].conn.to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.restore();
  }
  ctx.save();
  ctx.lineWidth = 4;
  for (let i = 0; i < connections.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = getCSSProp("--system-bg");
    ctx.strokeStyle = defaultClr;
    ctx.lineWidth = K.LINEWIDTH;
    ctx.lineJoin = "round";
    types[connections[i].from.type](stopSz / 3, connections[i].from.x, connections[i].from.y, true);
    ctx.stroke();
    ctx.beginPath();
    types[connections[i].to.type](stopSz / 3, connections[i].to.x, connections[i].to.y, true);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.restore();
  ctx.beginPath();
  if (holdState == K.HOLD_NEWLINE) {
    let angBtw = Math.atan2(
      currPos_canv.y - lastPt.y,
      currPos_canv.x - lastPt.x
    );
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    if (nextStop && samePt(nextStop, lastPt)) {
      clearShape(lastPt, acceptRadius);
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.lineJoin = "round";
      ctx.lineWidth = 4;
      types[lastPt.type](stopSz / 3, lastPt.x, lastPt.y, true);
      ctx.lineWidth = K.LINEWIDTH;
      types[lastPt.type](acceptRadius / 3, lastPt.x, lastPt.y, true);
      ctx.restore();
    }
    ctx.beginPath();
    for (let i = 0; i < currPath.length; i++) {
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineJoin = "round";
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.lineWidth = K.LINEWIDTH;
      types[currPath[i].type](acceptRadius / 3, currPath[i].x, currPath[i].y, true);
      ctx.restore();
    }
  }
  for (let i = 0; i < stops.length; i++) {
    ctx.save();
    ctx.beginPath();
    if (stops[i].failurePct > 0) {
      ctx.fillStyle = getCSSProp("--system-red2");
      let pctRemaining = stops[i].failurePct;
      let pctOneSec = (timeNow() - stops[i].failurePct * K.FAILTIME) / 300;
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
  for (let stop of stops) {
    drawWaiting(stop);
  }
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
    for (let pass of trains[i].passengers)
      str += pass.to.toString();
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
      types[trains[i].passengers[j].to](1, px, py);
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
      if (activeSettingsDialog.selected == activeSettingsDialog.lines[i].lineID) {
        ctx.fillStyle = activeSettingsDialog.lines[i].colour;
      }
      ctx.arc(stop.x, stop.y - (i + 1) * K.SETTINGSHEIGHT, stopSz, 0, K.PI * 2);
      ctx.fill();
      if (activeSettingsDialog.selected == activeSettingsDialog.lines[i].lineID) {
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
  if (paused) {
    ctx.save();
    ctx.resetTransform();
    ctx.globalAlpha = 1;
    ctx.fillStyle = getCSSProp("--system-blue");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "30px Noto Sans Display";
    ctx.fillText("Paused", 50, 50);
    ctx.restore();
  }
}
function renderStop(stop) {
  ctx.beginPath();
  ctx.fillStyle = defaultClr;
  let deltaT = (timeNow() - stop.addedTime) / 1500;
  let radScl = deltaT >= 1 ? stopSz / 3 : stopSz / 3 * (70 * (deltaT - 0.443) ** 7 + 0.2);
  types[stop.type](Math.max(0, radScl), stop.x, stop.y);
  ctx.beginPath();
}
function drawWaiting(stop) {
  let y = 0, x = 0;
  let dy = 15;
  ctx.fillStyle = defaultClr;
  let dx = 15;
  const maxW = 5;
  let baseOffset = Math.ceil(stop.waiting.length / maxW) * dy;
  for (let j = 0; j < stop.waiting.length; j++) {
    if (x >= maxW) {
      y++;
      x = 0;
    }
    let adjX = stop.x + stopSz + x % maxW * dx - dx / 2;
    let adjY = stop.y - baseOffset - stopSz + y * dy - dy / 2;
    x++;
    types[stop.waiting[j].to](2, adjX, adjY);
  }
}
//# sourceMappingURL=redraw.js.map
