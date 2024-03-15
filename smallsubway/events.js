// https://stackoverflow.com/questions/19519535/detect-if-browser-tab-is-active-or-user-has-switched-away
var vis = (function(){
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
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
})();


function onmove(ev) {
  // if (ev.shiftKey) {
  //   document.body.style.cursor = "grabbing";
  // }
  // if (paused) return;
  hovering = null;
  let rmSettings = true;
  hoveringConn = null;
  hoveringTrain = null;
  currPos_canv = fromCanvPos(ev.clientX, ev.clientY);
  currPos_abs = {x:ev.clientX, y:ev.clientY};
  // let 
  if (holdState == K.HOLD) {// && ev.shiftKey) {
    translate(ev.movementX, ev.movementY);
    redraw();
  }
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  let nConn = nearestConnection(actualPos.x, actualPos.y);
  let nStop = nearestStop(actualPos, acceptRadius);
  if (holdState == K.HOLD_ADDTRAIN) {
    if (trainsAvailable == 0) {
      holdState = K.NOHOLD;
    }
    else {
      trainsAvailable--;
      let newTrain = {
        x: actualPos.x, y: actualPos.y,
        from: null, to:null,
        lineID: -1, colour: defaultClr, startT: timeNow(),
        status: K.MOVING, passengers: [], cap:6, revDir:false,
        percentCovered:0, pendingMove:true, moving:true
        //toAdd:[], toRemove:[], onCompletion:0
      };
      trains.push(newTrain);
      holdState = K.HOLD_TRAIN;
      modifyingTrain = newTrain;
    }
  }
  if (holdState == K.HOLD_NEWLINE) {
    
    let lastStop = currPath[currPath.length - 1];
    let dist = distBtw(lastStop, currPos_canv);
    currCost = dist*costPerPx + currCost_existing;
    if (currCost > balance) {
      overCost = true;
    }
    else overCost = false;
    // if (!nStop) // 
    //   currPath.pop();
    if (nStop) {
      let canAdd = true;
      if (nStop.linesServed.size == 0) {
        currCost += costPerStation;
      }
      if (currCost > balance) {
        overCost = true;
        canAdd = false;
      }
      for (let i = 0; i < currPath.length && canAdd; i++) {
        if (samePt(currPath[i], nStop)) canAdd = false;
      }
      let newConn = {from:lastStop, to:nStop};
      if (parallelConnections(newConn).ct >= 3) canAdd = false;
      else if (!canAdd && currPath.length > 2
        && samePt(nStop, currPath[0]) && !samePt(nStop, lastStop)) {
        currPath.push(nStop);
        logData.push("added stop forming loop (ID "+nStop.stopID+")");
        routeConfirm();
        // holdState = K.NOHOLD;
      }
      if (canAdd) {
        logData.push("added stop "+nStop.stopID+" to line "+nStop.lineID);
        currCost_existing = currCost;
        currPath.push(nStop);
      }
    }
    redraw();
  }
  else if (holdState == K.HOLD_CONNECTION) {
    let origDist = distBtw(modifyingConn.from, modifyingConn.to);
    let nowDist = distBtw(modifyingConn.from, currPos_canv)+distBtw(modifyingConn.to, currPos_canv);
    currCost = modifCost+nowDist-origDist;
    if (currCost > balance) {
      overCost = true;
    }
    else overCost =false;
    if (nStop && (nStop.linesServed.size == 0 && balance > currCost+costPerStation 
                  || nStop.linesServed.size > 0 && balance > currCost)) {
      balance -= currCost;
      if (nStop.linesServed.size == 0) balance -= costPerStation;
      resetCosts();
      let currLine = lines[modifyingConn.lineID];
      // 
      let newConn = {from:modifyingConn.from, to:nStop, 
         lineID:modifyingConn.lineID, 
         colour:modifyingConn.colour};
      let newConn2 = {from:nStop, to:modifyingConn.to, 
          lineID:modifyingConn.lineID, 
          colour:modifyingConn.colour};
      if (parallelConnections(newConn).ct < 3 && parallelConnections(newConn2).ct < 3
      &&  !lines[modifyingConn.lineID].stops.has(nStop)) {
        // now we can modify the connection
        for (affectedTrain of currLine.trains) {
          if (getAssociatedConnection(affectedTrain) == modifyingConn) {
            modifyingConn.pendingRemove = true;
            break;
          }
        }
        currLine.stops.add(nStop);
        // modifyingConn.pendingUpdateTo = nStop;

        connections.push(newConn);
        connections.push(newConn2);
        if (!modifyingConn.pendingRemove) {
          modifyingConn.pendingRemove = true;
           updateToNow(currLine, modifyingConn); 
        }
        typesOnLine[modifyingConn.lineID].add(nStop.type);
        
        nStop.linesServed.add(modifyingConn.lineID);
        logData.push("Connection added between stopID")
        
        let fIdx = currLine.path.indexOf(modifyingConn.from);
        let tIdx = currLine.path.indexOf(modifyingConn.to);
        // special cases: end. 
        if (fIdx == tIdx+1) // the thing in between is to be added at 
          currLine.path.splice(tIdx+1, 0, nStop);
        else if (tIdx == fIdx+1)
          currLine.path.splice(fIdx+1, 0, nStop);
        else {
          currLine.path.splice(currLine.path.length-1, 0, nStop);
        }
        recalculateLineConnections();
        
        for (let pass of passengers)
          handlePassenger(pass);
        // if (!modifyingConn.pendingRemoval) 
        holdState = K.NOHOLD;
        routeConfirm(); 
      }

    }
    else if (nStop && balance > currCost) {
      overCost = true;
    }
  }
  else if (holdState == K.HOLD_EXTEND) {
    let currLine = extendInfo.line
    let delta = distBtw(extendInfo.stop, currPos_canv);
    currCost = currCost_existing+delta*costPerPx;
    if (currCost > balance) overCost = true;
    else overCost = false;
    if (nStop && balance > currCost) {
      balance -= currCost;
      resetCosts();
      if (!currLine.stops.has(nStop) 
       || (nStop == currLine.path[0] && extendInfo.stop == currLine.path[currLine.path.length-1]
           || nStop == currLine.path[currLine.path.length-1] && extendInfo.stop == currLine.path[0])
          && currLine.path.length > 2 && !currLine.loopingQ) {
        let newConn = {from:extendInfo.stop, to:nStop, 
             lineID:currLine.lineID, 
             colour:currLine.colour};
        connections.push(newConn);
        typesOnLine[currLine.lineID].add(nStop.type);
        nStop.linesServed.add(currLine.lineID);
        currLine.stops.add(nStop);
        // if the stop that we're extending is the at the end, then add at the end
        if (currLine.path[currLine.path.length-1] == extendInfo.stop) {
          currLine.path.push(nStop);
          logData.push("line extension #0 (type",nStop.type+")");
          prtLine();
        }
        // otherwise the line we're extending must be the first stop
        else currLine.path.splice(0, 0, nStop)
        // is it looping?
        if (currLine.path[0] == currLine.path[currLine.path.length-1]) {
          currLine.loopingQ = true;
          extendInfo = null;
          recalculateLineConnections();
          routeConfirm();
        }
        // extendInfo = null;
        recalculateLineConnections();
        for (let pass of passengers)
          handlePassenger(pass);
        if (extendInfo) extendInfo.stop = nStop;
        // routeConfirm();
  
      } // extend successful 
    } // if nextStop
  }
  else if (holdState == K.HOLD_TRAIN) {
    modifyingTrain.x = currPos_canv.x;
    modifyingTrain.y = currPos_canv.y;
    if (nConn && !nConn.pendingRemove) {
      let dist = pDist(currPos_canv.x, currPos_canv.y, nConn.from.x, nConn.from.y, nConn.to.x, nConn.to.y);
      let angBtw = Math.atan2(nConn.from.y - nConn.to.y, nConn.from.x - nConn.to.x);
      modifyingTrain.x += Math.cos(angBtw+K.PI/2)*dist;
      modifyingTrain.y += Math.sin(angBtw+K.PI/2)*dist;
      if (pDist(modifyingTrain.x, modifyingTrain.y, nConn.from.x, nConn.from.y, nConn.to.x, nConn.to.y) > 1) {
         modifyingTrain.x = currPos_canv.x + Math.cos(angBtw-K.PI/2)*dist;
         modifyingTrain.y = currPos_canv.y + Math.sin(angBtw-K.PI/2)*dist;
      }
      if (modifyingTrain.lineID>=0) {
        let currLine = lines[modifyingTrain.lineID]
        for (let i=0; i<currLine.trains.length; i++) {
          if (currLine.trains[i] == modifyingTrain) {
            currLine.trains.splice(i, 1);
            break;
          }
        }
      }
      lines[nConn.lineID].trains.push(modifyingTrain);
      modifyingTrain.lineID = nConn.lineID;
      
      modifyingTrain.from = nConn.from;
      modifyingTrain.to = nConn.to;
      // modifyingTrain.pendingRemove = false;
      modifyingTrain.startTime = timeNow();
      // for (pass of modifyingTrain.passengers) {
        
      // }
    }
    else modifyingTrain.pendingMove = true;
    redraw();
  }
  else if (nStop) {
    let terms = terminals(nStop);
    if (terms && holdState == K.NOHOLD && (!activeSettingsDialog || activeSettingsDialog.stop != nStop)) {
      activeSettingsDialog = {
        stop:nStop, time:Date.now()+50,
        hgt:K.SETTINGSHEIGHT*terms.length, lines:terms, selected:null};
      redraw();
    }
    if (terms) rmSettings = false;
    hovering = nStop;
    if (activeSettingsDialog) activeSettingsDialog.selected = null;
    document.body.style.cursor = "pointer";
  }
  else {
    let setSelected = false;
    for (let stop of stops) {
      if (activeSettingsDialog && 
          currPos_canv.x < stop.x+acceptRadius && currPos_canv.x > stop.x-acceptRadius
         && currPos_canv.y < stop.y+acceptRadius && currPos_canv.y > stop.y-activeSettingsDialog.hgt-acceptRadius) {
        rmSettings = false;
        let dy = (currPos_canv.y-(stop.y-acceptRadius-activeSettingsDialog.hgt))/K.SETTINGSHEIGHT;
        let activeSel = activeSettingsDialog.lines.length-Math.floor(dy)-1;
        activeSettingsDialog.selected = (activeSel<0?null:activeSettingsDialog.lines[activeSel].lineID);
        if (activeSettingsDialog.selected != null) setSelected = true;
        // hovering = stop;
        document.body.style.cursor = "pointer";
        // redraw();
        // break;  
      }
    }
    if (!setSelected && activeSettingsDialog) activeSettingsDialog.selected = null;
    // else if (activeSettingsDialog && currPos_canv.x < )
    let nTrain = nearestTrain(currPos_canv.x, currPos_canv.y, K.LINEACCEPTDIST);
    if (holdState == K.NOHOLD && rmSettings && nTrain) {
      hoveringTrain = nTrain;
      document.body.style.cursor = "pointer";
    }
    if (rmSettings && (nConn && !nConn.pendingRemove) && holdState == K.NOHOLD) {
      hoveringConn = nConn;
      document.body.style.cursor = "pointer";
    }
    else if (rmSettings && holdState == K.NOHOLD && !hoveringTrain) 
      document.body.style.cursor = "";
  }
  if (rmSettings) {
    activeSettingsDialog = null;
  }
  redraw();
} //onmove

