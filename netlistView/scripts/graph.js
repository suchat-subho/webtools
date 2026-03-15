/* ═══════════════════════════════════════════════════════════════
   graph.js  —  DOT graph renderer
   Parses Viz.js SVG output into a node/edge model and draws it
   on a canvas with draggable nodes and bendable edges.

   Public functions (called from DOTviewer.html):
     renderCircuit()  — read #netlistBox, parse DOT, draw
     exportPNG()      — download canvas as PNG
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Viz.js (loaded before this script) ── */
var viz = null;
Viz.instance().then(function(v) { viz = v; });

/* ── DOM refs ── */
var canvas    = document.getElementById('circuitCanvas');
var ctx       = canvas.getContext('2d');
var errEl     = document.getElementById('error-msg');
var rightPane = document.getElementById('right-pane');

/* ── Graph model ── */
var nodes = [];  // { id, label, x, y, w, h, shape, dashed }
var edges = [];  // { from, to, label, dashed, bend }

/* ── Viewport transform ── */
var vpScale   = 1;
var vpOffsetX = 0;
var vpOffsetY = 0;

/* ── Interaction state ── */
var MODE = { NONE: 0, PAN: 1, DRAG_NODE: 2, DRAG_EDGE: 3 };
var mode        = MODE.NONE;
var activeNode  = null;
var activeEdge  = null;
var dragDX = 0, dragDY = 0;
var panStartX = 0, panStartY = 0, panOX = 0, panOY = 0;
var hoveredNode = null;
var hoveredEdge = null;

var EDGE_HIT_RADIUS = 8;

/* ════════════════════════════════
   CANVAS SIZING
   ════════════════════════════════ */
function resizeCanvas() {
  canvas.width  = rightPane.clientWidth  - 2;
  canvas.height = rightPane.clientHeight - 2;
  draw();
}

window.addEventListener('resize', resizeCanvas);
new ResizeObserver(resizeCanvas).observe(rightPane);

/* ════════════════════════════════
   PARSE Viz.js SVG → MODEL
   ════════════════════════════════ */
function parseSVG(svgEl) {
  nodes = [];
  edges = [];

  /* Nodes */
  svgEl.querySelectorAll('g.node').forEach(function(g) {
    var titleEl = g.querySelector('title');
    if (!titleEl) return;
    var id = titleEl.textContent.trim();

    var ellipse = g.querySelector('ellipse');
    var poly    = g.querySelector('polygon');
    var rectEl  = g.querySelector('rect');
    var label   = Array.from(g.querySelectorAll('text'))
                       .map(function(t) { return t.textContent.trim(); })
                       .filter(Boolean).join('\n') || id;

    var x = 0, y = 0, w = 80, h = 40, shape = 'ellipse', dashed = false;

    if (ellipse) {
      x = parseFloat(ellipse.getAttribute('cx'));
      y = parseFloat(ellipse.getAttribute('cy'));
      w = parseFloat(ellipse.getAttribute('rx')) * 2;
      h = parseFloat(ellipse.getAttribute('ry')) * 2;
      shape  = 'ellipse';
      dashed = (ellipse.getAttribute('stroke-dasharray') || '').length > 0;
    } else if (poly) {
      var pts = poly.getAttribute('points').trim().split(/\s+/)
                    .map(function(p) { return p.split(',').map(Number); });
      var xs = pts.map(function(p) { return p[0]; });
      var ys = pts.map(function(p) { return p[1]; });
      var mnX = Math.min.apply(null, xs), mxX = Math.max.apply(null, xs);
      var mnY = Math.min.apply(null, ys), mxY = Math.max.apply(null, ys);
      x = (mnX + mxX) / 2;  y = (mnY + mxY) / 2;
      w = mxX - mnX;         h = mxY - mnY;
      shape  = 'rect';
      dashed = (poly.getAttribute('stroke-dasharray') || '').length > 0;
    } else if (rectEl) {
      x = parseFloat(rectEl.getAttribute('x') || 0) + parseFloat(rectEl.getAttribute('width')  || 80) / 2;
      y = parseFloat(rectEl.getAttribute('y') || 0) + parseFloat(rectEl.getAttribute('height') || 40) / 2;
      w = parseFloat(rectEl.getAttribute('width')  || 80);
      h = parseFloat(rectEl.getAttribute('height') || 40);
      shape  = 'rect';
      dashed = (rectEl.getAttribute('stroke-dasharray') || '').length > 0;
    }

    nodes.push({ id: id, label: label, x: x, y: y, w: w, h: h, shape: shape, dashed: dashed });
  });

  /* Edges */
  svgEl.querySelectorAll('g.edge').forEach(function(g) {
    var titleEl = g.querySelector('title');
    if (!titleEl) return;
    var parts = titleEl.textContent.trim().split(/->|--/).map(function(s) {
      // Strip port suffix e.g. "R1:p0" → "R1"
      return s.trim().replace(/:.*$/, '');
    });
    if (parts.length < 2) return;

    var label    = Array.from(g.querySelectorAll('text'))
                        .map(function(t) { return t.textContent.trim(); }).join(' ').trim();
    var pathEl   = g.querySelector('path');
    var dashed   = pathEl ? (pathEl.getAttribute('stroke-dasharray') || '').length > 0 : false;
    var directed = !!g.querySelector('polygon');  // arrow polygon present = directed edge

    edges.push({ from: parts[0], to: parts[1], label: label, dashed: dashed, bend: null, directed: directed });
  });

  fitViewport();
}

