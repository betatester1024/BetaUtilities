let types = [triangle, square, circ, star];

function square(scl, x, y, stroke=false) {
  scl *= 0.9;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x-3*scl, y-3*scl);
  ctx.lineTo(x+3*scl, y-3*scl);
  ctx.lineTo(x+3*scl, y+3*scl);
  ctx.lineTo(x-3*scl, y+3*scl);
  ctx.lineTo(x-3*scl, y-3*scl);
  ctx.fill();
  if (stroke) ctx.stroke();
  ctx.beginPath();
  ctx.restore();
}

function triangle(scl, x, y, stroke=false) {
  scl *= 1.1;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x-3*scl, y+2*scl);
  // ctx.lineTo(x+3*scl, y-3*scl);
  ctx.lineTo(x, y-4*scl);
  ctx.lineTo(x+3*scl, y+2*scl);
  ctx.lineTo(x-3*scl, y+2*scl);
  ctx.fill();
  if (stroke) ctx.stroke();
  ctx.beginPath();
  ctx.restore();
}

function circ(scl, x, y, stroke=false) {
  ctx.beginPath();
  ctx.arc(x, y, 3*scl, 0, K.PI*2);
  ctx.fill();
  if (stroke) ctx.stroke();
  ctx.beginPath();
}

function diamond(scl, x, y) {
  ctx.beginPath();
  ctx.moveTo()
}

function star(scl,x,y, stroke=false) {
  scl *= 1.2;
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
  if (stroke) ctx.stroke();
  ctx.beginPath();
  ctx.restore();
}