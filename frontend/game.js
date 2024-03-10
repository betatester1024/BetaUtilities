const K = {
  /// train statuses, probably.
  MOVING: 1,
  STOPPED: 2,
  // touch action statuses
  NOHOLD: 0,
  HOLD: 1,
  HOLD_NEWLINE: 2,
  HOLD_CONNECTION:3,
  HOLD_EXTEND: 4,
  // passenger status 
  WAITING: 0,
  ONTHEWAY: 1,
  // settings dialog - base pixel height per terminal to be handled:
  SETTINGSHEIGHT: 50,
  // board/deboard time/passenger
  DELAYPERPASSENGER: 400,
  INF: 9e99,
  /// was supposed to be pi and a bit to make arcs completely touching but it didn't seem to work.
  PI: Math.PI,
  // animation times:
  ANIM_SETTINGSDIALOG: 100,

  // stop over-capacity timeout
  FAILTIME: 30000, // in ticks (scalable ms)
  PCTPERTICK: 1/30000,
  LINEWIDTH:10, // width of one line in base-size pixels 
  LINEACCEPTDIST: 20, // base-size pixels under which line dragging will be accepted
  // actionStatuses: 
  NOACTION:0,
  BOARDPENDING:1, // just boarding 
  DEBOARDPENDING:2, // just deboarding
  TRANSFERPENDING:3 // deboarding FOR TRANSFER.
}
const trainSpeed = 100 / 1000; // pixels/ms
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
let globalTicks = 0;
let currSpeed = 2;
function onLoad() {

}

function bezier(t , p1, p2, p3){
return (1-t)**2*p1 + 2*(1-t)*t*p2 + t**2*p3;
}

function timeNow() {
  return globalTicks;
}

function parallelStops(cmp) {
  let ct = 0;
  let idx = -1;
  let flipped = 0;
  for (let i=0; i<connections.length; i++) {
    let cnn= connections[i];
    if (samePt(cnn.from, cmp.from) && samePt(cnn.to, cmp.to)
       || samePt(cnn.from, cmp.to) && samePt(cnn.to, cmp.from)) {
      if (cmp == cnn && idx == -1) {  
        idx=ct;
      }
      if (samePt(cnn.from, cmp.to) && flipped == 0) flipped=1; // ONLY SET THIS ONCE
      else if (flipped == 0) flipped = 2;
      ct++;
    }
  }
  return {idx:idx, flipped:flipped==1, ct:ct};
}

function getNextStop(currTrain, actQ=true) {
  let line = lines[currTrain.lineID]
  let currToIdx = line.path.indexOf(nearestStop(currTrain.to,1));
  if (currTrain.revDir && currToIdx == 0)
  {
    if (line.loopingQ) {
      nextStop = line.path[line.path.length-2];
    }
    else {
      if (actQ) currTrain.revDir = !currTrain.revDir;
      nextStop = line.path[1];
    }
  }
  else if (!currTrain.revDir && currToIdx == line.path.length-1) {
    // nextStop = currTrain.from;
    nextStop = line.path[line.path.length-2];
    if (actQ) currTrain.revDir = !currTrain.revDir;
  }
  else if (currTrain.revDir) {
    nextStop = line.path[currToIdx-1];
  }
  else nextStop = line.path[currToIdx+1]; 
  if (!nextStop) debugger;
  return nearestStop(nextStop, 1);
}

function handlePassenger(pass) {
  if (pass.status != K.WAITING) return;
  let minRouteLength = K.INF;
  // let minRoute = [];
  for (let l=0; l<pass.from.linesServed.size; l++) {
    let lIdx = Array.from(pass.from.linesServed)[l];
    for (let i=0; i<typesOnLine.length; i++) {
      if (!typesOnLine[i].has(pass.to)) continue;
      if (minRouteLength > adj[lIdx][i].val) {
        minRouteLength = adj[lIdx][i].val;
        // pass.route=adj[lIdx][i].route;
        //WARNING! DO A DEEP COPY
        pass.route = [];
        for (let e of adj[lIdx][i].route)
          pass.route.push(e);
      }
    }
  }
}

function handleOffset(connection) {
  let angBtw = Math.atan2(connection.to.y - connection.from.y,
    connection.to.x - connection.from.x);
  // angBtw += K.PI;
  let info = parallelStops(connection);
  let offsetR = (K.LINEWIDTH/2)*(2*info.idx+1-info.ct) //+ stopSz;
  let newAng = info.flipped?(angBtw+Math.PI):angBtw;
  return {x:offsetR*Math.cos(newAng+Math.PI/2), y: offsetR*Math.sin(newAng+Math.PI/2)}
}