/* ════════════════════════════════
   FIT VIEWPORT
   ════════════════════════════════ */
function fitViewport() {
  if (!nodes.length) return;
  var pad  = 50;
  var minX = Math.min.apply(null, nodes.map(function(n) { return n.x - n.w/2; }));
  var maxX = Math.max.apply(null, nodes.map(function(n) { return n.x + n.w/2; }));
  var minY = Math.min.apply(null, nodes.map(function(n) { return n.y - n.h/2; }));
  var maxY = Math.max.apply(null, nodes.map(function(n) { return n.y + n.h/2; }));
  var gw = maxX - minX, gh = maxY - minY;

  vpScale   = Math.min((canvas.width  - pad*2) / gw,
                       (canvas.height - pad*2) / gh, 1.5);
  vpOffsetX = (canvas.width  - gw * vpScale) / 2 - minX * vpScale;
  vpOffsetY = (canvas.height - gh * vpScale) / 2 - minY * vpScale;
  draw();
}

/* ════════════════════════════════
   COORDINATE HELPERS
   ════════════════════════════════ */
function toCanvas(gx, gy) { return { x: gx*vpScale + vpOffsetX, y: gy*vpScale + vpOffsetY }; }
function toGraph(cx, cy)  { return { x: (cx - vpOffsetX)/vpScale, y: (cy - vpOffsetY)/vpScale }; }

/* ════════════════════════════════
   HIT TESTS
   ════════════════════════════════ */
function nodeAt(cx, cy) {
  var g = toGraph(cx, cy);
  for (var i = nodes.length - 1; i >= 0; i--) {
    var n = nodes[i], hw = n.w/2, hh = n.h/2;
    if (n.shape === 'ellipse') {
      var dx = (g.x - n.x)/hw, dy = (g.y - n.y)/hh;
      if (dx*dx + dy*dy <= 1) return n;
    } else {
      if (g.x >= n.x-hw && g.x <= n.x+hw && g.y >= n.y-hh && g.y <= n.y+hh) return n;
    }
  }
  return null;
}

