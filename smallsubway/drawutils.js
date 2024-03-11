function handleOffset(connection) {
  let angBtw = Math.atan2(connection.to.y - connection.from.y,
    connection.to.x - connection.from.x);
  // angBtw += K.PI;
  let info = parallelConnections(connection);
  let offsetR = (K.LINEWIDTH/2)*(2*info.idx+1-info.ct) //+ stopSz;
  let newAng = info.flipped?(angBtw+Math.PI):angBtw;
  return {x:offsetR*Math.cos(newAng+Math.PI/2), y: offsetR*Math.sin(newAng+Math.PI/2)}
}


function parallelConnections(cmp) {
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

function registerMaximisingCanvas(id, widthPc, heightPc, redrawFcn) { // (id:string, widthPc:number, heightPc:number, redrawFcn:()=>any) {
  //let canv = byId(id)// as HTMLCanvasElement;
  window.addEventListener("resize", (ev) => {
    canv.width = window.innerWidth * widthPc;
    canv.height = window.innerHeight * heightPc;
    // everything is gone - restore it!
    applyTransfm();
    redrawFcn();
  })
  // canv.style.height = 100 * heightPc + "vh";
  // canv.style.width = 100 * widthPc + "vw";
  canv.width = window.innerWidth * widthPc;
  canv.height = window.innerHeight * heightPc;
  redrawFcn();
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