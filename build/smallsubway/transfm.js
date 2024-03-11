"use strict";
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
function updateMinScl(newVal = minSclFac) {
  minSclFac = newVal;
  viewportW = canv.width / minSclFac * 0.4;
  viewportH = canv.height / minSclFac * 0.4;
  viewportMax = Math.max(viewportW, viewportH);
  viewportMin = Math.min(viewportW, viewportH);
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
//# sourceMappingURL=transfm.js.map