function resetCosts() {
  currCost = 0;
  currCost_existing = 0;
  overCost = false;
  console.log("reset!");
}

function routeConfirm(ev) {
  extendInfo = null;
  document.body.style.cursor = holdState == K.HOLD ? "grab" : "";
  if (currPath.length > 1 && balance >= currCost) {
    trainsAvailable--;
    balance -= currCost;
    let currCol = getCSSProp("--system-" + colours[0]);
    colours.shift();
    // lines.push({path:currPath, 
    // colour:getCSSProp("--system-"+colours[lines.length])});
    for (let i = 1; i < currPath.length; i++) {
      connections.push({
        from: currPath[i - 1], to: currPath[i],
        colour: currCol, lineID: lineCt
      });
    }
    // run dijkstra?
    let currLine = [];
    let stopsOnLine = new Set();
    for (const e of currPath) {
      currLine.push(e);
      stopsOnLine.add(e);
      // stopsOnLine.add(e);
    }

    let currLine2 = {
        lineID:lineCt, 
        path:currLine, 
        colour:currCol,
        stops:stopsOnLine, 
        loopingQ:(currPath[0] == currPath[currPath.length-1]),
        trains:[]};
    lines.push(currLine2);

    let supportedTypes = new Set();
    for (let i = 0; i < currPath.length; i++) {
      supportedTypes.add(currPath[i].type);
      currPath[i].linesServed.add(lineCt);
    }
    typesOnLine.push(supportedTypes);
    // for ()
    /// now every passenger route will be affected
    // for (let currP of passengers) {
    // if (currP.status != K.WAITING) continue;
    recalculateLineConnections();
    
    for (pass of passengers) {
      handlePassenger(pass);
    }
    let t1 = {
        x: currPath[0].x, y: currPath[0].y,
        from: currPath[0], to: currPath[1],
        lineID: lineCt, colour: currCol, startT: timeNow(),
        status: K.MOVING, passengers: [], cap:6, revDir:false,
        percentCovered:0, pendingMove:false
        //toAdd:[], toRemove:[], onCompletion:0
      };
    // let t2 = {
    //     x: currPath[0].x, y: currPath[0].y,
    //     from: currPath[currPath.length-1], to: currPath[currPath.length-2],
    //     lineID: lineCt, colour: currCol, startT: timeNow(),
    //     status: K.MOVING, passengers: [], cap:6, revDir:true,//, toAdd:[], toRemove:[], 
    //     percentCovered: 0, pendingMove:false
    //     //onCompletion:0
    //   };
    trains.push(t1);
    // trains.push(t2);
    currLine2.trains = [t1];
    lineCt++;
  }
  if (holdState == K.HOLD_TRAIN) {
    if (!nearestConnection(currPos_canv.x, currPos_canv.y)) {
      modifyingTrain.pendingRemove = true;
      if (modifyingTrain.passengers.length == 0) {
        trains.splice(trains.indexOf(modifyingTrain), 1);
        trainsAvailable++;
      }
    }
    for (let pass of modifyingTrain.passengers) {
      pass.stop = modifyingTrain.dropOffLocation;
      pass.actionStatus = K.REBOARDREQUIRED;
    }
    modifyingTrain.moving = false;
    handleAwaiting(modifyingTrain, modifyingTrain.dropOffLocation);
    modifyingTrain = null;
    holdState = K.NOHOLD;
  }
  resetCosts();
  holdState = K.NOHOLD;
  currPath = [];
  redraw();
  if (!ev || !downPt || distBtw({ x: ev.clientX, y: ev.clientY }, downPt) > 10) return;
  // check for is it actually a click ^
  ctx.beginPath();
  
  // let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  // ctx.moveTo(actualPos.x - 0.5, actualPos.y - 0.5);
  // ctx.lineTo(actualPos.x + 0.5, actualPos.y + 0.5);
  // ctx.stroke();
} // routeConfirm (pointerUp)


