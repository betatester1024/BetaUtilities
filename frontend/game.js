const K = {
  MOVING:1,
  STOPPED:2,
  NOHOLD:0,
  HOLD:1,
  HOLD_NEWLINE:2
}
const trainSpeed = 100/1000; // pixels/ms
let holdState = K.NOHOLD;
let ctx = null;
let canv = null;
let totalScaleFac = 1;
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
let typesOnLine =  []
let trains = [];
let maxUnlockedType = 0;
const acceptRadius = 30;
const stopSz = 20;
let adj = [];
let currPos_canv = null;
let lineCt = 0;
let shiftStatus = false;
let downPt = null;
let types = [triangle, square, circ, star];
let defaultClr = "#000";
const colours = ["green", "yellow", "blue", "orange", "purple", "grey"]
function onLoad() {
  
}

function closestRoute(stopID, destType) {
  let connections = Array(stops.length).fill(Array(stops.length).fill(Infinity));
  for (let i=0; i<stops; i++) {
    
  }
  console.log(connections);
}

function redraw() {
  // function connect(currPath, clr) {
  function circle(pt) {
    ctx.save();
      clearCircle(pt, acceptRadius);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, stopSz, 0, Math.PI*2);
      ctx.stroke();
      // ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, acceptRadius, 0, Math.PI*2);
      ctx.stroke();
    ctx.restore();
    ctx.beginPath();
  }
  function clearCircle(pt, rad) {
    ctx.beginPath();
    ctx.fillStyle = getCSSProp("--system-grey3");
    ctx.save();
      ctx.arc(pt.x, pt.y, rad+2, 0, Math.PI*2);
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
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.moveTo(-viewportW/2, -viewportH/2);
  ctx.lineTo(viewportW/2, viewportH/2);
  ctx.stroke();
  ctx.beginPath();

  ////////// little stop circles //////////
  for (let i=0; i<stops.length; i++) {
    ctx.arc(stops[i].x, stops[i].y, stopSz, 0, Math.PI*2);    
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = defaultClr;
    let out = " ";
    for (let j=0; j<stops[i].waiting.length; j++) {
      out += stops[i].waiting[j].toString();
    }
    ctx.fillText(out, stops[i].x+stopSz, stops[i].y-stopSz/2);
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y)
  }
  // existing paths///////////
  for (let i=0; i<connections.length; i++) {
    // if (lines.length > 0) ctx.arc(lines[i][0].x, lines[i][0].y, acceptRadius, 0, Math.PI*2);
    // // for (let i=1; i<currPath.length; i++) {
    let angBtw = Math.atan2(connections[i].to.y-connections[i].from.y, 
                            connections[i].to.x-connections[i].from.x);
    // angBtw += Math.PI;
    ctx.save();
      ctx.beginPath();
      let c = Math.cos(angBtw);
      let s = Math.sin(angBtw);
      ctx.strokeStyle = connections[i].colour;
      ctx.moveTo(connections[i].from.x + c*stopSz, 
                 connections[i].from.y + s*stopSz);
      ctx.lineTo(connections[i].to.x - c*stopSz, 
                 connections[i].to.y - s*stopSz)
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
    for (let i=1; i<currPath.length; i++) {
      let angBtw = Math.atan2(currPath[i].y-currPath[i-1].y, 
                              currPath[i].x-currPath[i-1].x);
      ctx.beginPath();
      let c = Math.cos(angBtw);
      let s = Math.sin(angBtw);
      ctx.strokeStyle = getCSSProp("--system-"+colours[0]);
      ctx.moveTo(currPath[i-1].x + c*acceptRadius, currPath[i-1].y + s*acceptRadius);
      ctx.lineTo(currPath[i].x -   c*acceptRadius, currPath[i].y   - s*acceptRadius)
      ctx.stroke();
      ctx.strokeStyle = defaultClr;
    }
  ctx.beginPath();


  //////////////// then put the current path large circles /////////
  for (let i=0; i<currPath.length; i++) {
    ctx.save();
      ctx.strokeStyle = getCSSProp("--system-"+colours[0]);
      circle(currPath[i]);
    ctx.restore();
  }

  //////////////// existing path lines ////////////////////
  for (let i=0; i<connections.length; i++) {
    // ctx.strokeStyle = getCSSProp("--")
    clearCircle(connections[i].from, stopSz);
    clearCircle(connections[i].to, stopSz);
    ctx.beginPath();
    ctx.strokeStyle = defaultClr;
    ctx.arc(connections[i].from.x, connections[i].from.y, stopSz, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(connections[i].to.x, connections[i].to.y, stopSz, 0, Math.PI*2);
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
    let lastPt = currPath[currPath.length-1];
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
      ctx.strokeStyle = getCSSProp("--system-"+colours[0]);
      ctx.arc(lastPt.x, lastPt.y, stopSz, 0, Math.PI*2);
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
      ctx.moveTo(lastPt.x + c*acceptRadius, lastPt.y + s*acceptRadius);
      
      ctx.save();
      ctx.strokeStyle = getCSSProp("--system-"+colours[0]);
      ctx.lineTo(nextStop.x - c*acceptRadius, nextStop.y - s*acceptRadius);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = getCSSProp("--system-red");
      ctx.arc(nextStop.x, nextStop.y, stopSz, 0, Math.PI*2);
      ctx.stroke();
      circle(nextStop);
      ctx.restore();
    }
    // just not connected yet.
    else {
      ctx.moveTo(lastPt.x + c*acceptRadius, lastPt.y + s*acceptRadius);
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = getCSSProp("--system-"+colours[0]);
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
  for (let i=0; i<stops.length; i++) 
    ctx.fillText(stops[i].type, stops[i].x, stops[i].y)
  // now we draw the trains!
  for (let i=0; i<trains.length; i++) {
    ctx.beginPath();
    // console.log(trains[i].from, trains[i].to);
    let angBtw = Math.atan2(trains[i].to.y-trains[i].from.y,
                            trains[i].to.x-trains[i].from.x);
    let center = {x:trains[i].x, y:trains[i].y};
    // console.log(center);
    const w = 15;
    const h = 30;
    const c = Math.cos(angBtw);
    const c2 = Math.cos(angBtw+Math.PI/2)
    const s = Math.sin(angBtw);
    const s2 = Math.sin(angBtw+Math.PI/2);
    // const halfDiag = Math.sqrt(w*w/4+h*h/4)/2;
    ctx.save();
      // ctx.translate(-center.x, -center.y)
      // ctx.rotate(angBtw);
      // ctx.translate(center.x, center.y);
      ctx.fillStyle = getCSSProp("--system-grey");
      ctx.moveTo(center.x+c*h/2+c2*w/2, center.y+s*h/2+s2*w/2);
      ctx.lineTo(center.x+c*h/2-c2*w/2, center.y+s*h/2-s2*w/2);
      ctx.lineTo(center.x-c*h/2-c2*w/2, center.y-s*h/2-s2*w/2);
      ctx.lineTo(center.x-c*h/2+c2*w/2, center.y-s*h/2+s2*w/2);
      ctx.fill();
      ctx.fillStyle = defaultClr;
      ctx.fillText(trains[i].passengers.join(""), center.x, center.y)
      // ctx.fillRect(center.x - 8, center.y-2.5, 16, 5);
    ctx.restore();
  }
}

function registerMaximisingCanvas(id, widthPc, heightPc, redrawFcn) { // (id:string, widthPc:number, heightPc:number, redrawFcn:()=>any) {
  //let canv = byId(id)// as HTMLCanvasElement;
  window.addEventListener("resize", (ev)=>{
    console.log("resizing");
    canv.width = window.innerWidth*widthPc;
    canv.height = window.innerHeight*heightPc;
    // everything is gone - restore it!
    applyTransfm();
    redrawFcn();
  })
  canv.style.height = 100*heightPc+"vh";
  canv.style.width = 100*widthPc+"vw";
  canv.width = window.innerWidth*widthPc;
  canv.height = window.innerHeight*heightPc;
  redrawFcn();
}

function populateStops() {
  for (let i=0; i<stops.length; i++) {
    if (Math.random() < 0.4) continue;
    let toAdd = Math.floor(Math.random()*(stops.length)/3)+1;
    for (let j=0; j<toAdd; j++) {
      let stopAdded = Math.floor(Math.random()*stops.length);
      // if (stopAdded >= stops[i].type) stopAdded++;
      stops[stopAdded].waiting.push(getNextType(stops[stopAdded].type));
    }
  }
}

function preLoad() {
  canv = byId("canv");
  ctx = canv.getContext("2d");
  registerMaximisingCanvas("canv", 1, 0.95, redraw);
  canv.addEventListener("pointermove", onmove);
  canv.addEventListener("pointerdown", (ev)=>{
    holdState = K.HOLD;
    downPt = {x:ev.clientX, y:ev.clientY};
    let actualPos = fromCanvPos(ev.clientX, ev.clientY);
    let nStop = nearestStop(actualPos, acceptRadius);
    if (nStop && colours.length>0) {
      holdState = K.HOLD_NEWLINE;
      console.log(nStop);
      currPath = [nStop];
      redraw();
    }
    if (holdState == K.HOLD) {
      document.body.style.cursor = "grabbing";
    }
    console.log("holdState", holdState)
  });
  window.addEventListener("keydown", keyUpdate);
  window.addEventListener("keyup", keyUpdate);
  window.addEventListener("pointerup", pointerUp);
  canv.addEventListener("wheel", (ev)=>{
    // larger -ve deltaY: 
    // ctx.
    // let sclFac = (ev.deltaY<0?Math.pow(10, -ev.deltaY/750):Math.pow(10, -ev.deltaY/400))
    let sclFac = (ev.deltaY<0?1.2:1/1.2)
    if (sclFac*totalScaleFac > maxSclFac)
      sclFac = maxSclFac/totalScaleFac;
    if (sclFac*totalScaleFac < minSclFac) 
      sclFac = minSclFac/totalScaleFac;
    // console.log(sclFac, totalScaleFac);
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
  for (let i=0; i<3; i++) {
    addNewStop(i);
  }
  totalScaleFac*= 0.8;
  // console.log(viewportW, viewportH);
  // translate(-viewportW/2, -viewportH/2);
  redraw();
  scale(totalScaleFac);
  redraw();
  translate(canv.width/2, canv.height/2);
  redraw();
  //////
  // setInterval(animLoop, 1000/60);
  requestAnimationFrame(animLoop);
  setTimeout(stopPopulationLoop, 5000);
}

function animLoop() {
  for (let i=0; i<trains.length; i++) {
    let currTrain = trains[i];
    let distTotal = distBtw(trains[i].to, trains[i].from);
    // distToCover = s * px/s / px
    let distTravelled = (Date.now() - currTrain.startT)*trainSpeed;
    // console.log(distTravelled);
    let percentCovered = distTravelled/distTotal;
    if (percentCovered < 0) continue;
    if (percentCovered >= 1) { // at a stop. 
      let startT = Date.now();
      percentCovered = 0; 
      // let applicable = [];
      let currentTo = trains[i].to;//trains[i].revDir?trains[i].from:trains[i].to;
      let currStop = nearestStop(currentTo, 1);
      // console.log(numberMatching(currTrain, currentTo));
      // how many people to drop off here?
      let delay = dropOff(currTrain, currentTo)*400;
      // figure out if the train is due to reverse first.
      let reverseQ = true;
      let nextStop = null;
      for (let j=0; j<connections.length && reverseQ; j++) {
        if ((trains[i].revDir?samePt(connections[j].to, currentTo)
             :samePt(connections[j].from, currentTo))
           && connections[j].lineID == trains[i].lineID) {
          reverseQ = false;
          nextStop = trains[i].revDir?connections[j].from:connections[j].to;
        }
      }
      if (reverseQ) {
        nextStop = trains[i].from;
        // console.log("reversing")
        currTrain.revDir = !currTrain.revDir;
      }
      // who to pick up?
      let supportedStops = new Set();
      //  find which stops this line supports
      // let availableTransfers = new Set();
      let upcomingLinesServed = new Set();
      while (true) {
        let currStop = nearestStop(currentTo, 1);
        for (const lineID of currStop.linesServed) {
          upcomingLinesServed.add(lineID);
        }
        let foundQ = false;
        for (let j=0; j<connections.length; j++) {
          // going forward: find the conection that starts from the currStop
          if ((trains[i].revDir?samePt(connections[j].to, currStop)
              :samePt(connections[j].from, currStop)) && 
              connections[j].lineID == trains[i].lineID) {
            currStop = trains[i].revDir?connections[j].from:connections[j].to;
            foundQ = true;
            break;
          }
          // availableTransfers.add(connections[j].lineID);
        }
        if (!foundQ) break; // no stops, reached end of line. we give up!
        currentTo = currStop;
        supportedStops.add(currStop.type);
      }
      for (let i=0; i<currStop.waiting.length; i++) {
        if (currTrain.passengers.length >= 6) break;
        if (supportedStops.has(currStop.waiting[i])) {
          let adding = currStop.waiting[i];
          // setTimeout(()=>{
          currStop.waiting.splice(i, 1);
          currTrain.passengers.push(adding);
          i--;
          delay += 400;
        }
      }
      // take the direct passengers before taking any transferrers
      for (let i=0; i<currStop.waiting.length; i++) {
        if (currTrain.passengers.length >= 6) break;
        for (let j=0; j<typesOnLine.length; j++) {
          
          if (typesOnLine[i].has(currStop.waiting[i])) {
            let adding = currStop.waiting[i];
            currStop.waiting.splice(i, 1);
            currTrain.passengers.push(adding);
            i--;
          }
          delay += 400;
        }

      }
      // console.log(supportedStops, currentTo)
      // if (currTrain.revDir) {
      currTrain.from = currTrain.to;
      currTrain.to = nextStop;
      currTrain.startT = startT+delay;
      console.log(delay);
      // console.log(currTrain.from, currTrain.to);
      // }
      console.log("StopHandler took: ", Date.now()-startT);
    } // if percentcoered = 1
    currTrain.x = currTrain.from.x + (currTrain.to.x - currTrain.from.x)*percentCovered;
    currTrain.y = currTrain.from.y + (currTrain.to.y - currTrain.from.y)*percentCovered;
  }
  redraw();
  
  requestAnimationFrame(animLoop);
}

function dropOff(currTrain, pt) {
  let stop = nearestStop(pt, 1);
  let matching = 0;
  for (let i=0; i<currTrain.passengers.length; i++) 
    if (currTrain.passengers[i] == stop.type) {
      matching++;
      currTrain.passengers.splice(i, 1);
      i--;
    }
  return matching;
}

function stopPopulationLoop() {
  populateStops();
  redraw();
  setTimeout(stopPopulationLoop, 5000+Math.random()*7000);
}

function updateMinScl(newVal=minSclFac) {
  minSclFac = newVal;
  viewportW = canv.width/minSclFac*0.4;
  viewportH = canv.height/minSclFac*0.4;
  viewportMax = Math.max(viewportW, viewportH);
  viewportMin = Math.min(viewportW, viewportH);
}

function addNewStop(type=-1) {
  let newPt;
  if (type < 0) type = getNextType();
  if (stops.length>0)
    do {
      // newPt = genRandomPt();
      // this is stupid.
      refPt = stops[Math.floor(Math.random()*stops.length)];
      // if (refPt)
      ang = Math.random()*2*Math.PI;
      dist = 150+Math.random()*100
      newPt = {x:refPt.x+dist*Math.cos(ang), y:refPt.y+dist*Math.sin(ang)};
    } while (!(!nearestStop(newPt, 150) && withinViewport(newPt)));
  else newPt = genRandomPt();
  // console.log(nearestStop(newPt, 150))
  stops.push(newPt);
  maxUnlockedType = Math.max(maxUnlockedType, type);
  updateMinScl(minSclFac * 0.97);
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
  currPos_canv = fromCanvPos(ev.clientX, ev.clientY);
  if (holdState == K.HOLD) {// && ev.shiftKey) {
    translate(ev.movementX, ev.movementY);
    redraw();
  }
  else if (holdState == K.HOLD_NEWLINE) {
    let actualPos = fromCanvPos(ev.clientX, ev.clientY);
    let nStop = nearestStop(actualPos, acceptRadius);
    let lastStop = currPath[currPath.length-1];
    // if (!nStop) // 
    //   currPath.pop();
    // else console.log(nStop);
    if (nStop) {
      let canAdd = true;
      for (let i=0; i<currPath.length && canAdd; i++) {
        if (samePt(currPath[i], nStop)) canAdd =  false;
      }
      if (!canAdd && currPath.length > 2 
          && samePt(nStop, currPath[0]) && !samePt(nStop, lastStop)) {
        canAdd = true;
        holdState = K.NOHOLD;
      }
      if (canAdd) {
        currPath.push(nStop);
        console.log(nStop);
      }
    }
    redraw();
  }
}

function pointerUp(ev) {
  holdState = K.NOHOLD;
  document.body.style.cursor = holdState == K.HOLD?"grab":"";
  if (currPath.length > 1) {
    let currCol = getCSSProp("--system-"+colours[0]);
    colours.shift();
    // lines.push({path:currPath, 
                // colour:getCSSProp("--system-"+colours[lines.length])});
    for (let i=1; i<currPath.length; i++) {
      connections.push({from:currPath[i-1], to:currPath[i],
                        colour:currCol, lineID: lineCt});
    } 
    // run dijkstra?
    adj = [];
    for (let i=0; i<stops.length; i++) {
      let row = [];
      for (let j=0; j<maxUnlockedType.length; j++) {
        row.push(99);
      }
      adj.push(row);
    }
    let supportedTypes = new Set();
    for (let i=0; i<currPath.length; i++) {
      supportedTypes.add(currPath[i].type);
      currPath[i].linesServed.add(lineCt);
    }
    typesOnLine.push(supportedTypes);
    trains.push({x:currPath[0].x, y:currPath[0].y, 
                 from:currPath[0], to:currPath[1], path:currPath, 
                 lineID: lineCt, colour:currCol, startT: Date.now(), 
                  status:K.MOVING, passengers:[]});
    lineCt++;
  }
  currPath = [];
  redraw();
  if (!downPt || distBtw({x:ev.clientX, y:ev.clientY}, downPt) > 10) return;
  // check for is it actually a click ^
  ctx.beginPath();
  let actualPos = fromCanvPos(ev.clientX, ev.clientY);
  ctx.moveTo(actualPos.x-0.5, actualPos.y-0.5);
  ctx.lineTo(actualPos.x+0.5, actualPos.y+0.5);
  ctx.stroke();
  ctx.fillText(actualPos.x.toFixed(2)+", "+actualPos.y.toFixed(2), actualPos.x, actualPos.y);
}

function samePt(pt1, pt2) {
  return Math.abs(pt1.x-pt2.x) < 0.1 && Math.abs(pt1.y-pt2.y) < 0.1;  
}

function genRandomPt() {
  return {x:Math.random()*viewportW - viewportW/2, 
    y:Math.random()*viewportH - viewportH/2}
}

function nearestStop(newPt, minDist) {
  let found = null;
  for (let i=0; i<stops.length; i++) {
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
  // console.log(viewportScl);
  // should be <1 and decreasing
  if (newPt.x < -viewportW/2) return false;
  if (newPt.x > viewportW/2) return false;
  if (newPt.y < -viewportH/2) return false;
  if (newPt.y > viewportH/2) return false;
  return true;
}
function distBtw(pt1, pt2) {
  function sq(x) {return x*x;}
  return Math.sqrt(sq(pt1.x-pt2.x)+sq(pt1.y-pt2.y));
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
  return {x:(canvX-transfm[2])/transfm[0], y:(canvY-transfm[5])/transfm[4]};
}
function scale(scl) {
  // matrix mult with [
  // sclX 0
  // 0  sclY
  // 0  0
  for (let i=0; i<6; i++) transfm[i]*=scl;
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

function getNextType(exclude=-1) {
  let type = Math.floor(Math.random()*(exclude<0?types.length:maxUnlockedType));
  if (type >= exclude && exclude>=0) return type+1;
  return type;
  // if ()
}