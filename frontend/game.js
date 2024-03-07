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
  PIANDABIT: Math.PI+0.1,
}
const trainSpeed = 100 / 1000; // pixels/ms
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
let typesOnLine = []
let lines = [];
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

function nextStop(train) {
 let currToIdx = currTrain.path.indexOf(nearestStop(currTrain.to,1));
  if (currToIdx == 0)
  {
    currTrain.revDir = !currTrain.revDir;
    nextStop = currTrain.from
  }
  else if (currToIdx == currTrain.path.length-1) {
    nextStop = currTrain.from;
    currTrain.revDir = !currTrain.revDir;
  }
  else if (currTrain.revDir) {
    nextStop = currTrain.path[currToIdx-1];
  }
  else nextStop = currTrain.path[currToIdx+1]; 
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
  // if (minRouteLength == K.INF) console.log("stranded"); 
  // else console.log("from route",pass.from,"to type",pass.to,"took route",pass.route,"transferring",minRouteLength,"times.")
}

function redraw() {
  // function connect(currPath, clr) {
  function circle(pt) {
    ctx.save();
    clearCircle(pt, acceptRadius);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, stopSz, 0, K.PIANDABIT * 2);
    ctx.stroke();
    // ctx.strokeStyle;
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
    ctx.moveTo(-viewportW / 2, -viewportH/2);
    ctx.lineTo(viewportW / 2, -viewportH/2);
    ctx.lineTo(viewportW / 2, viewportH/2);
    ctx.lineTo(-viewportW/2, viewportH/2);
    ctx.lineTo(-viewportW/2, -viewportH/2);
    ctx.stroke();
  }
  ctx.beginPath();
  if (hovering) {
    ctx.save();
    ctx.fillStyle = getCSSProp("--system-green2");
    // ctx.strokeWidth = acceptRadius - stopSz;
    ctx.beginPath();
    ctx.arc(hovering.x, hovering.y, acceptRadius, 0, K.PIANDABIT*2);
    ctx.fill();
    clearCircle({x:hovering.x,y:hovering.y},stopSz);
    ctx.restore();
  }
  ////////// little stop circles //////////
  for (let i = 0; i < stops.length; i++) {
    ctx.arc(stops[i].x, stops[i].y, stopSz, 0, K.PIANDABIT * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = defaultClr;
    let out = " ";
    for (let j = 0; j < stops[i].waiting.length; j++) {
      out += stops[i].waiting[j].to.toString();
    }
    ctx.fillText(out, stops[i].x + stopSz, stops[i].y - stopSz / 2);
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y)
  }
  // existing paths///////////
  for (let i = 0; i < connections.length; i++) {
    // if (lines.length > 0) ctx.arc(lines[i][0].x, lines[i][0].y, acceptRadius, 0, K.PIANDABIT*2);
    // // for (let i=1; i<currPath.length; i++) {
    let angBtw = Math.atan2(connections[i].to.y - connections[i].from.y,
      connections[i].to.x - connections[i].from.x);
    // angBtw += K.PIANDABIT;
    ctx.save();
    ctx.beginPath();
    let c = Math.cos(angBtw);
    let s = Math.sin(angBtw);
    ctx.strokeStyle = connections[i].colour;
    ctx.moveTo(connections[i].from.x + c * stopSz,
      connections[i].from.y + s * stopSz);
    ctx.lineTo(connections[i].to.x - c * stopSz,
      connections[i].to.y - s * stopSz)
    ctx.stroke();
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
    ctx.moveTo(currPath[i - 1].x + c * acceptRadius, currPath[i - 1].y + s * acceptRadius);
    ctx.lineTo(currPath[i].x - c * acceptRadius, currPath[i].y - s * acceptRadius)
    ctx.stroke();
    ctx.strokeStyle = defaultClr;
  }
  ctx.beginPath();


  //////////////// then put the current path large circles /////////
  for (let i = 0; i < currPath.length; i++) {
    ctx.save();
    ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
    circle(currPath[i]);
    ctx.restore();
  }

  //////////////// existing path lines ////////////////////
  for (let i = 0; i < connections.length; i++) {
    // ctx.strokeStyle = getCSSProp("--")
    clearCircle(connections[i].from, stopSz);
    clearCircle(connections[i].to, stopSz);
    ctx.beginPath();
    ctx.strokeStyle = defaultClr;
    ctx.arc(connections[i].from.x, connections[i].from.y, stopSz, 0, K.PIANDABIT * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(connections[i].to.x, connections[i].to.y, stopSz, 0, K.PIANDABIT * 2);
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
      ctx.arc(lastPt.x, lastPt.y, stopSz, 0, K.PIANDABIT * 2);
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
      ctx.lineTo(nextStop.x - c * acceptRadius, nextStop.y - s * acceptRadius);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = getCSSProp("--system-red");
      ctx.arc(nextStop.x, nextStop.y, stopSz, 0, K.PIANDABIT * 2);
      ctx.stroke();
      circle(nextStop);
      ctx.restore();
    }
    // just not connected yet.
    else {
      ctx.moveTo(lastPt.x + c * acceptRadius, lastPt.y + s * acceptRadius);
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = getCSSProp("--system-" + colours[0]);
      ctx.lineTo(currPos_canv.x, currPos_canv.y);
      ctx.stroke();
      ctx.restore();
    }
    // if (!samePt(nextStop, lastPt)) 
    //   ctx.strokeStyle = getCSSProp("--system-red");
    // else 
    // ctx.strokeStyle = getCSSProp("--system-green");

    // }
  }
  for (let i = 0; i < stops.length; i++)
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y)
  // now we draw the trains!
  for (let i = 0; i < trains.length; i++) {
    ctx.beginPath();
    let angBtw = Math.atan2(trains[i].to.y - trains[i].from.y,
      trains[i].to.x - trains[i].from.x);
    let nStop = nearestStop(trains[i].to, stopSz);
    if (nStop) {
      let pctRemaining = distBtw(nStop, trains[i].to)/stopSz;
      let nextTrainTo = nextStop(trains[i]);
      let angBtw2 = Math.atan2(trains[i].to.y - trains[i].from.y,
          trains[i].to.x - trains[i].from.x);
      // at stop, turn according to distance
    }
    let center = { x: trains[i].x, y: trains[i].y };
    const w = 15;
    const h = 30;
    const c = Math.cos(angBtw);
    const c2 = Math.cos(angBtw + K.PIANDABIT / 2)
    const s = Math.sin(angBtw);
    const s2 = Math.sin(angBtw + K.PIANDABIT / 2);
    // const halfDiag = Math.sqrt(w*w/4+h*h/4)/2;
    ctx.save();
    // ctx.translate(-center.x, -center.y)
    // ctx.rotate(angBtw);
    // ctx.translate(center.x, center.y);
    ctx.fillStyle = getCSSProp("--system-grey");
    ctx.moveTo(center.x + c * h / 2 + c2 * w / 2, center.y + s * h / 2 + s2 * w / 2);
    ctx.lineTo(center.x + c * h / 2 - c2 * w / 2, center.y + s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 - c2 * w / 2, center.y - s * h / 2 - s2 * w / 2);
    ctx.lineTo(center.x - c * h / 2 + c2 * w / 2, center.y - s * h / 2 + s2 * w / 2);
    ctx.fill();
    ctx.fillStyle = defaultClr;
    let str = "";
    for (let pass of trains[i].passengers)
      str+= pass.to.toString();
    ctx.fillText(str, center.x, center.y)
    // ctx.fillRect(center.x - 8, center.y-2.5, 16, 5);
    ctx.restore();
  }
  
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
      let pass = { from: stops[stopAdded], to: currType, route: [], status: K.WAITING };
      passengers.push(pass);
      handlePassenger(pass);
      stops[stopAdded].waiting.push(pass);
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
  redraw();
  scale(totalScaleFac);
  redraw();
  translate(canv.width / 2, canv.height / 2);
  redraw();
  //////
  // setInterval(animLoop, 1000/60);
  requestAnimationFrame(animLoop);
  startTime = Date.now();
  setTimeout(stopPopulationLoop, 5000);
}