function edgeAt(cx, cy) {
  for (var i = edges.length - 1; i >= 0; i--) {
    var e = edges[i];
    var pts = edgePoints(e);
    if (!pts) continue;

    var mid = edgeMidpoint(e);
    var mc  = toCanvas(mid.x, mid.y);
    if (dist(cx, cy, mc.x, mc.y) <= EDGE_HIT_RADIUS * 2) return e;

    if (e.bend) {
      var bc = toCanvas(e.bend.x, e.bend.y);
      if (dist(cx, cy, bc.x, bc.y) <= EDGE_HIT_RADIUS * 1.5)       return e;
      if (nearSegment(cx, cy, pts.start, bc,       EDGE_HIT_RADIUS)) return e;
      if (nearSegment(cx, cy, bc,       pts.end,   EDGE_HIT_RADIUS)) return e;
    } else {
      if (nearSegment(cx, cy, pts.start, pts.end, EDGE_HIT_RADIUS))  return e;
    }
  }
  return null;
}

function dist(ax, ay, bx, by) {
  return Math.sqrt((ax-bx)*(ax-bx) + (ay-by)*(ay-by));
}

function nearSegment(px, py, a, b, r) {
  var dx = b.x-a.x, dy = b.y-a.y, len2 = dx*dx+dy*dy;
  if (len2 === 0) return dist(px,py,a.x,a.y) <= r;
  var t = Math.max(0, Math.min(1, ((px-a.x)*dx + (py-a.y)*dy) / len2));
  return dist(px, py, a.x+t*dx, a.y+t*dy) <= r;
}

/* ════════════════════════════════
   EDGE GEOMETRY
   ════════════════════════════════ */
function edgePoints(e) {
  var src = nodes.find(function(n) { return n.id === e.from; });
  var dst = nodes.find(function(n) { return n.id === e.to;   });
  if (!src || !dst) return null;

  var sp  = toCanvas(src.x, src.y);
  var dp  = toCanvas(dst.x, dst.y);
  var via = e.bend ? toCanvas(e.bend.x, e.bend.y) : null;

  if (e.from === e.to) return { start: sp, end: dp, via: null, self: true };

  var start = borderPoint(src, (via||dp).x - sp.x, (via||dp).y - sp.y);
  var end   = borderPoint(dst, (via||sp).x - dp.x, (via||sp).y - dp.y);
  return { start: start, end: end, via: via };
}

function edgeMidpoint(e) {
  if (e.bend) return e.bend;
  var src = nodes.find(function(n) { return n.id === e.from; });
  var dst = nodes.find(function(n) { return n.id === e.to;   });
  if (!src || !dst) return { x: 0, y: 0 };
  return { x: (src.x+dst.x)/2, y: (src.y+dst.y)/2 };
}

function borderPoint(node, dx, dy) {
  var c  = toCanvas(node.x, node.y);
  var hw = (node.w/2) * vpScale;
  var hh = (node.h/2) * vpScale;
  var len = Math.sqrt(dx*dx + dy*dy) || 1;
  var ux = dx/len, uy = dy/len;

  if (node.shape === 'ellipse') {
    var t = 1 / Math.sqrt((ux*ux)/(hw*hw) + (uy*uy)/(hh*hh));
    return { x: c.x + ux*t, y: c.y + uy*t };
  } else {
    var tx = ux !== 0 ? Math.abs(hw/ux) : Infinity;
    var ty = uy !== 0 ? Math.abs(hh/uy) : Infinity;
    var tm = Math.min(tx, ty);
    return { x: c.x + ux*tm, y: c.y + uy*tm };
  }
}

/* ════════════════════════════════
   DRAW
   ════════════════════════════════ */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!nodes.length) return;
  edges.forEach(drawEdge);
  nodes.forEach(drawNode);
}

