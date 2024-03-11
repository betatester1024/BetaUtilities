"use strict";
var vis = function() {
  var stateKey, eventKey, keys = {
    hidden: "visibilitychange",
    webkitHidden: "webkitvisibilitychange",
    mozHidden: "mozvisibilitychange",
    msHidden: "msvisibilitychange"
  };
  for (stateKey in keys) {
    if (stateKey in document) {
      eventKey = keys[stateKey];
      break;
    }
  }
  return function(c) {
    if (c)
      document.addEventListener(eventKey, c);
    return !document[stateKey];
  };
}();
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
      let newConn = { from: lastStop, to: nStop };
      if (parallelConnections(newConn).ct >= 3)
        canAdd = false;
      else if (!canAdd && currPath.length > 2 && samePt(nStop, currPath[0]) && !samePt(nStop, lastStop)) {
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
      if (parallelConnections(newConn).ct < 3 && parallelConnections(newConn2).ct < 3 && !lines[modifyingConn.lineID].stops.has(nStop)) {
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
    let currLine = extendInfo.line;
    if (!currLine.stops.has(nStop) || (nStop == currLine.path[0] && extendInfo.stop == currLine.path[currLine.path.length - 1] || nStop == currLine.path[currLine.path.length - 1] && extendInfo.stop == currLine.path[0]) && currLine.path.length > 2) {
      let newConn = {
        from: extendInfo.stop,
        to: nStop,
        lineID: currLine.lineID,
        colour: currLine.colour
      };
      connections.push(newConn);
      typesOnLine[currLine.lineID].add(nStop.type);
      nStop.linesServed.add(currLine.lineID);
      currLine.stops.add(nStop);
      if (currLine.path[currLine.path.length - 1] == extendInfo.stop)
        currLine.path.push(nStop);
      else
        currLine.path.splice(0, 0, nStop);
      if (currLine.path[0] == currLine.path[currLine.path.length - 1])
        currLine.loopingQ = true;
      extendInfo = null;
      for (let pass2 of passengers)
        handlePassenger(pass2);
      holdState = K.NOHOLD;
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
        activeSettingsDialog.selected = activeSel < 0 ? null : activeSettingsDialog.lines[activeSel].lineID;
        if (activeSettingsDialog.selected != null)
          setSelected = true;
        document.body.style.cursor = "pointer";
      }
    }
    if (!setSelected && activeSettingsDialog)
      activeSettingsDialog.selected = null;
    if (rmSettings && nConn && holdState == K.NOHOLD) {
      hoveringConn = nConn;
      document.body.style.cursor = "pointer";
    } else if (rmSettings && holdState == K.NOHOLD)
      document.body.style.cursor = "";
  }
  if (rmSettings) {
    activeSettingsDialog = null;
  }
  redraw();
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
      lineID: lineCt,
      colour: currCol,
      startT: timeNow(),
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
      lineID: lineCt,
      colour: currCol,
      startT: timeNow(),
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
}
function onWheel(ev) {
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
}
function pointerdown(ev) {
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
}
//# sourceMappingURL=events.js.map
