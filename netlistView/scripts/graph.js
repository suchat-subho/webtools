/* ═══════════════════════════════════════════════════════
   DOT Graph Viewer — draggable nodes + bendable edges
   ═══════════════════════════════════════════════════════ */

/* ── Viz.js init ── */
let viz = null;
Viz.instance().then(v => { viz = v; });

/* ── Canvas ── */
const canvas    = document.getElementById('circuitCanvas');
const ctx       = canvas.getContext('2d');
const errEl     = document.getElementById('error-msg');
const rightPane = document.getElementById('right-pane');

/* ── Graph model ── */
// node: { id, label, x, y, w, h, shape, dashed }
// edge: { from, to, label, dashed, bend: {x,y}|null }
let nodes = [];
let edges = [];

/* ── Viewport ── */
let vpScale   = 1;
let vpOffsetX = 0;
let vpOffsetY = 0;

/* ── Interaction ── */
const MODE = { NONE: 0, PAN: 1, DRAG_NODE: 2, DRAG_EDGE: 3 };
let mode        = MODE.NONE;
let activeNode  = null;
let activeEdge  = null;
let dragDX = 0, dragDY = 0;
let panStartX = 0, panStartY = 0, panOX = 0, panOY = 0;
let hoveredNode = null;
let hoveredEdge = null;

/* ══════════════════════════════
   CANVAS SIZING
   ══════════════════════════════ */
