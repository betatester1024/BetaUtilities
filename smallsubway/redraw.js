function bezier(t , p1, p2, p3){
  return (1-t)**2*p1 + 2*(1-t)*t*p2 + t**2*p3;
}

function redraw(delta) {

  let fpsCurr = 1000/delta;
  ctx.lineCap = "round";
  // function connect(currPath, clr) {
  function circle(pt, clear=true) {
    ctx.save();
    if (clear) clearCircle(pt, acceptRadius);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, stopSz, 0, K.PI * 2);
    ctx.stroke();
    // ctx.strokeStyle;
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

    types[pt.type](rad/3, pt.x, pt.y);
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
    ctx.moveTo(-viewportW / 2, -viewportH/2);
    ctx.lineTo(viewportW / 2, -viewportH/2);
    ctx.lineTo(viewportW / 2, viewportH/2);
    ctx.lineTo(-viewportW/2, viewportH/2);
    ctx.lineTo(-viewportW/2, -viewportH/2);
    ctx.stroke();
    ctx.save();
    if (fpsCurr < 25) ctx.fillStyle = getCSSProp('--system-red');
    else if (fpsCurr < 40) ctx.fillStyle = getCSSProp('--system-yellowtext');
    else ctx.fillStyle = getCSSProp('--system-green');
    ctx.fillText(fpsCurr.toFixed(2)+"fps", -viewportW/2+30, -viewportH/2+30)
    ctx.fillRect(-viewportW/2+20, -viewportH/2+25, 5, 5);
      ctx.restore();
  }
  ctx.beginPath();



  if (hovering && !activeSettingsDialog) {
    ctx.save();
    ctx.fillStyle = getCSSProp("--system-green2");
    // ctx.strokeWidth = acceptRadius - stopSz;
    ctx.beginPath();
    // ctx.arc(hovering.x, hovering.y, acceptRadius, 0, K.PI*2);
    types[hovering.type](acceptRadius/3, hovering.x, hovering.y);
    ctx.fill();
    // clearCircle({x:hovering.x,y:hovering.y},stopSz);
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


  // existing paths///////////
  for (let i = 0; i < connections.length; i++) {
    // if (lines.length > 0) ctx.arc(lines[i][0].x, lines[i][0].y, acceptRadius, 0, K.PI*2);
    // // for (let i=1; i<currPath.length; i++) {
    let offset = handleOffset(connections[i]);
    let angBtw = Math.atan2(connections[i].to.y - connections[i].from.y,
      connections[i].to.x - connections[i].from.x);
    // angBtw += K.PI;
    ctx.save();
    // ctx.lineWidth = hoveringConn == connections[i]?K.LINEACCEPTDIST:K.LINEWIDTH;
    ctx.lineWidth = K.LINEWIDTH;
    ctx.lineCap = "round";

    if (hoveringConn && hoveringConn != connections[i] 
     || holdState == K.HOLD_CONNECTION
     || connections[i].pendingRemove)
      ctx.strokeStyle = getCSSProp("--system-grey3")//connections[i].colour+"55";
    else  
      ctx.strokeStyle = connections[i].colour;
    // else 
    // ctx.strokeStyle = hoveringConn == connections[i]?connections[i].colour+"55":connections[i].colour;
    ctx.beginPath();
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    // let newAng = angBtw;
    ctx.moveTo(connections[i].from.x + offset.x,
      connections[i].from.y         + offset.y);
    ctx.lineTo(connections[i].to.x   + offset.x,
      connections[i].to.y          + offset.y)
    ctx.stroke();
    ctx.beginPath();
    for (let stop of stops) {
      let dist =pDist(stop.x, stop.y, connections[i].from.x, connections[i].from.y, connections[i].to.x, connections[i].to.y);
      if (!samePt(stop, connections[i].from) && !samePt(stop, connections[i].to) && 
          dist < acceptRadius) {
        
        let basex = stop.x + dist*Math.cos(angBtw+K.PI/2);
        let basey = stop.y + dist*Math.sin(angBtw+K.PI/2);
        if (pDist(basex, basey, connections[i].from.x, connections[i].from.y, connections[i].to.x, connections[i].to.y) > 1) {
          basex = stop.x + dist*Math.cos(angBtw-K.PI/2);
          basey = stop.y + dist*Math.sin(angBtw-K.PI/2);
        } 
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(basex-c*acceptRadius, basey-s*acceptRadius);
        ctx.lineTo(basex+c*acceptRadius, basey+s*acceptRadius);
        ctx.lineWidth = K.LINEWIDTH/2;
        // ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = getCSSProp("--system-bg");
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
      }
    }
    ctx.restore();
  }


  let lastPt = currPath?currPath[currPath.length - 1]:null;
  let nextStop = nearestStop(currPos_canv, acceptRadius);
  if (holdState == K.HOLD_NEWLINE && (!nextStop || !samePt(nextStop, lastPt))){
      ctx.moveTo(lastPt.x, lastPt.y);
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineWidth = K.LINEWIDTH;
      ctx.lineTo(currPos_canv.x, currPos_canv.y);
      ctx.stroke();
      ctx.restore();
  }

  //////// current path /////////
  // connect(currPath, getCSSProp("--system-green"));
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = defaultClr;
  ctx.stroke();
  for (let i = 1; i < currPath.length; i++) {
    let angBtw = Math.atan2(currPath[i].y - currPath[i - 1].y,
      currPath[i].x - currPath[i - 1].x);
    ctx.beginPath();
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
    ctx.lineWidth = K.LINEWIDTH;
    ctx.moveTo(currPath[i - 1].x, currPath[i - 1].y);
    ctx.lineTo(currPath[i].x, currPath[i].y)
    ctx.stroke();
    ctx.strokeStyle = defaultClr;
  }
  ctx.lineWidth = 4;
  ctx.beginPath();

  for (let i=0; i<stops.length; i++) {
    ctx.save();
    ctx.beginPath();
    if (stops[i].failurePct > 0) {
      ctx.fillStyle = getCSSProp("--system-red2");
      // let pctRemaining = (timeNow() - stops[i].failureTimer)/K.FAILTIME;
      let pctRemaining = stops[i].failurePct;
      let pctOneSec = (timeNow() - stops[i].failurePct*K.FAILTIME)/300;
      let radScl = 0;
      if (pctOneSec < 1) 
        radScl = (-4*(pctOneSec-0.5)**2)+0.5;
      if (pctRemaining > 1 && pctRemaining < 2) {
        radScl = pctRemaining**120;
      }
      let currRad = stopSz+(acceptRadius-stopSz)*2+10*radScl;

      // let radiusFcn = 
      // cubic-bezier( 0.175, 0.885, 0.32, 1.275 )

      ctx.beginPath();
      ctx.moveTo(stops[i].x, stops[i].y);
      // ctx.strokeStyle = getCSSProp("--system-transp");
      ctx.arc(stops[i].x, stops[i].y, currRad, 0, Math.PI*pctRemaining*2);
      // ctx.stroke();
      ctx.fill();
      ctx.fill();
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(stops[i].x+currRad, stops[i].y);
      ctx.arc(stops[i].x, stops[i].y, currRad, 0, Math.PI*pctRemaining*2);
      ctx.strokeStyle = getCSSProp("--system-red");
      // ctx.lineTo(stops[i].x, stops[i].y);
      ctx.stroke();
      ctx.beginPath();
    }
    ctx.restore();
  }


  ////////// little stop circles //////////
  for (let i = 0; i < stops.length; i++) {
    // clearCircle(stops[i], stopSz);
    renderStop(stops[i]);
    // if ()
  }

  for (let i=0; i<recentlyRemoved.length; i++) {
    ctx.beginPath();
    ctx.save();
    ctx.strokeStyle = getCSSProp("--system-red");
    if (timeNow() - recentlyRemoved[i].time > 500) {
      recentlyRemoved.splice(i, 1);
      i--;
      continue;
    }
    ctx.globalAlpha = (1-(timeNow() - recentlyRemoved[i].time)/500)*0.5;
    // let off = handleOffset(recentlyRemoved[i].conn);
    ctx.lineWidth = K.LINEWIDTH;
    ctx.moveTo(recentlyRemoved[i].conn.from.x, recentlyRemoved[i].conn.from.y);
    ctx.lineTo(recentlyRemoved[i].conn.to.x, recentlyRemoved[i].conn.to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.restore();
  }

  ctx.save();
  ctx.lineWidth = 4;


  //////////////// existing path line circles ////////////////////
  for (let i = 0; i < connections.length; i++) {
    // ctx.strokeStyle = getCSSProp("--")
    // clearCircle(connections[i].from, stopSz);
    // clearCircle(connections[i].to, stopSz);
    ctx.beginPath();
    // ctx.lineWidth = K.LINEWIDTH;    
    ctx.fillStyle = getCSSProp("--system-bg");  
    ctx.strokeStyle = defaultClr;
    // ctx.fillStyle = getCSSProp("--system-bg" );
    ctx.lineWidth = K.LINEWIDTH;
    ctx.lineJoin = "round";
    types[connections[i].from.type](stopSz/3, connections[i].from.x, connections[i].from.y, true)
    // ctx.arc(connections[i].from.x, connections[i].from.y, stopSz, 0, K.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    types[connections[i].to.type](stopSz/3, connections[i].to.x, connections[i].to.y, true)
    ctx.stroke();
    // circle(connections[i].from)//, connections[i].colour);
    // circle(connections[i].to) //, connections[i].colour);
  }



  ctx.restore();
  ctx.beginPath();
  ////////////////////////////////
  ctx.restore();
  ctx.beginPath();
  if (holdState == K.HOLD_NEWLINE) {
    // must have a starting poibt

    let angBtw = Math.atan2(currPos_canv.y - lastPt.y,
      currPos_canv.x - lastPt.x);
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    // let nextStop = nearestStop(currPos_canv, acceptRadius);
    if (nextStop && samePt(nextStop, lastPt)) { // accepted new stop
      clearShape(lastPt, acceptRadius);
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      // ctx.arc(lastPt.x, lastPt.y, stopSz, 0, K.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.lineJoin = "round";
      // ctx.stroke();
      // circle(lastPt);
      ctx.lineWidth = 4;
      types[lastPt.type](stopSz/3, lastPt.x, lastPt.y, true)
      ctx.lineWidth = K.LINEWIDTH;
      types[lastPt.type](acceptRadius/3, lastPt.x, lastPt.y, true)
      ctx.restore();

    }
    ctx.beginPath();
    // else if (!nextStop) {

    // THERE'S A PROBLEM.
    // else if (nextStop) {

    //   angBtw = Math.atan2(nextStop.y - lastPt.y,
    //     nextStop.x - lastPt.x);
    //   c = Math.cos(angBtw);
    //   s = Math.sin(angBtw);
    //   ctx.moveTo(lastPt.x + c * acceptRadius, lastPt.y + s * acceptRadius);

    //   ctx.save();
    //   ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
    //   ctx.lineWidth = K.LINEWIDTH;
    //   ctx.lineTo(nextStop.x - c * acceptRadius, nextStop.y - s * acceptRadius);
    //   ctx.stroke();
    //   ctx.beginPath();
    //   ctx.lineWidth = 4;
    //   ctx.strokeStyle = getCSSProp("--system-red");
    //   ctx.arc(nextStop.x, nextStop.y, stopSz, 0, K.PI * 2);
    //   ctx.stroke();
    //   circle(nextStop);
    //   ctx.restore();
    // }
    // just not connected yet.


    //////////////// then put the current path large circles /////////
    for (let i = 0; i < currPath.length; i++) {
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      // circle(currPath[i]);
      ctx.lineJoin = "round";
      ctx.fillStyle = "rgba(0,0,0,0)";
      // ctx.strokeS
      // types[currPath[i].type](stopSz/3, currPath[i].x, currPath[i].y, true);
      ctx.lineWidth = K.LINEWIDTH;
      types[currPath[i].type](acceptRadius/3, currPath[i].x, currPath[i].y, true);
      ctx.restore();
    }
    // if (!samePt(nextStop, lastPt)) 
    //   ctx.strokeStyle = getCSSProp("--system-red");
    // else 
    // ctx.strokeStyle = getCSSProp("--system-green");

    // }
  }



  for (let stop of stops) {
    drawWaiting(stop);
  }

  // for (let i = 0; i < stops.length; i++)
  // now we draw the trains!
  for (let i = 0; i < trains.length; i++) {
    ctx.beginPath();
    let angBtw = Math.atan2(trains[i].to.y - trains[i].from.y,
      trains[i].to.x - trains[i].from.x);
    let nStop = nearestStop(trains[i], stopSz);
    // if (!nStop) nStop = nearestStop(trains[i].from, stopSz);
// angBtw = 0;
    let associatedConnection = getAssociatedConnection(trains[i]);
    let offset = handleOffset(associatedConnection);
    let center = { x: trains[i].x+offset.x, y: trains[i].y+offset.y };

    const w = 15;
    const h = 5*trains[i].cap;
    const c = Math.cos(angBtw);
    const c2 = Math.cos(angBtw + K.PI / 2)
    const s = Math.sin(angBtw);
    const s2 = Math.sin(angBtw + K.PI / 2);
    // const halfDiag = Math.sqrt(w*w/4+h*h/4)/2;
    ctx.save();
    // ctx.translate(-center.x, -center.y)
    // ctx.rotate(angBtw);
    // ctx.translate(center.x, center.y);
    if (hoveringTrain == trains[i]) {
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 15;
    }
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = associatedConnection.colour;
    if (trains[i].pendingMove) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = getCSSProp("--system-grey");
    }
    ctx.moveTo(center.x + c * h / 2 + c2 * w / 2, center.y + s * h / 2 + s2 * w / 2);
    ctx.lineTo(center.x + c * h / 2 - c2 * w / 2, center.y + s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 - c2 * w / 2, center.y - s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 + c2 * w / 2, center.y - s * h / 2 + s2 * w / 2);
    ctx.fill();
    ctx.fillStyle = defaultClr;
    let str = "";
    for (let pass of trains[i].passengers)
      str+= pass.to.toString();
    ctx.save();
    /// here coems the transformation!
    ctx.globalAlpha = 1;
    ctx.translate(center.x, center.y);
    ctx.beginPath();
    ctx.rotate(angBtw+(trains[i].revDir?Math.PI:0));
    let y = 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let uSz = w/2;
    let cap = trains[i].cap;
    for (let j=0; j<trains[i].passengers.length; j++) {
      if (j>=cap/2) y = 1;
      let px = j%(cap/2)*uSz+uSz/2-h/2;
      let py = y*uSz+uSz/2-w/2;
      types[trains[i].passengers[j].to](1, px, py);

    }
    // ctx.moveTo(-w/2, -h/2);
    // ctx.lineTo(w/2, h/2);
    // ctx.stroke();
    ctx.beginPath();
    ctx.restore();
    // ctx.fillRect(center.x - 8, center.y-2.5, 16, 5);
    ctx.restore();
  }

  if (activeSettingsDialog) {
    let stop = activeSettingsDialog.stop;
    let h = -activeSettingsDialog.hgt*
      Math.min(1, (Date.now()-activeSettingsDialog.time)/K.ANIM_SETTINGSDIALOG);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = getCSSProp("--system-overlay");
    ctx.moveTo(stop.x+acceptRadius, stop.y);
    // ctx.arc(stop.x, stop.y+h, acceptRadius, 0, K.PI*2);
    ctx.lineTo(stop.x+acceptRadius, stop.y+h);
    ctx.arc(stop.x, stop.y+h, acceptRadius, 0, K.PI, true);
    // ctx.lineTo(stop.x-acceptRadius, stop.y+h);
    ctx.lineTo(stop.x-acceptRadius, stop.y);
    ctx.arc(stop.x, stop.y, acceptRadius, 0, K.PI);
    // ctx.stroke();
    ctx.fill();
    renderStop(stop);
    ctx.beginPath();
    for (let i=0; i<Math.floor(-h/K.SETTINGSHEIGHT); i++) {
      ctx.beginPath();
      ctx.save();
      ctx.fillStyle = activeSettingsDialog.lines[i].colour+"95";
      if (activeSettingsDialog.selected == activeSettingsDialog.lines[i].lineID) {
        ctx.fillStyle = activeSettingsDialog.lines[i].colour;
      }
      ctx.arc(stop.x, stop.y-(i+1)*K.SETTINGSHEIGHT, stopSz, 0, K.PI*2);
      ctx.fill();
      // ctx.beginPath();
      if (activeSettingsDialog.selected == activeSettingsDialog.lines[i].lineID) {
        ctx.lineWidth = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = defaultClr;
        ctx.font = "30px Noto Sans Display";
        let baseX = stop.x;
        let baseY = stop.y-(i+1)*K.SETTINGSHEIGHT;
        ctx.moveTo(baseX-stopSz*0.5, baseY);
        ctx.lineTo(baseX+stopSz*0.5, baseY);
        ctx.moveTo(baseX, baseY-stopSz*0.5);
        ctx.lineTo(baseX, baseY+stopSz*0.5);
        ctx.strokeStyle = defaultClr;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.restore();
    }
    // ctx.beginPath();
    // ctx.fillStyle = getCSSProp("--system-red");
    // ctx.fill();
    ctx.restore();
    ctx.beginPath();

  }


  // ctx.save();
  // ctx.resetTransform();
  // ctx.fillStyle = getCSSProp("--system-grey3");
  // ctx.fillRect(0, 0, canv.width, 60);
  // ctx.strokeStyle = defaultClr;
  // ctx.moveTo(0, 60);
  // ctx.lineTo(canv.width, 60);
  // ctx.stroke();
  // ctx.fillStyle = defaultClr;

  // drawSVG("passengersServed", 30, 30, canv.width-200, 25)
  // ctx.font = "30px Noto Sans Display";
  // ctx.textBaseline = "top";
  // ctx.fillText(passengersServed, canv.width-165, 30);
  
  if (paused) {

    // ctx.fillRect(0,0, canv.width, canv.height);
    // ctx.globalAlpha = 1;
    // ctx.fillStyle = getCSSProp("--system-blue");
    // ctx.textAlign = "left";
    // ctx.textBaseline = "top";
    // ctx.font = "30px Noto Sans Display";

    // ctx.fillText("Paused", 40, 30);
  }
  ctx.restore();

} // redraw()

function renderStop(stop) {
  // ctx.arc(stop.x, stop.y, stopSz, 0, K.PI * 2);
  // ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = defaultClr;

  let deltaT = (Date.now() -stop.addedTime)/1500;
  let radScl = deltaT>=1?stopSz/3:stopSz/3*(70*(deltaT-0.443)**7+0.2)
  types[stop.type](Math.max(0,radScl), stop.x, stop.y);
  ctx.beginPath();
}

function HTMLActions() {
  byId("pServed").innerText = passengersServed;
  let time = ingametime();
  byId("time").innerText = `${padWithZero(time.d)}d ${padWithZero(time.h)}:${padWithZero(time.m)} (year ${time.y})`;
  setTimeout(HTMLActions, 100);
}

function drawWaiting(stop) {
  let y = 0, x=0;
  let dy = 15;
  ctx.fillStyle = defaultClr;
  let dx = 15;
  const maxW = 5; // # waiting per line before linebreak
  let baseOffset = Math.ceil(stop.waiting.length/maxW)*dy
  for (let j = 0; j < stop.waiting.length; j++) {
    if (x >= maxW) {
      y++;
      x=0;
    }
    let adjX = stop.x+stopSz+(x%maxW)*dx-dx/2;
    let adjY = (stop.y-baseOffset)-stopSz+y*dy-dy/2;
    x++;
    types[stop.waiting[j].to](2, adjX, adjY);
    // triangle(1.1, adjX, adjY)
    // out += stop.waiting[j].to.toString();
  }
}