function getAssociatedConnection(train) {
  for (let cn of connections) {
    if (samePt(cn.to, train.to) && samePt(cn.from, train.from) || 
        samePt(cn.from, train.to) && samePt(cn.to, train.from))
      if (cn.lineID == train.lineID) return cn;
  }
  return null;
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
    ctx.moveTo(-viewportW / 2, -viewportH/2);
    ctx.lineTo(viewportW / 2, -viewportH/2);
    ctx.lineTo(viewportW / 2, viewportH/2);
    ctx.lineTo(-viewportW/2, viewportH/2);
    ctx.lineTo(-viewportW/2, -viewportH/2);
    ctx.stroke();
    ctx.fillText(fpsCurr.toFixed(2)+"fps", -viewportW/2+30, -viewportH/2+30)
  }
  ctx.beginPath();

  
  
  if (hovering && !activeSettingsDialog) {
    ctx.save();
    ctx.fillStyle = getCSSProp("--system-green2");
    // ctx.strokeWidth = acceptRadius - stopSz;
    ctx.beginPath();
    ctx.arc(hovering.x, hovering.y, acceptRadius, 0, K.PI*2);
    ctx.fill();
    clearCircle({x:hovering.x,y:hovering.y},stopSz);
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


  ////////// little stop circles //////////
  for (let i = 0; i < stops.length; i++) {
    clearCircle(stops[i], stopSz);
    renderStop(stops[i]);
    // if ()
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
    ctx.moveTo(connections[i].from.x + c * stopSz + offset.x,
      connections[i].from.y + s * stopSz          + offset.y);
    ctx.lineTo(connections[i].to.x - c * stopSz   + offset.x,
      connections[i].to.y - s * stopSz            + offset.y)
    ctx.stroke();
    ctx.restore();
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
    ctx.moveTo(currPath[i - 1].x + c * acceptRadius, currPath[i - 1].y + s * acceptRadius);
    ctx.lineTo(currPath[i].x - c * acceptRadius, currPath[i].y - s * acceptRadius)
    ctx.stroke();
    ctx.strokeStyle = defaultClr;
  }
  ctx.lineWidth = 4;
  ctx.beginPath();


  //////////////// existing path line circles ////////////////////
  for (let i = 0; i < connections.length; i++) {
    // ctx.strokeStyle = getCSSProp("--")
    clearCircle(connections[i].from, stopSz);
    clearCircle(connections[i].to, stopSz);
    ctx.beginPath();
    // ctx.lineWidth = K.LINEWIDTH;      
    ctx.strokeStyle = defaultClr;
    ctx.arc(connections[i].from.x, connections[i].from.y, stopSz, 0, K.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(connections[i].to.x, connections[i].to.y, stopSz, 0, K.PI * 2);
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
    let lastPt = currPath[currPath.length - 1];
    let angBtw = Math.atan2(currPos_canv.y - lastPt.y,
      currPos_canv.x - lastPt.x);
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    let nextStop = nearestStop(currPos_canv, acceptRadius);
    if (nextStop && samePt(nextStop, lastPt)) { // accepted new stop
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
    // else if (!nextStop) {
    if (nextStop && samePt(nextStop, lastPt)); // return;
    // THERE'S A PROBLEM.
    else if (nextStop) {

      angBtw = Math.atan2(nextStop.y - lastPt.y,
        nextStop.x - lastPt.x);
      c = Math.cos(angBtw);
      s = Math.sin(angBtw);
      ctx.moveTo(lastPt.x + c * acceptRadius, lastPt.y + s * acceptRadius);

      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineWidth = K.LINEWIDTH;
      ctx.lineTo(nextStop.x - c * acceptRadius, nextStop.y - s * acceptRadius);
      ctx.stroke();
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = getCSSProp("--system-red");
      ctx.arc(nextStop.x, nextStop.y, stopSz, 0, K.PI * 2);
      ctx.stroke();
      circle(nextStop);
      ctx.restore();
    }
    // just not connected yet.
    else {
      ctx.moveTo(lastPt.x + c * acceptRadius, lastPt.y + s * acceptRadius);
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineWidth = K.LINEWIDTH;
      ctx.lineTo(currPos_canv.x, currPos_canv.y);
      ctx.stroke();
      ctx.restore();
    }

    //////////////// then put the current path large circles /////////
    for (let i = 0; i < currPath.length; i++) {
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      circle(currPath[i]);
      ctx.restore();
    }
    // if (!samePt(nextStop, lastPt)) 
    //   ctx.strokeStyle = getCSSProp("--system-red");
    // else 
    // ctx.strokeStyle = getCSSProp("--system-green");

    // }
  }

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
  
  for (let i = 0; i < stops.length; i++)
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y)
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
    const h = 30;
    const c = Math.cos(angBtw);
    const c2 = Math.cos(angBtw + K.PI / 2)
    const s = Math.sin(angBtw);
    const s2 = Math.sin(angBtw + K.PI / 2);
    // const halfDiag = Math.sqrt(w*w/4+h*h/4)/2;
    ctx.save();
    // ctx.translate(-center.x, -center.y)
    // ctx.rotate(angBtw);
    // ctx.translate(center.x, center.y);
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
      if (trains[i].passengers[j].to == 0) star(1.2, px, py);
      else if (trains[i].passengers[j].to == 1) square(0.9, px, py);
        else if (trains[i].passengers[j].to == 2) triangle(1, px, py);
      else ctx.fillText(trains[i].passengers[j].to, px, py);

    }
    // ctx.moveTo(-w/2, -h/2);
    // ctx.lineTo(w/2, h/2);
    // ctx.stroke();
    ctx.beginPath();
    ctx.restore();
    // ctx.fillText(str, center.x, center.y)
    // ctx.fillRect(center.x - 8, center.y-2.5, 16, 5);
    ctx.restore();
  }

  if (activeSettingsDialog) {
    let stop = activeSettingsDialog.stop;
    let h = -activeSettingsDialog.hgt*
      Math.min(1, (timeNow()-activeSettingsDialog.time)/K.ANIM_SETTINGSDIALOG);
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

} // redraw()

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
  ctx.fillText(stop.type, stop.x, stop.y)
  ctx.beginPath();
}