function resizeCanvas() {
  canvas.width  = rightPane.clientWidth  - 2;
  canvas.height = rightPane.clientHeight - 2;
  draw();
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load',   resizeCanvas);
new ResizeObserver(resizeCanvas).observe(rightPane);

/* ══════════════════════════════
   PARSE Viz.js SVG → model
   ══════════════════════════════ */
function parseSVG(svgEl) {
  nodes = [];
  edges = [];

  /* ── Nodes ── */
  svgEl.querySelectorAll('g.node').forEach(g => {
    const title = g.querySelector('title');
    if (!title) return;
    const id = title.textContent.trim();

    const ellipse = g.querySelector('ellipse');
    const poly    = g.querySelector('polygon');
    const rectEl  = g.querySelector('rect');
    const texts   = [...g.querySelectorAll('text')];
    const label   = texts.map(t => t.textContent.trim()).filter(Boolean).join('\n') || id;

    let x = 0, y = 0, w = 80, h = 40, shape = 'ellipse';

    if (ellipse) {
      x = parseFloat(ellipse.getAttribute('cx'));
      y = parseFloat(ellipse.getAttribute('cy'));
      w = parseFloat(ellipse.getAttribute('rx')) * 2;
      h = parseFloat(ellipse.getAttribute('ry')) * 2;
      shape = 'ellipse';
    } else if (poly) {
      const pts = poly.getAttribute('points').trim().split(/\s+/)
        .map(p => p.split(',').map(Number));
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const mnX = Math.min(...xs), mxX = Math.max(...xs);
      const mnY = Math.min(...ys), mxY = Math.max(...ys);
      x = (mnX + mxX) / 2; y = (mnY + mxY) / 2;
      w = mxX - mnX;       h = mxY - mnY;
      shape = 'rect';
    } else if (rectEl) {
      x = parseFloat(rectEl.getAttribute('x') || 0) + parseFloat(rectEl.getAttribute('width')  || 80) / 2;
      y = parseFloat(rectEl.getAttribute('y') || 0) + parseFloat(rectEl.getAttribute('height') || 40) / 2;
      w = parseFloat(rectEl.getAttribute('width')  || 80);
      h = parseFloat(rectEl.getAttribute('height') || 40);
      shape = 'rect';
    }

    const shapeEl = ellipse || poly || rectEl;
    const dashed  = shapeEl ? (shapeEl.getAttribute('stroke-dasharray') || '').length > 0 : false;

    nodes.push({ id, label, x, y, w, h, shape, dashed });
  });

  /* ── Edges ── */
  svgEl.querySelectorAll('g.edge').forEach(g => {
    const title = g.querySelector('title');
    if (!title) return;
    const raw   = title.textContent.trim();
    // support -> and -- 
    const parts = raw.split(/->|--/).map(s => s.trim());
    if (parts.length < 2) return;
    const from = parts[0], to = parts[1];

    const texts  = [...g.querySelectorAll('text')];
    const label  = texts.map(t => t.textContent.trim()).join(' ').trim();

    const pathEl = g.querySelector('path');
    const dashed = pathEl ? (pathEl.getAttribute('stroke-dasharray') || '').length > 0 : false;

    edges.push({ from, to, label, dashed, bend: null });
  });

  fitViewport();
}

/* ══════════════════════════════
   FIT VIEWPORT
   ══════════════════════════════ */
function fitViewport() {
  if (!nodes.length) return;
  const pad  = 50;
  const minX = Math.min(...nodes.map(n => n.x - n.w / 2));
  const maxX = Math.max(...nodes.map(n => n.x + n.w / 2));
  const minY = Math.min(...nodes.map(n => n.y - n.h / 2));
  const maxY = Math.max(...nodes.map(n => n.y + n.h / 2));
  const gw   = maxX - minX, gh = maxY - minY;

  vpScale   = Math.min((canvas.width - pad*2) / gw, (canvas.height - pad*2) / gh, 1.5);
  vpOffsetX = (canvas.width  - gw * vpScale) / 2 - minX * vpScale;
  vpOffsetY = (canvas.height - gh * vpScale) / 2 - minY * vpScale;
  draw();
}

/* ══════════════════════════════
   COORDINATE HELPERS
   ══════════════════════════════ */
function toCanvas(gx, gy) { return { x: gx*vpScale+vpOffsetX, y: gy*vpScale+vpOffsetY }; }
function toGraph(cx, cy)  { return { x: (cx-vpOffsetX)/vpScale, y: (cy-vpOffsetY)/vpScale }; }

/* ══════════════════════════════
   HIT TESTS
   ══════════════════════════════ */
function nodeAt(cx, cy) {
  const g = toGraph(cx, cy);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const hw = n.w/2, hh = n.h/2;
    if (n.shape === 'ellipse') {
      const dx = (g.x-n.x)/hw, dy = (g.y-n.y)/hh;
      if (dx*dx + dy*dy <= 1) return n;
    } else {
      if (g.x >= n.x-hw && g.x <= n.x+hw && g.y >= n.y-hh && g.y <= n.y+hh) return n;
    }
  }
  return null;
}

const EDGE_HIT_RADIUS = 8; // canvas px

function edgeAt(cx, cy) {
  for (let i = edges.length - 1; i >= 0; i--) {
    const e = edges[i];
    const pts = edgePoints(e);
    if (!pts) continue;

    // Check midpoint / bend handle
    const mid = edgeMidpoint(e, pts);
    const mc  = toCanvas(mid.x, mid.y);
    if (dist(cx, cy, mc.x, mc.y) <= EDGE_HIT_RADIUS * 2) return e;

    // Check along the line segments
    if (e.bend) {
      const bc = toCanvas(e.bend.x, e.bend.y);
      if (dist(cx, cy, bc.x, bc.y) <= EDGE_HIT_RADIUS * 1.5) return e;
      if (pointNearSegment(cx, cy, pts.start, bc, EDGE_HIT_RADIUS)) return e;
      if (pointNearSegment(cx, cy, bc, pts.end,   EDGE_HIT_RADIUS)) return e;
    } else {
      if (pointNearSegment(cx, cy, pts.start, pts.end, EDGE_HIT_RADIUS)) return e;
    }
  }
  return null;
}

function dist(ax, ay, bx, by) {
  return Math.sqrt((ax-bx)**2 + (ay-by)**2);
}