function animLoop() {
  for (let i = 0; i < trains.length; i++) {
    let currTrain = trains[i];
    let distTotal = distBtw(trains[i].to, trains[i].from);
    // distToCover = s * px/s / px
    let distTravelled = (Date.now() - currTrain.startT) * trainSpeed;
    let percentCovered = distTravelled / distTotal;
    if (percentCovered < 0) continue;
    if (percentCovered >= 1) { // at a stop. 
      let startT = Date.now();
      percentCovered = 0;
      // let applicable = [];
      let currentTo = trains[i].to;//trains[i].revDir?trains[i].from:trains[i].to;
      let currStop = nearestStop(currentTo, 1);
      // how many people to drop off here?
      let delay = dropOff(currTrain, currentTo) * K.DELAYPERPASSENGER;
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
       nextStop = nextStop(currTrain);   
      // who to pick up?
      //  find which stops this line supports
      // let availableTransfers = new Set();
      
      // while (true) {
      currStop = nearestStop(currentTo, 1);
      let upcomingLinesServed = new Set(JSON.parse(JSON.stringify([...currStop.linesServed])));
      // 1. drop off people who are transferring - MAKE SURE THEY'RE ON THEIR WAY!
      for (let j=0; j<currTrain.passengers.length; j++) {
        let pass = currTrain.passengers[j];
        if (pass.route.length > 0 && pass.status == K.ONTHEWAY && 
            upcomingLinesServed.has(pass.route[0])) {
          currTrain.passengers.splice(j, 1);
          
          currStop.waiting.push(pass);
          // debugger;
          j--;
          pass.route.shift();
          console.log("dropoff of ",pass.to);
          delay += K.DELAYPERPASSENGER;
        }
      }
      // 2. pick up people who need transfers (they typically wait very long)
      for (let j=0; j<connections.length; j++) {
        if (connections[j].lineID == i) {
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
        if (currTrain.passengers.length >= currTrain.cap) break;
        if (pass.route.length > 0 && upcomingLinesServed.has(pass.route[0])) {
          currStop.waiting.splice(j, 1);
          j--;
          currTrain.passengers.push(pass);
          pass.status = K.ONTHEWAY;
          console.log("added transferrer")
          delay += K.DELAYPERPASSENGER;
        }
      }
        
      // 3. pick up people who do not have transfers at all
      for (let k = 0; k < currStop.waiting.length; k++) {
        if (currTrain.passengers.length >= currTrain.cap) break;
        // for (let j = 0; j < typesOnLine.length; j++) {

        if (typesOnLine[i].has(currStop.waiting[k].to)) {
          let adding = currStop.waiting[k];
          currStop.waiting.splice(k, 1);
          currTrain.passengers.push(adding);
          console.log(" added direct-router")
          adding.status = K.ONTHEWAY;
          k--;
        }
        delay += K.DELAYPERPASSENGER;
        // }
      }
      // if (currTrain.revDir) {

      
      currTrain.from = currTrain.to;
      currTrain.to = nextStop;
      currTrain.startT = startT + delay;
      // }
      console.log("StopHandler took ", Date.now() - startT+"s");
    } // if percentcoered = 1
    currTrain.x = currTrain.from.x + (currTrain.to.x - currTrain.from.x) * percentCovered;
    currTrain.y = currTrain.from.y + (currTrain.to.y - currTrain.from.y) * percentCovered;
  }
  redraw();

  requestAnimationFrame(animLoop);
}

function dropOff(currTrain, pt) {
  let stop = nearestStop(pt, 1);
  let matching = 0;
  for (let i = 0; i < currTrain.passengers.length; i++)
    if (currTrain.passengers[i].to == stop.type) {
      matching++;
      currTrain.passengers.splice(i, 1);
      i--;
    }
  return matching;
}

function stopPopulationLoop() {
  populateStops();
  redraw();
  setTimeout(stopPopulationLoop, 5000 + Math.random() * 7000);
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
      ang = Math.random() * 2 * K.PIANDABIT;
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
  currPos_canv = fromCanvPos(ev.clientX, ev.clientY);
  if (holdState == K.HOLD) {// && ev.shiftKey) {
    translate(ev.movementX, ev.movementY);
    redraw();
  }
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
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
        canAdd = true;
        holdState = K.NOHOLD;
      }
      if (canAdd) {
        currPath.push(nStop);
      }
    }
    redraw();
  }
  else if (nStop) {
    hovering = nStop;
  }
}