function registerMaximisingCanvas(id, widthPc, heightPc, redrawFcn) { // (id:string, widthPc:number, heightPc:number, redrawFcn:()=>any) {
  //let canv = byId(id)// as HTMLCanvasElement;
  window.addEventListener("resize", (ev) => {
    canv.width = window.innerWidth * widthPc;
    canv.height = window.innerHeight * heightPc;
    // everything is gone - restore it!
    applyTransfm();
    redrawFcn();
  })
  canv.style.height = 100 * heightPc + "vh";
  canv.style.width = 100 * widthPc + "vw";
  canv.width = window.innerWidth * widthPc;
  canv.height = window.innerHeight * heightPc;
  redrawFcn();
}

function populateStops() {
  for (let i = 0; i < stops.length; i++) {
    if (Math.random() < 0.4) continue;
    let toAdd = Math.floor(Math.random() * (stops.length) / 3) + 1;
    for (let j = 0; j < toAdd; j++) {
      let stopAdded = Math.floor(Math.random() * stops.length);
      // if (stopAdded >= stops[i].type) stopAdded++;
      let currType = getNextType(stops[stopAdded].type);
      let pass = { from: stops[stopAdded], to: currType, route: [], 
                  status: K.WAITING, actionStatus: K.NOACTION, train:null, stop:null};
      passengers.push(pass);
      handlePassenger(pass);
      stops[stopAdded].waiting.push(pass);
      let stop = stops[stopAdded]
      if (stop.waiting.length > stop.capacity && !stop.failing) {
        stop.failing = true;
        stop.failureTimer=0;
      }

    }
  }
}

function preLoad() {
  canv = byId("canv");
  ctx = canv.getContext("2d");
  registerMaximisingCanvas("canv", 1, 0.95, redraw);
  if ((docURL.searchParams.get("debug")??"yesplease").match(/false|no|beans/)) {
    DEBUG = false;
  }
  canv.addEventListener("pointermove", onmove);
  canv.addEventListener("pointerdown", (ev) => {
    if (event.button != 0) return;
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
    }
    else if (activeSettingsDialog && activeSettingsDialog.selected != null) {
      let sel = activeSettingsDialog.selected;
      holdState = K.HOLD_EXTEND;
      extendInfo = {line:lines[sel], stop: activeSettingsDialog.stop};
      activeSettingsDialog = null;
    }
    else if (nConn) {
      holdState = K.HOLD_CONNECTION;
      modifyingConn = nConn;
    }
    if (holdState == K.HOLD || holdState == K.HOLD_CONNECTION) {
      document.body.style.cursor = "grabbing";
    }
  });
  window.addEventListener("keydown", keyUpdate);
  window.addEventListener("keyup", keyUpdate);
  window.addEventListener("pointerup", (e)=>{routeConfirm(e); onmove(e);});
  canv.addEventListener("wheel", (ev) => {
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
  })
  //////////
  // setup stops
  updateMinScl();
  // let firstPoint = genRandomPt();
  // firstPoint.waiting = [];
  // stops.push(firstPoint);
  // stops.type = 0;
  // let canvMinDim = Math.min(viewportW, viewportH); 
  for (let i = 0; i < 3; i++) {
    addNewStop(i);
  }
  totalScaleFac *= 0.8;
  // translate(-viewportW/2, -viewportH/2);
  scale(totalScaleFac);
  translate(canv.width / 2, canv.height / 2);
  redraw();
  //////
  // setInterval(animLoop, 1000/60);
  requestAnimationFrame(animLoop);
  startTime = timeNow();
  setTimeout(stopPopulationLoop, 5000/currSpeed);
}