function onWheel(ev) {
  // larger -ve deltaY: 
  // ctx.
  // let sclFac = (ev.deltaY<0?Math.pow(10, -ev.deltaY/750):Math.pow(10, -ev.deltaY/400))
  let sclFac = (ev.deltaY < 0 ? 1.15 : 1 / 1.15)
  if (sclFac * totalScaleFac > maxSclFac)
    sclFac = maxSclFac / totalScaleFac;
  if (sclFac * totalScaleFac < minSclFac)
    sclFac = minSclFac / totalScaleFac;
  translate(-ev.clientX, -ev.clientY);
  scale(sclFac);
  translate(ev.clientX, ev.clientY);
  totalScaleFac *= sclFac;
  redraw();
} // onwheel

function pointerdown(ev) {
  // if (paused) return;
  if (ev.button != 0) return;
  holdState = K.HOLD;
  downPt = { x: ev.clientX, y: ev.clientY };
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  let nStop = nearestStop(actualPos, acceptRadius);
  let nConn = nearestConnection(actualPos.x, actualPos.y);
  let nTrain = nearestTrain(actualPos.x, actualPos.y, K.LINEACCEPTDIST);
  
  if (nStop && lines.length < linesAvailable && trainsAvailable > 0) {
    if (lines.length == linesAvailable) nonBlockingDialog("You have no more lines available!")
    else if (trainsAvailable == 0) nonBlockingDialog("You have no more trains!")
    else {
      holdState = K.HOLD_NEWLINE;
      currCost_existing = trainCost + costPerStation;
      activeSettingsDialog = null;
      currPath = [nStop];
      redraw();
    }
  }
  else if (activeSettingsDialog && activeSettingsDialog.selected != null) {
    let sel = activeSettingsDialog.selected;
    holdState = K.HOLD_EXTEND;
    currCost_existing = modifCost;
    extendInfo = {line:lines[sel], stop: activeSettingsDialog.stop};
    activeSettingsDialog = null;
  }
  else if (nTrain) {
    holdState = K.HOLD_TRAIN;
    modifyingTrain = nTrain;
    nTrain.pendingMove = true;
    nTrain.moving = true;
    document.body.style.cursor = "grabbing";
    nTrain.dropOffLocation = nTrain.from;
  }
  else if (nConn && !nConn.pendingRemove) {
    holdState = K.HOLD_CONNECTION;
    modifyingConn = nConn;
  }
  if (holdState == K.HOLD || holdState == K.HOLD_CONNECTION) {
    document.body.style.cursor = "grabbing";
  }
} // pointerDown

function addTrain(ev) {
  holdState = K.HOLD_ADDTRAIN; 
  onmove(ev);
  ev.preventDefault();
}