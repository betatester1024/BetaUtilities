"use strict";
let imagesReady = /* @__PURE__ */ new Set();
function drawSVG(imageID, hgt, width, x, y) {
  if (imagesReady.has(imageID))
    ctx.drawImage(byId(imageID + "svg_betaosreserved"), x, y, width, hgt);
}
function prepSVG(imageID, clr) {
  let img = document.createElement("img");
  img.id = imageID + "svg_betaosreserved";
  img.style.display = "none";
  document.body.appendChild(img);
  let svg = byId(imageID);
  svg.querySelector("path").setAttribute("fill", clr);
  var xml = new XMLSerializer().serializeToString(svg);
  var svg64 = btoa(xml);
  var b64Start = "data:image/svg+xml;base64,";
  var image64 = b64Start + svg64;
  img.onload = function() {
    imagesReady.add(imageID);
  };
  img.src = image64;
}
function handleOffset(connection) {
  let angBtw = Math.atan2(
    connection.to.y - connection.from.y,
    connection.to.x - connection.from.x
  );
  let info = parallelConnections(connection);
  let offsetR = K.LINEWIDTH / 2 * (2 * info.idx + 1 - info.ct);
  let newAng = info.flipped ? angBtw + Math.PI : angBtw;
  return { x: offsetR * Math.cos(newAng + Math.PI / 2), y: offsetR * Math.sin(newAng + Math.PI / 2) };
}
function parallelConnections(cmp) {
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
function registerMaximisingCanvas(id, widthPc, heightPc, redrawFcn) {
  window.addEventListener("resize", (ev) => {
    canv.width = window.innerWidth * widthPc;
    canv.height = window.innerHeight * heightPc;
    applyTransfm();
    redrawFcn();
  });
  canv.width = window.innerWidth * widthPc;
  canv.height = window.innerHeight * heightPc;
  redrawFcn();
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
function nearestTrain(x, y, rad) {
  let minRad = K.INF;
  let tr = null;
  for (let train of trains) {
    let dist = distBtw({ x, y }, train);
    if (dist < minRad) {
      minRad = dist;
      tr = train;
    }
  }
  if (minRad > rad)
    return null;
  else
    return tr;
}
//# sourceMappingURL=drawutils.js.map