function pointNearSegment(px, py, a, b, radius) {
  // a, b are already in canvas coords
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx*dx + dy*dy;
  if (len2 === 0) return dist(px, py, a.x, a.y) <= radius;
  let t = ((px-a.x)*dx + (py-a.y)*dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, a.x + t*dx, a.y + t*dy) <= radius;
}

/* ══════════════════════════════
   EDGE GEOMETRY
   ══════════════════════════════ */
function edgePoints(e) {
  const src = nodes.find(n => n.id === e.from);
  const dst = nodes.find(n => n.id === e.to);
  if (!src || !dst) return null;

  const sp = toCanvas(src.x, src.y);
  const dp = toCanvas(dst.x, dst.y);

  if (e.from === e.to) {
    return { start: sp, end: dp, self: true };
  }

  const via = e.bend ? toCanvas(e.bend.x, e.bend.y) : null;
  const start = borderPoint(src, (via || dp).x - sp.x, (via || dp).y - sp.y);
  const end   = borderPoint(dst, (via || sp).x - dp.x, (via || sp).y - dp.y);

  return { start, end, via };
}

function edgeMidpoint(e, pts) {
  if (e.bend) return e.bend;
  if (!pts) return null;
  const src = nodes.find(n => n.id === e.from);
  const dst = nodes.find(n => n.id === e.to);
  if (!src || !dst) return null;
  return { x: (src.x + dst.x) / 2, y: (src.y + dst.y) / 2 };
}

function borderPoint(node, dx, dy) {
  const c  = toCanvas(node.x, node.y);
  const hw = (node.w/2) * vpScale;
  const hh = (node.h/2) * vpScale;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  const ux = dx/len, uy = dy/len;

  if (node.shape === 'ellipse') {
    const t = 1 / Math.sqrt((ux*ux)/(hw*hw) + (uy*uy)/(hh*hh));
    return { x: c.x + ux*t, y: c.y + uy*t };
  } else {
    let t = Infinity;
    if (ux !== 0) t = Math.min(t, Math.abs(hw/ux));
    if (uy !== 0) t = Math.min(t, Math.abs(hh/uy));
    return { x: c.x + ux*t, y: c.y + uy*t };
  }
}

/* ══════════════════════════════
   DRAW
   ══════════════════════════════ */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!nodes.length) return;

  edges.forEach(e => drawEdge(e));
  nodes.forEach(n => drawNode(n));
}