function pointerUp(ev) {
  holdState = K.NOHOLD;
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
            console.log("newCost",newCost,"rL",adj[i][j].route.length);
          }
          // adj[i][j].val = Math.min(adj[i][j].val, adj[i][k].val + adj[k][j].val);
        }
      }
      
    }
    console.log("==== RECALCULATION SUCCESS ====")
    for (pass of passengers) {
      handlePassenger(pass);
    }
    trains.push({
      x: currPath[0].x, y: currPath[0].y,
      from: currPath[0], to: currPath[1], path: currPath,
      lineID: lineCt, colour: currCol, startT: Date.now(),
      status: K.MOVING, passengers: [], cap:12, revDir:false
    });
    trains.push({
      x: currPath[0].x, y: currPath[0].y,
      from: currPath[currPath.length-1], to: currPath[currPath.length-2], path: currPath,
      lineID: lineCt, colour: currCol, startT: Date.now(),
      status: K.MOVING, passengers: [], cap:12, revDir:true
    });
    lineCt++;
  }
  currPath = [];
  redraw();
  if (!downPt || distBtw({ x: ev.clientX, y: ev.clientY }, downPt) > 10) return;
  // check for is it actually a click ^
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
  if (type >= exclude && exclude >= 0) return type + 1;
  return type;
  // if ()
}