function drawEdge(e) {
  var pts = edgePoints(e);
  if (!pts) return;

  var isHov = hoveredEdge === e;
  var isAct = activeEdge  === e;

  ctx.save();
  ctx.strokeStyle = isAct ? '#1a73e8' : isHov ? '#4285f4' : '#555';
  ctx.lineWidth   = (isAct || isHov) ? 2.5 : 1.5;
  ctx.setLineDash(e.dashed ? [6,4] : []);

  ctx.beginPath();
  if (pts.self) {
    /* Self-loop */
    var sn  = nodes.find(function(n) { return n.id === e.from; });
    var sp  = toCanvas(sn.x, sn.y);
    var shw = (sn.w/2)*vpScale, shh = (sn.h/2)*vpScale;
    ctx.moveTo(sp.x + shw*0.5, sp.y - shh);
    ctx.bezierCurveTo(sp.x+shw*2, sp.y-shh*2, sp.x+shw*2, sp.y+shh*0.5, sp.x+shw, sp.y);
  } else if (pts.via) {
    ctx.moveTo(pts.start.x, pts.start.y);
    ctx.quadraticCurveTo(pts.via.x, pts.via.y, pts.end.x, pts.end.y);
  } else {
    ctx.moveTo(pts.start.x, pts.start.y);
    ctx.lineTo(pts.end.x,   pts.end.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  /* Arrowhead — only for directed edges */
  if (!pts.self && e.directed) {
    var fromX = pts.via ? pts.via.x : pts.start.x;
    var fromY = pts.via ? pts.via.y : pts.start.y;
    drawArrow(pts.end.x, pts.end.y, fromX, fromY, isAct||isHov ? '#1a73e8' : '#555');
  }

  /* Edge label */
  if (e.label) {
    var mx = pts.via ? (pts.start.x*0.25 + pts.via.x*0.5 + pts.end.x*0.25)
                     : (pts.start.x + pts.end.x) / 2;
    var my = pts.via ? (pts.start.y*0.25 + pts.via.y*0.5 + pts.end.y*0.25)
                     : (pts.start.y + pts.end.y) / 2;
    var fs = Math.max(10, 12*vpScale);
    ctx.font = fs + 'px Arial';
    var tw = ctx.measureText(e.label).width;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(mx - tw/2 - 3, my - fs/2 - 2, tw+6, fs+4);
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.label, mx, my);
  }

  /* Bend handle — shown on hover/active */
  if ((isHov || isAct) && !pts.self) {
    var mid = edgeMidpoint(e);
    var mc  = toCanvas(mid.x, mid.y);
    ctx.beginPath();
    ctx.arc(mc.x, mc.y, 6, 0, Math.PI*2);
    ctx.fillStyle = isAct ? '#1a73e8' : '#4285f4';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function drawArrow(tx, ty, fx, fy, color) {
  var angle = Math.atan2(ty-fy, tx-fx);
  var size  = Math.max(7, 9*vpScale);
  ctx.fillStyle = color || '#555';
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - size*Math.cos(angle-0.38), ty - size*Math.sin(angle-0.38));
  ctx.lineTo(tx - size*Math.cos(angle+0.38), ty - size*Math.sin(angle+0.38));
  ctx.closePath();
  ctx.fill();
}

function drawNode(n) {
  var c   = toCanvas(n.x, n.y);
  var hw  = (n.w/2)*vpScale, hh = (n.h/2)*vpScale;
  var isDrag = activeNode && activeNode.id === n.id;
  var isHov  = hoveredNode && hoveredNode.id === n.id;

  ctx.save();
  ctx.strokeStyle = isDrag ? '#1a73e8' : '#333';
  ctx.lineWidth   = isDrag ? 2.5 : 1.5;
  ctx.fillStyle   = isDrag ? '#d2e3fc' : isHov ? '#e8f0fe' : '#fff';
  ctx.setLineDash(n.dashed ? [5,3] : []);

  if (n.shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, hw, hh, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  } else {
    var r = Math.min(5, hw*0.12);
    ctx.beginPath();
    ctx.roundRect(c.x-hw, c.y-hh, hw*2, hh*2, r);
    ctx.fill(); ctx.stroke();
  }

  ctx.setLineDash([]);
  var fs = Math.max(10, Math.min(14, 13*vpScale));
  ctx.font = fs + 'px Arial';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var lblLines = n.label.split('\n');
  var lh = fs * 1.3;
  var sy = c.y - ((lblLines.length-1)/2) * lh;
  lblLines.forEach(function(line, idx) {
    ctx.fillText(line, c.x, sy + idx*lh, hw*1.9);
  });

  ctx.restore();
}

/* ════════════════════════════════
   MOUSE EVENTS
   ════════════════════════════════ */
canvas.addEventListener('mousedown', function(e) {
  var p = cxy(e);
  var hn = nodeAt(p.x, p.y);

  if (hn) {
    mode = MODE.DRAG_NODE; activeNode = hn;
    var g = toGraph(p.x, p.y);
    dragDX = hn.x - g.x; dragDY = hn.y - g.y;
    canvas.style.cursor = 'grabbing';
    return;
  }

  var he = edgeAt(p.x, p.y);
  if (he) {
    mode = MODE.DRAG_EDGE; activeEdge = he;
    canvas.style.cursor = 'grabbing';
    return;
  }

  mode = MODE.PAN;
  panStartX = e.clientX; panStartY = e.clientY;
  panOX = vpOffsetX;     panOY = vpOffsetY;
  canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', function(e) {
  var p = cxy(e);

  if (mode === MODE.DRAG_NODE && activeNode) {
    var g = toGraph(p.x, p.y);
    activeNode.x = g.x + dragDX;
    activeNode.y = g.y + dragDY;
    draw(); return;
  }

  if (mode === MODE.DRAG_EDGE && activeEdge) {
    var g2 = toGraph(p.x, p.y);
    activeEdge.bend = { x: g2.x, y: g2.y };
    draw(); return;
  }

  if (mode === MODE.PAN) {
    vpOffsetX = panOX + (e.clientX - panStartX);
    vpOffsetY = panOY + (e.clientY - panStartY);
    draw(); return;
  }

  /* Hover highlight */
  var hn2 = nodeAt(p.x, p.y);
  var he2 = hn2 ? null : edgeAt(p.x, p.y);
  if (hn2 !== hoveredNode || he2 !== hoveredEdge) {
    hoveredNode = hn2; hoveredEdge = he2;
    canvas.style.cursor = hn2 ? 'grab' : he2 ? 'pointer' : 'default';
    draw();
  }
});

window.addEventListener('mouseup', function() {
  mode = MODE.NONE; activeNode = null; activeEdge = null;
  canvas.style.cursor = hoveredNode ? 'grab' : hoveredEdge ? 'pointer' : 'default';
});

canvas.addEventListener('dblclick', function(e) {
  var p = cxy(e);
  var he = edgeAt(p.x, p.y);
  if (he) { he.bend = null; draw(); }
});

canvas.addEventListener('wheel', function(e) {
  e.preventDefault();
  var f = e.deltaY < 0 ? 1.1 : 0.9;
  var p = cxy(e);
  vpOffsetX = p.x - (p.x - vpOffsetX)*f;
  vpOffsetY = p.y - (p.y - vpOffsetY)*f;
  vpScale   = Math.min(Math.max(vpScale*f, 0.05), 8);
  draw();
}, { passive: false });

function cxy(e) {
  var r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/* ════════════════════════════════
   PUBLIC API
   ════════════════════════════════ */

/**
 * Read DOT source from #netlistBox, parse and render.
 * Called by DOTviewer.html.
 */
function renderCircuit() {
  var dot = document.getElementById('netlistBox').value.trim();
  clearError();
  if (!dot)  { showError('DOT source is empty.');          return; }
  if (!viz)  { showError('Viz.js not ready — try again.'); return; }
  try {
    parseSVG(viz.renderSVGElement(dot));
  } catch (err) {
    showError(err.message || 'Failed to parse DOT source.');
  }
}

/**
 * Export current canvas as a PNG download.
 * Called by DOTviewer.html.
 */
function exportPNG() {
  if (!nodes.length) { showError('Nothing to export.'); return; }
  var link = document.createElement('a');
  link.download = 'graph.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ── Internal error helpers (write to #error-msg) ── */
function showError(msg) {
  errEl.textContent    = msg;
  errEl.style.display  = 'block';
}
function clearError() {
  errEl.style.display = 'none';
}

/* Initial canvas size */
resizeCanvas();