function nearestConnection(x, y) {
  let bestDist = K.INF;
  let bestConn = null;
  for (let i=0; i<connections.length; i++) {
    let cn = connections[i];
    let off = handleOffset(cn);
    // let tOff = handleOffset(cn.to);
    let currDist = pDist(x, y, cn.from.x+off.x, cn.from.y+off.y, cn.to.x+off.x, cn.to.y+off.y);
    if (currDist < bestDist) {
      bestDist = currDist;
      bestConn = cn;
    }
  }
  // return bestConn;
  return bestDist < K.LINEACCEPTDIST?bestConn:null;
}

// thanks https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment#1501725
// love not writing my own code
function pDist(x, y, x1, y1, x2, y2) { // dist between line SEGMENT and pt

  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

  var xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  }
  else if (param > 1) {
    xx = x2;
    yy = y2;
  }
  else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function animLoop() {
  globalTicks += 16.66667*currSpeed; // 60fps default
  for (let i = 0; i < trains.length; i++) {
    let currTrain = trains[i];
    let distTotal = distBtw(trains[i].to, trains[i].from);
    // distToCover = s * px/s / px
    let distTravelled = (timeNow() - currTrain.startT) * trainSpeed;
    let percentCovered = distTravelled / distTotal;
    if (percentCovered < 0) continue;
    if (percentCovered >= 1) { // at a stop. 
      let startT = timeNow();
      percentCovered = 0;
      // let applicable = [];
      let currentTo = trains[i].to;//trains[i].revDir?trains[i].from:trains[i].to;
      let currStop = nearestStop(currentTo, 1);
      // currTrain.onCompletion = currTrain.passengers.length;
      // how many people to drop off here?
      let delay = dropOff(currTrain, currentTo) * K.DELAYPERPASSENGER/currSpeed;
      // figure out if the train is due to reverse first.
      let reverseQ = true;
      let nextStop = null;
      // for (let j = 0; j < connections.length && reverseQ; j++) {
      //   if ((trains[i].revDir ? samePt(connections[j].to, currentTo)
      //     : samePt(connections[j].from, currentTo))
      //     && connections[j].lineID == trains[i].lineID) {
      //     reverseQ = false;
      //     nextStop = trains[i].revDir ? connections[j].from : connections[j].to;
      //   }
      // }
      // no need to do all this nonsense the train knows its path
      let prevStop = currTrain.from;
      nextStop = getNextStop(currTrain);
      // if next stop is the same as the prev stop - we know that the train is reversing

      
      // who to pick up?
      //  find which stops this line supports
      // let availableTransfers = new Set();

      // while (true) {
      currStop = nearestStop(currentTo, 1);
      let upcomingLinesServed = new Set(JSON.parse(JSON.stringify([...currStop.linesServed])));
      // 1. drop off people who are transferring - MAKE SURE THEY'RE ON THEIR WAY!
      for (let j=0; j<currTrain.passengers.length; j++) {
        let pass = currTrain.passengers[j];
        if (pass.route.length > 0 && pass.status == K.ONTHEWAY 
            && pass.actionStatus == K.NOACTION &&
            upcomingLinesServed.has(pass.route[0])) {
          // currTrain.passengers.splice(j, 1);
          // currStop.toAdd.push({from:currTrain,pass:pass});
          // currTrain.onCompletion--;
          // // currStop.waiting.push(pass);
          // // debugger;
          // // j--;
          pass.actionStatus = K.TRANSFERPENDING;
          // pass.status = K.WAITING;
          pass.stop = currStop;
          pass.train = currTrain;
          pass.route.shift();
          delay += K.DELAYPERPASSENGER/currSpeed;
        }
      }
      // 2. pick up people who need transfers (they typically wait very long)
      for (let j=0; j<connections.length; j++) {
        if (connections[j].lineID == currTrain.lineID) {
          let fStop = nearestStop(connections[j].from, 1);
          let tStop = nearestStop(connections[j].to, 1);
          for (const nextLine of fStop.linesServed) 
            upcomingLinesServed.add(nextLine);
          for (const nextLine of tStop.linesServed) 
            upcomingLinesServed.add(nextLine);
        }
      }
      for (let j=0; j<currStop.waiting.length; j++) {
        let pass = currStop.waiting[j];
        // if (currTrain.onCompletion >= currTrain.cap) break;
        if (currStop.waiting[j].actionStatus != K.NOACTION) continue;
        if (pass.route.length > 0 && upcomingLinesServed.has(pass.route[0])) {
          // currStop.waiting.splice(j, 1);
          currStop.waiting[j].actionStatus = K.BOARDPENDING;
          // pass.status = K.ONTHEWAY;
          currStop.waiting[j].stop = currStop;
          currStop.waiting[j].train = currTrain;
          // j--;
          // currTrain.onCompletion++;
          // currTrain.toAdd.push({stop:currStop,pass:pass});
          // pass.status = K.ONTHEWAY;
          delay += K.DELAYPERPASSENGER/currSpeed;
        }
      }

      // 3. pick up people who do not have transfers at all
      for (let k = 0; k < currStop.waiting.length; k++) {
        // if (currTrain.passengers.length >= currTrain.cap) break;
        // for (let j = 0; j < typesOnLine.length; j++) {

        if (currStop.waiting[k].actionStatus != K.NOACTION) continue;
        if (typesOnLine[currTrain.lineID].has(currStop.waiting[k].to)) {
          let adding = currStop.waiting[k];
          currStop.waiting[k].actionStatus = K.BOARDPENDING;
          currStop.waiting[k].stop = currStop;
          currStop.waiting[k].train = currTrain;
          // adding.status = K.ONTHEWAY;
          // currStop.waiting.splice(k, 1);
          // currTrain.toAdd.push({stop:currStop,pass:adding});
          // k--;
        }
        delay += K.DELAYPERPASSENGER/currSpeed;
        // }
      }
      // if (currTrain.revDir) {
      if (delay > 0) currTrain.startT = K.INF;
      let connBeforeUpdate = getAssociatedConnection(currTrain);
      // if (!connBeforeUpdate.pendingRemove) connBeforeUpdate = null;
      currTrain.from = currTrain.to;
      currTrain.to = nextStop;

      handleAwaiting(currTrain, currStop);
      

      // }
      if (timeNow() - startT > 25) 
        console.log("WARNING: StopHandler took ", timeNow() - startT+"ms");
    } // if percentcoered = 1
    currTrain.x = currTrain.from.x + (currTrain.to.x - currTrain.from.x) * percentCovered;
    currTrain.y = currTrain.from.y + (currTrain.to.y - currTrain.from.y) * percentCovered;
  }
  for (let i=0; i<stops.length; i++) {
    if (stops[i].failurePct < 0) continue;
    let pctRemaining = stops[i].failurePct;
    if (pctRemaining > 1) {
      currSpeed*=0.99;
      // alertDialog("loser!", ()=>{
      //   location.reload();
      // });
      // return;
    }
  }
  let delta = timeNow() - startTime;
  startTime = timeNow();
  for (let stop of stops) {
    if (stop.failing) stop.failurePct+=K.PCTPERTICK*delta;
    else stop.failurePct= Math.max(0, stop.failurePct-K.PCTPERTICK*delta)
  }
  redraw(delta);
  requestAnimationFrame(animLoop);
}