/* ── Draw edge ── */
function drawEdge(e) {
  const pts = edgePoints(e);
  if (!pts) return;

  const isHovered = hoveredEdge && hoveredEdge === e;
  const isActive  = activeEdge  && activeEdge  === e;

  ctx.save();
  ctx.strokeStyle = isActive ? '#1a73e8' : isHovered ? '#4285f4' : '#555555';
  ctx.lineWidth   = isActive || isHovered ? 2.5 : 1.5;
  ctx.setLineDash(e.dashed ? [6, 4] : []);

  if (e.from === e.to) {
    // Self-loop
    const src = nodes.find(n => n.id === e.from);
    const sp  = toCanvas(src.x, src.y);
    const hw  = (src.w/2) * vpScale, hh = (src.h/2) * vpScale;
    ctx.beginPath();
    ctx.moveTo(sp.x + hw * 0.5, sp.y - hh);
    ctx.bezierCurveTo(
      sp.x + hw * 2,  sp.y - hh * 2,
      sp.x + hw * 2,  sp.y + hh * 0.5,
      sp.x + hw, sp.y
    );
    ctx.stroke();
  } else if (pts.via) {
    ctx.beginPath();
    ctx.moveTo(pts.start.x, pts.start.y);
    ctx.quadraticCurveTo(pts.via.x, pts.via.y, pts.end.x, pts.end.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(pts.start.x, pts.start.y);
    ctx.lineTo(pts.end.x, pts.end.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  // Arrowhead
  if (e.from !== e.to) {
    const arr = pts.via
      ? { fx: pts.via.x, fy: pts.via.y }
      : { fx: pts.start.x, fy: pts.start.y };
    drawArrow(pts.end.x, pts.end.y, arr.fx, arr.fy, isActive || isHovered ? '#1a73e8' : '#555555');
  }

  // Edge label
  if (e.label) {
    const src = nodes.find(n => n.id === e.from);
    const dst = nodes.find(n => n.id === e.to);
    const mx  = e.bend
      ? (pts.start.x + pts.end.x) / 2 * 0.3 + (pts.via?.x || 0) * 0.7
      : (pts.start.x + pts.end.x) / 2;
    const my  = e.bend
      ? (pts.start.y + pts.end.y) / 2 * 0.3 + (pts.via?.y || 0) * 0.7
      : (pts.start.y + pts.end.y) / 2;
    const fs = Math.max(10, 12 * vpScale);
    ctx.font = `${fs}px Arial`;
    const tw = ctx.measureText(e.label).width;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(mx - tw/2 - 3, my - fs/2 - 2, tw + 6, fs + 4);
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.label, mx, my);
  }

  // Bend handle (visible on hover/active)
  if ((isHovered || isActive) && e.from !== e.to) {
    const mid = edgeMidpoint(e, pts);
    const mc  = toCanvas(mid.x, mid.y);
    ctx.beginPath();
    ctx.arc(mc.x, mc.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#1a73e8' : '#4285f4';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function drawArrow(tx, ty, fx, fy, color) {
  const angle = Math.atan2(ty - fy, tx - fx);
  const size  = Math.max(7, 9 * vpScale);
  ctx.fillStyle = color || '#555';
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - size * Math.cos(angle - 0.38), ty - size * Math.sin(angle - 0.38));
  ctx.lineTo(tx - size * Math.cos(angle + 0.38), ty - size * Math.sin(angle + 0.38));
  ctx.closePath();
  ctx.fill();
}

/* ── Draw node ── */
function drawNode(n) {
  const c  = toCanvas(n.x, n.y);
  const hw = (n.w/2) * vpScale, hh = (n.h/2) * vpScale;

  const isDragged = activeNode && activeNode.id === n.id;
  const isHovered = hoveredNode && hoveredNode.id === n.id;

  ctx.save();
  ctx.strokeStyle = isDragged ? '#1a73e8' : '#333333';
  ctx.lineWidth   = isDragged ? 2.5 : 1.5;
  ctx.fillStyle   = isDragged ? '#d2e3fc' : isHovered ? '#e8f0fe' : '#ffffff';
  ctx.setLineDash(n.dashed ? [5, 3] : []);

  if (n.shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, hw, hh, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  } else {
    const r = Math.min(5, hw * 0.12);
    ctx.beginPath();
    ctx.roundRect(c.x - hw, c.y - hh, hw*2, hh*2, r);
    ctx.fill(); ctx.stroke();
  }

  ctx.setLineDash([]);
  const fs = Math.max(10, Math.min(14, 13 * vpScale));
  ctx.font = `${fs}px Arial`;
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = n.label.split('\n');
  const lh    = fs * 1.3;
  const sy    = c.y - ((lines.length-1)/2) * lh;
  lines.forEach((ln, i) => ctx.fillText(ln, c.x, sy + i*lh, hw*1.9));

  ctx.restore();
}

/* ══════════════════════════════
   MOUSE EVENTS
   ══════════════════════════════ */
canvas.addEventListener('mousedown', e => {
  const { x, y } = cxy(e);
  const hitNode  = nodeAt(x, y);

  if (hitNode) {
    mode       = MODE.DRAG_NODE;
    activeNode = hitNode;
    const g    = toGraph(x, y);
    dragDX     = hitNode.x - g.x;
    dragDY     = hitNode.y - g.y;
    canvas.style.cursor = 'grabbing';
    return;
  }

  const hitEdge = edgeAt(x, y);
  if (hitEdge) {
    mode       = MODE.DRAG_EDGE;
    activeEdge = hitEdge;
    canvas.style.cursor = 'grabbing';
    return;
  }

  mode      = MODE.PAN;
  panStartX = e.clientX; panStartY = e.clientY;
  panOX     = vpOffsetX; panOY     = vpOffsetY;
  canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', e => {
  const { x, y } = cxy(e);

  if (mode === MODE.DRAG_NODE && activeNode) {
    const g    = toGraph(x, y);
    activeNode.x = g.x + dragDX;
    activeNode.y = g.y + dragDY;
    draw(); return;
  }

  if (mode === MODE.DRAG_EDGE && activeEdge) {
    const g = toGraph(x, y);
    activeEdge.bend = { x: g.x, y: g.y };
    draw(); return;
  }

  if (mode === MODE.PAN) {
    vpOffsetX = panOX + (e.clientX - panStartX);
    vpOffsetY = panOY + (e.clientY - panStartY);
    draw(); return;
  }

  // Hover
  const hn = nodeAt(x, y);
  const he = hn ? null : edgeAt(x, y);
  const changed = hn !== hoveredNode || he !== hoveredEdge;
  hoveredNode = hn;
  hoveredEdge = he;
  if (changed) {
    canvas.style.cursor = hn ? 'grab' : he ? 'pointer' : 'default';
    draw();
  }
});

window.addEventListener('mouseup', e => {
  // Double-click on edge to reset its bend
  if (mode === MODE.DRAG_EDGE && activeEdge) {
    // handled below via dblclick
  }
  mode       = MODE.NONE;
  activeNode = null;
  activeEdge = null;
  canvas.style.cursor = hoveredNode ? 'grab' : hoveredEdge ? 'pointer' : 'default';
});

canvas.addEventListener('dblclick', e => {
  const { x, y } = cxy(e);
  const hitEdge = edgeAt(x, y);
  if (hitEdge) { hitEdge.bend = null; draw(); }
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const { x, y } = cxy(e);
  vpOffsetX = x - (x - vpOffsetX) * factor;
  vpOffsetY = y - (y - vpOffsetY) * factor;
  vpScale   = Math.min(Math.max(vpScale * factor, 0.05), 8);
  draw();
}, { passive: false });

function cxy(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/* ══════════════════════════════
   RENDER
   ══════════════════════════════ */
function renderCircuit() {
  const dot = document.getElementById('netlistBox').value.trim();
  hideError();
  if (!dot) { showError('DOT source is empty.'); return; }
  if (!viz) { showError('Viz.js not ready — try again.'); return; }
  try {
    parseSVG(viz.renderSVGElement(dot));
  } catch(err) {
    showError(err.message || 'Failed to parse DOT source.');
  }
}

/* ══════════════════════════════
   EXPORT
   ══════════════════════════════ */
function exportPNG() {
  if (!nodes.length) { showError('Nothing to export.'); return; }
  const link = document.createElement('a');
  link.download = 'graph.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ══════════════════════════════
   RESET / EXAMPLE
   ══════════════════════════════ */
const EXAMPLE_DOT = `digraph Architecture {
  rankdir=LR;
  node [shape=box];

  Client -> "Load Balancer";
  "Load Balancer" -> "Web Server 1";
  "Load Balancer" -> "Web Server 2";
  "Web Server 1" -> "App Server";
  "Web Server 2" -> "App Server";
  "App Server" -> Cache [label="check"];
  "App Server" -> Database [label="query"];
  Cache -> "App Server" [label="hit", style=dashed];
}`;

function resetExample() {
  document.getElementById('netlistBox').value = EXAMPLE_DOT;
  nodes = []; edges = [];
  hideError(); draw();
}

/* ══════════════════════════════
   KEYBOARD SHORTCUT
   ══════════════════════════════ */
document.getElementById('netlistBox').addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault(); renderCircuit();
  }
});

/* ── Helpers ── */
function showError(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
function hideError()    { errEl.style.display = 'none'; }

resetExample();