function handleAwaiting(currTrain, currStop) {
  let handled = false;
  for (const pass of passengers) {
    if (pass.train != currTrain || pass.stop != currStop) continue;
    else if (pass.actionStatus == K.NOACTION) continue;
    // if people are trying to get on the train but unable to do so - abandon the action and wait for next recalculation
    else if (currTrain.passengers.length >= currTrain.cap && 
             pass.actionStatus == K.BOARDPENDING) {
      pass.actionStatus = K.NOACTION;
      continue;
    }
    else if (pass.actionStatus == K.BOARDPENDING) {
      pass.actionStatus = K.NOACTION;
      for (let i=0; i<currStop.waiting.length; i++) 
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
    }
    else if (pass.actionStatus == K.DEBOARDPENDING) {
      pass.actionStatus = K.NOACTION;
      for (let i=0; i<currTrain.passengers.length; i++) 
        if (currTrain.passengers[i] == pass) {
          currTrain.passengers.splice(i,1);
          break;
        }
      pass.status = K.WAITING;
      if (currStop.waiting.length < currStop.capacity)
        currStop.failing =false;
      pass.actionStatus = K.NOACTION;
      handled = true;
      break;
    }
    else if (pass.actionStatus == K.TRANSFERPENDING) {
      pass.actionStatus = K.NOACTION;
      for (let i=0; i<currTrain.passengers.length; i++) 
        if (currTrain.passengers[i] == pass) {
          currTrain.passengers.splice(i,1);
          currStop.waiting.push(pass);
          break;
        }
      pass.status = K.WAITING;
      pass.actionStatus = K.NOACTION;
      let stop = currStop;
      if (stop.waiting.length > stop.capacity && stop.failurePct < 1)
        stop.failing=true;
      handled = true;
      break;
    }
    else throw("invalid actionStatus!");
  }
  if (handled) setTimeout(()=>{handleAwaiting(currTrain, currStop)}, K.DELAYPERPASSENGER/currSpeed);
  else {
    currTrain.startT = timeNow();
    for (const affectedConn of connections) {
      if (affectedConn.pendingRemove) {
        let canUpdate = true;
        // check if all trains have cleared this connection
        let currLine = lines[affectedConn.lineID];
        for (affectedTrain of currLine.trains) {
          if (getAssociatedConnection(affectedTrain) == affectedConn) {
            canUpdate = false;
            break;
          }
        }
        if (canUpdate) updateToNow(currLine, affectedConn);
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
      // currTrain.passengers.splice(i, 1);
      // currTrain.onCompletion--;
      currTrain.passengers[i].actionStatus = K.DEBOARDPENDING;
      currTrain.passengers[i].stop = stop;
      currTrain.passengers[i].train = currTrain;
      // currTrain.toRemove.push({stop:stop, pass:currTrain.passengers[i]});
      // i--;
    }
  return matching;
}

function stopPopulationLoop() {
  populateStops();
  redraw();
  setTimeout(stopPopulationLoop, (5000 + Math.random() * 7000)/currSpeed);
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
  if (type < 0) type = getNextType();
  if (stops.length > 0)
    do {
      // newPt = genRandomPt();
      // this is stupid.
      refPt = stops[Math.floor(Math.random() * stops.length)];
      // if (refPt)
      ang = Math.random() * 2 * K.PI;
      dist = 150 + Math.random() * 100
      newPt = { x: refPt.x + dist * Math.cos(ang), y: refPt.y + dist * Math.sin(ang) };
    } while (!(!nearestStop(newPt, 150) && withinViewport(newPt)));
  else newPt = genRandomPt();
  stops.push(newPt);
  maxUnlockedType = Math.max(maxUnlockedType, type);
  updateMinScl(minSclFac * 0.98);
  newPt.waiting = [];
  newPt.linesServed = new Set();
  newPt.type = type;
  newPt.toAdd = [];
  newPt.failing = false;
  newPt.failurePct = 0;
  newPt.capacity = 6;
  redraw();
}

function keyUpdate(ev) {
  // if (!shiftStatus && ev.shiftKey)
  //   document.body.style.cursor = "grab";
  // else if (shiftStatus && !ev.shiftKey) 
  //   document.body.style.cursor = "";
  // shiftStatus = ev.shiftKey;
}

function onmove(ev) {
  // if (ev.shiftKey) {
  //   document.body.style.cursor = "grabbing";
  // }
  hovering = null;
  let rmSettings = true;
  hoveringConn = null;
  currPos_canv = fromCanvPos(ev.clientX, ev.clientY);
  // let 
  if (holdState == K.HOLD) {// && ev.shiftKey) {
    translate(ev.movementX, ev.movementY);
    redraw();
  }
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  let nConn = nearestConnection(actualPos.x, actualPos.y);
  let nStop = nearestStop(actualPos, acceptRadius);
  if (holdState == K.HOLD_NEWLINE) {

    let lastStop = currPath[currPath.length - 1];
    // if (!nStop) // 
    //   currPath.pop();
    if (nStop) {
      let canAdd = true;
      for (let i = 0; i < currPath.length && canAdd; i++) {
        if (samePt(currPath[i], nStop)) canAdd = false;
      }
      if (!canAdd && currPath.length > 2
        && samePt(nStop, currPath[0]) && !samePt(nStop, lastStop)) {
        currPath.push(nStop);
        routeConfirm();
        // holdState = K.NOHOLD;
      }
      if (canAdd) {
        currPath.push(nStop);
      }
    }
    redraw();
  }
  else if (holdState == K.HOLD_CONNECTION) {
    if (nStop) {
      let currLine = lines[modifyingConn.lineID];
      // 
      let newConn = {from:modifyingConn.from, to:nStop, 
         lineID:modifyingConn.lineID, 
         colour:modifyingConn.colour};
      let newConn2 = {from:nStop, to:modifyingConn.to, 
          lineID:modifyingConn.lineID, 
          colour:modifyingConn.colour};
      if (parallelStops(newConn).ct < 3 && parallelStops(newConn2).ct < 3
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
        typesOnLine[modifyingConn.lineID].add(nStop.type)
        nStop.linesServed.add(modifyingConn.lineID);
        for (let pass of passengers)
          handlePassenger(pass);
        let idx = currLine.path.indexOf(modifyingConn.from);
        currLine.path.splice(idx+1, 0, nStop);
        
        // if (!modifyingConn.pendingRemoval) 
        holdState = K.NOHOLD;
        routeConfirm(); 
      }

    }
  }
  else if (holdState == K.HOLD_EXTEND && nStop) {
    let currLine = extendInfo.line
    if (!currLine.stops.has(nStop) 
     || (nStop == currLine.path[0] && extendInfo.stop == currLine.path[currLine.path.length-1]
         || nStop == currLine.path[currLine.path.length-1] && extendInfo.stop == currLine.path[0])
        && currLine.path.length > 2) {
      let newConn = {from:extendInfo.stop, to:nStop, 
           lineID:currLine.lineID, 
           colour:currLine.colour};
      connections.push(newConn);
      typesOnLine[currLine.lineID].add(nStop.type);
      nStop.linesServed.add(currLine.lineID);
      currLine.stops.add(nStop);
      if (currLine.path[currLine.path.length-1] == extendInfo.stop) 
        currLine.path.push(nStop);
      else currLine.path.splice(0, 0, nStop)
      if (currLine.path[0] == currLine.path[currLine.path.length-1]) currLine.loopingQ = true;
      extendInfo = null;
      for (let pass of passengers)
        handlePassenger(pass);
      holdState = K.NOHOLD;
      routeConfirm();
      
    } // extend successful    
  }
  else if (nStop) {
    let terms = terminals(nStop);
    if (terms && holdState == K.NOHOLD && (!activeSettingsDialog || activeSettingsDialog.stop != nStop)) {
      activeSettingsDialog = {
        stop:nStop, time:timeNow()+50,
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
    if (rmSettings && nConn) {
      hoveringConn = nConn;
      document.body.style.cursor = "pointer";
    }
    else if (rmSettings && holdState == K.NOHOLD) document.body.style.cursor = "";
  }
  if (rmSettings) {
    activeSettingsDialog = null;
  }
}

function terminals(stop) {
  let out = [];
  for (let i=0; i<lines.length; i++)
    if ((lines[i].path[0] == stop || lines[i].path[lines[i].path.length-1] == stop)
      && lines[i].path[0] != lines[i].path[lines[i].path.length-1])
      out.push(lines[i]);
  return out.length == 0?null:out;
}
function updateToNow(currLine, conn) {
  // for (affectedTrain of currLine.trains) {
  // let fIdx = affectedTrain.path.indexOf(conn.from);
    // affectedTrain.path.splice(fIdx+1, 0, nStop);
  // }
  // conn.to = nStop; 
  let idx = connections.indexOf(conn);
  connections.splice(idx, 1);
  recentlyRemoved.push({conn:conn, time:timeNow()});
  // connections.push(newConn);
}

function routeConfirm(ev) {
  holdState = K.NOHOLD;
  extendInfo = null;
  document.body.style.cursor = holdState == K.HOLD ? "grab" : "";
  if (currPath.length > 1) {
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
    adj = [];
    for (let i = 0; i < typesOnLine.length; i++) {
      let row = [];
      for (let j = 0; j < typesOnLine.length; j++) {
        row.push({ route:[], val: K.INF });
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
      for (let j=0; j<served.length; j++) {
        adj[served[j]][served[j]].val = 0;
        adj[served[j]][served[j]].route = [];
      }
    }
    for (let k = 0; k < adj.length; k++) {
      for (let j = 0; j < adj.length; j++) {
        for (let i = 0; i < adj.length; i++) {
          if (i == k || j == k) continue;
          let newCost = adj[i][k].val+adj[k][j].val;
          if (newCost < adj[i][j].val) {
            adj[i][j].val = newCost;
            adj[i][j].route = [];

            // let replaceIdx = adj[i][j].indexOf(i);
            for (let n=0; n<adj[i][k].route.length; n++) 
              adj[i][j].route.push(adj[i][k].route[n])
            for (let n=0; n<adj[k][j].route.length; n++) 
              adj[i][j].route.push(adj[k][j].route[n])
          }
          // adj[i][j].val = Math.min(adj[i][j].val, adj[i][k].val + adj[k][j].val);
        }
      }

    }
    console.log("==== RECALCULATION SUCCESS ====")
    for (pass of passengers) {
      handlePassenger(pass);
    }
    let t1 = {
        x: currPath[0].x, y: currPath[0].y,
        from: currPath[0], to: currPath[1],
        lineID: lineCt, colour: currCol, startT: timeNow(),
        status: K.MOVING, passengers: [], cap:6, revDir:false, 
        //toAdd:[], toRemove:[], onCompletion:0
      };
    let t2 = {
        x: currPath[0].x, y: currPath[0].y,
        from: currPath[currPath.length-1], to: currPath[currPath.length-2],
        lineID: lineCt, colour: currCol, startT: timeNow(),
        status: K.MOVING, passengers: [], cap:6, revDir:true,//, toAdd:[], toRemove:[], 
        //onCompletion:0
      };
    trains.push(t1);
    trains.push(t2);
    currLine2.trains = [t1, t2];
    lineCt++;
  }
  currPath = [];
  redraw();
  if (!ev || !downPt || distBtw({ x: ev.clientX, y: ev.clientY }, downPt) > 10) return;
  // check for is it actually a click ^
  ctx.beginPath();
  // let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  // ctx.moveTo(actualPos.x - 0.5, actualPos.y - 0.5);
  // ctx.lineTo(actualPos.x + 0.5, actualPos.y + 0.5);
  // ctx.stroke();
  // ctx.fillText(actualPos.x.toFixed(2) + ", " + actualPos.y.toFixed(2), actualPos.x, actualPos.y);
}

function samePt(pt1, pt2) {
  return Math.abs(pt1.x - pt2.x) < 0.1 && Math.abs(pt1.y - pt2.y) < 0.1;
}

function genRandomPt() {
  return {
    x: Math.random() * viewportW - viewportW / 2,
    y: Math.random() * viewportH - viewportH / 2
  }
}

function nearestStop(newPt, minDist) {
  let found = null;
  for (let i = 0; i < stops.length; i++) {
    let dist = distBtw(stops[i], newPt);
    if (dist < minDist) {
      found = stops[i];
      minDist = dist;
    }
  }
  return found;
}

function withinViewport(newPt) {
  // let viewportScl = minSclFac*0.8;
  // should be <1 and decreasing
  if (newPt.x < -viewportW / 2) return false;
  if (newPt.x > viewportW / 2) return false;
  if (newPt.y < -viewportH / 2) return false;
  if (newPt.y > viewportH / 2) return false;
  return true;
}
function distBtw(pt1, pt2) {
  function sq(x) { return x * x; }
  return Math.sqrt(sq(pt1.x - pt2.x) + sq(pt1.y - pt2.y));
}
/// the matrix stuff :V
let transfm = [1, 0, 0,
  0, 1, 0];
function translate(x, y) {
  transfm[2] += x;
  transfm[5] += y;
  applyTransfm();
}
function fromCanvPos(canvX, canvY) {
  return { x: (canvX - transfm[2]) / transfm[0], y: (canvY - transfm[5]) / transfm[4] };
}
function scale(scl) {
  // matrix mult with [
  // sclX 0
  // 0  sclY
  // 0  0
  for (let i = 0; i < 6; i++) transfm[i] *= scl;
  applyTransfm();
}
function applyTransfm() {
  ctx.setTransform(transfm[0], transfm[3], transfm[1], transfm[4], transfm[2], transfm[5]);
}

function square(scl, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x-3*scl, y-3*scl);
  ctx.lineTo(x+3*scl, y-3*scl);
  ctx.lineTo(x+3*scl, y+3*scl);
  ctx.lineTo(x-3*scl, y+3*scl);
  ctx.lineTo(x-3*scl, y-3*scl);
  ctx.fill();
  ctx.beginPath();
  ctx.restore();
}
function triangle(scl, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x-3*scl, y+3*scl);
  // ctx.lineTo(x+3*scl, y-3*scl);
  ctx.lineTo(x, y-3*scl);
  ctx.lineTo(x+3*scl, y+3*scl);
  ctx.lineTo(x-3*scl, y+3*scl);
  ctx.fill();
  ctx.beginPath();
  ctx.restore();
}
function circ() {

}
function star(scl,x,y) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x-3*scl,y+1*scl);
  ctx.lineTo(x-0.75*scl, y+1*scl);
  ctx.lineTo(x, y+3*scl);
  ctx.lineTo(x+0.75*scl, y+1*scl);
  ctx.lineTo(x+3*scl, y+1*scl);
  ctx.lineTo(x+1.25*scl, y-0.5*scl);
  ctx.lineTo(x+2*scl, y-2.5*scl);
  ctx.lineTo(x, y-1.25*scl)
  ctx.lineTo(x-2*scl, y-2.5*scl);
  ctx.lineTo(x-1.25*scl, y-0.5*scl);
  ctx.lineTo(x-3*scl, y+1*scl);
  ctx.fill();
  ctx.beginPath();
  ctx.restore();
}

function getNextType(exclude = -1) {
  let type = Math.floor(Math.random() * (exclude < 0 ? types.length : maxUnlockedType));
  if (type >= exclude && exclude >= 0) return type + 1;
  return type;
  // if ()
}