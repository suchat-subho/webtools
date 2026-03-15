/* ═══════════════════════════════════════════════════════════════
   schematic.js  —  Schematic-style circuit renderer
   Parses SPICE netlist and draws proper circuit symbols on canvas.
   Public API:  renderSchematic()   exportPNG()
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── Canvas setup ── */
var scCanvas  = document.getElementById('circuitCanvas');
var scCtx     = scCanvas.getContext('2d');
var scErrEl   = document.getElementById('error-msg');
var scRight   = document.getElementById('right-pane');

/* ── Layout constants ── */
var GRID      = 40;   // base grid unit in px
var COMP_W    = 3;    // component width in grid units
var COMP_H    = 2;    // component height in grid units

/* ── Viewport ── */
var scVpScale   = 1;
var scVpOffsetX = 0;
var scVpOffsetY = 0;

/* ── Interaction ── */
var scMode       = 0; // 0=none 1=pan
var scPanStartX  = 0, scPanStartY = 0, scPanOX = 0, scPanOY = 0;

/* ── Scene ── */
var scComps = [];   // { refdes, prefix, nets, value, x, y, rot }
var scNets  = {};   // netName → [{compIdx, termIdx, wx, wy}]

/* ════════════════════════════════════════════════════════
   RESIZE
   ════════════════════════════════════════════════════════ */
function scResize() {
  scCanvas.width  = scRight.clientWidth  - 2;
  scCanvas.height = scRight.clientHeight - 2;
  scDraw();
}
window.addEventListener('resize', scResize);
new ResizeObserver(scResize).observe(scRight);

/* ════════════════════════════════════════════════════════
   PARSE NETLIST
   ════════════════════════════════════════════════════════ */
function scParse(netlist) {
  scComps = [];
  scNets  = {};

  var GND_ALIASES = new Set(['0','gnd','vss','agnd','dgnd','pgnd']);
  var PWR_ALIASES = new Set(['vcc','vdd','v+','avcc','dvcc','pwr','vbat','vsup']);
  var MODEL_KW    = new Set(['NPN','PNP','NMOS','PMOS','NJF','PJF']);
  var KNOWN       = new Set(['R','C','L','V','I','D','Q','M','J','U','X','W']);
  var TERM_COUNT  = { R:2,C:2,L:2,V:2,I:2,D:2,Q:3,M:3,J:3 };

  /* Pre-pass: collect .model / .subckt names */
  netlist.split(/\r?\n/).forEach(function(line) {
    var m = line.trim().match(/^\.(model|subckt)\s+(\S+)/i);
    if (m) MODEL_KW.add(m[2].toUpperCase());
  });

  function normNet(raw) {
    var lo = raw.toLowerCase();
    if (GND_ALIASES.has(lo)) return 'GND';
    if (PWR_ALIASES.has(lo)) return 'PWR';
    return raw;
  }

  function isValue(tok) {
    if (tok === '0') return false;
    if (/^(dc|ac|pulse|sin|pwl|exp|tran)$/i.test(tok)) return true;
    if (/^\d/.test(tok)) return true;
    return false;
  }

  var lines = netlist.split(/\r?\n/);
  for (var ln = 0; ln < lines.length; ln++) {
    var raw = lines[ln].trim();
    if (!raw || raw[0] === '*' || raw[0] === '.') continue;

    var tokens  = raw.split(/\s+/);
    var refdes  = tokens[0].toUpperCase();
    var prefix  = refdes[0];
    if (!KNOWN.has(prefix) || prefix === 'W') continue;

    var netTokens = [], valueToken = '', subcktName = '';

    if (prefix === 'X') {
      var xi = 1, xNets = [];
      while (xi < tokens.length && !isValue(tokens[xi])) { xNets.push(tokens[xi]); xi++; }
      subcktName = xNets.pop() || '';
      netTokens  = xNets;
      valueToken = tokens.slice(xi).join(' ');
    } else {
      var maxN = TERM_COUNT[prefix] || 99;
      var i = 1;
      while (i < tokens.length) {
        var t = tokens[i];
        if (MODEL_KW.has(t.toUpperCase()))         { i++; continue; }
        if (netTokens.length >= maxN)              { valueToken = tokens.slice(i).join(' '); break; }
        if (isValue(t) && netTokens.length >= 2)   { valueToken = tokens.slice(i).join(' '); break; }
        netTokens.push(t);
        i++;
      }
    }

    if (netTokens.length < 2) continue;

    var nets = netTokens.map(normNet);
    var val  = valueToken || subcktName || '';

    scComps.push({
      refdes : refdes,
      prefix : prefix,
      nets   : nets,
      value  : val,
      x      : 0, y : 0,
      rot    : 0   // degrees: 0=horizontal
    });
  }
}

/* ════════════════════════════════════════════════════════
   AUTO-LAYOUT
   Places components in a grid, left-to-right by signal flow.
   Shared nets pull components together.
   ════════════════════════════════════════════════════════ */
function scLayout() {
  if (!scComps.length) return;

  /* Build net → component adjacency */
  var netMap = {};
  scComps.forEach(function(c, ci) {
    c.nets.forEach(function(n) {
      if (!netMap[n]) netMap[n] = [];
      netMap[n].push(ci);
    });
  });

  /* Topological placement: assign column by BFS from a source */
  var placed   = new Array(scComps.length).fill(false);
  var colOf    = new Array(scComps.length).fill(0);
  var rowOf    = new Array(scComps.length).fill(0);
  var colCount = {};

  /* Find a source component (voltage/current source first, else first comp) */
  var startIdx = 0;
  for (var ci = 0; ci < scComps.length; ci++) {
    if (scComps[ci].prefix === 'V' || scComps[ci].prefix === 'I') { startIdx = ci; break; }
  }

  var queue = [startIdx];
  placed[startIdx] = true;
  colOf[startIdx]  = 0;
  var maxCol = 0;

  while (queue.length) {
    var cur  = queue.shift();
    var comp = scComps[cur];
    /* Neighbours connected via output net (second net = output) */
    var outNet = comp.nets[comp.nets.length > 1 ? 1 : 0];
    if (netMap[outNet]) {
      netMap[outNet].forEach(function(nb) {
        if (!placed[nb]) {
          placed[nb]   = true;
          colOf[nb]    = colOf[cur] + 1;
          maxCol       = Math.max(maxCol, colOf[nb]);
          queue.push(nb);
        }
      });
    }
  }
  /* Place any unvisited components in subsequent columns */
  scComps.forEach(function(c, ci) {
    if (!placed[ci]) { colOf[ci] = ++maxCol; placed[ci] = true; }
  });

  /* Assign row within each column */
  colCount = {};
  scComps.forEach(function(c, ci) {
    var col = colOf[ci];
    if (colCount[col] === undefined) colCount[col] = 0;
    rowOf[ci]    = colCount[col]++;
  });

  /* Separate GND/PWR components — place at bottom of their column */
  var maxRow = 0;
  scComps.forEach(function(c, ci) { maxRow = Math.max(maxRow, rowOf[ci]); });

  /* Set x,y in grid units.  Vertical sources rotated 90° */
  var PAD = 2; // grid padding from edge
  scComps.forEach(function(c, ci) {
    var col = colOf[ci];
    var row = rowOf[ci];

    if (c.prefix === 'V' || c.prefix === 'I') {
      /* Sources: draw vertically */
      c.x   = PAD + col * (COMP_W + 2);
      c.y   = PAD + row * (COMP_H + 3);
      c.rot = 90;
    } else if (c.prefix === 'Q' || c.prefix === 'M' || c.prefix === 'J') {
      /* Transistors: vertical */
      c.x   = PAD + col * (COMP_W + 2);
      c.y   = PAD + row * (COMP_H + 3);
      c.rot = 0;
    } else if (c.prefix === 'U' || c.prefix === 'X') {
      /* ICs: horizontal, taller */
      c.x   = PAD + col * (COMP_W + 2);
      c.y   = PAD + row * (COMP_H + 3);
      c.rot = 0;
    } else {
      /* Passives: horizontal */
      c.x   = PAD + col * (COMP_W + 2);
      c.y   = PAD + row * (COMP_H + 3);
      c.rot = 0;
    }
  });

  /* Compute terminal world positions and build net table */
  scNets = {};
  scComps.forEach(function(c, ci) {
    var terms = scTerminals(c);
    c.nets.forEach(function(net, ti) {
      if (ti >= terms.length) return;
      if (!scNets[net]) scNets[net] = [];
      scNets[net].push({ ci: ci, ti: ti, wx: terms[ti].wx, wy: terms[ti].wy });
    });
  });

  scFitViewport();
}

/* ════════════════════════════════════════════════════════
   TERMINAL POSITIONS  (world coordinates in grid units)
   ════════════════════════════════════════════════════════ */
function scTerminals(c) {
  var x = c.x, y = c.y;
  switch (c.prefix) {
    case 'R': case 'C': case 'L':
      /* Horizontal: left terminal = p, right = n */
      return [{ wx: x,           wy: y + COMP_H/2 },
              { wx: x + COMP_W,  wy: y + COMP_H/2 }];
    case 'V': case 'I':
      /* Vertical circle: top = +, bottom = - */
      return [{ wx: x + COMP_W/2, wy: y          },
              { wx: x + COMP_W/2, wy: y + COMP_H + 1 }];
    case 'D':
      return [{ wx: x,           wy: y + COMP_H/2 },
              { wx: x + COMP_W,  wy: y + COMP_H/2 }];
    case 'Q': case 'M': case 'J':
      /* C/D=top, B/G=left, E/S=bottom */
      return [{ wx: x + COMP_W/2, wy: y          },   // collector/drain
              { wx: x,            wy: y + COMP_H/2 },  // base/gate
              { wx: x + COMP_W/2, wy: y + COMP_H + 1 }]; // emitter/source
    default: {
      /* ICs: distribute nets left side top-to-bottom, right side top-to-bottom */
      var n    = c.nets.length;
      var half = Math.ceil(n / 2);
      var icH  = Math.max(COMP_H, half + 1);
      var terms = [];
      var li = 0, ri = 0;
      for (var idx = 0; idx < n; idx++) {
        if (idx < half) {
          terms.push({ wx: x,           wy: y + 1 + li * (icH / half) }); li++;
        } else {
          terms.push({ wx: x + COMP_W + 2, wy: y + 1 + ri * (icH / (n - half)) }); ri++;
        }
      }
      return terms;
    }
  }
}

/* ════════════════════════════════════════════════════════
   FIT VIEWPORT
   ════════════════════════════════════════════════════════ */
function scFitViewport() {
  if (!scComps.length) return;
  var allX = [], allY = [];
  scComps.forEach(function(c) {
    scTerminals(c).forEach(function(t) { allX.push(t.wx); allY.push(t.wy); });
  });
  var minX = Math.min.apply(null, allX), maxX = Math.max.apply(null, allX);
  var minY = Math.min.apply(null, allY), maxY = Math.max.apply(null, allY);
  var gw = (maxX - minX + 4) * GRID;
  var gh = (maxY - minY + 4) * GRID;
  var pad = 60;
  scVpScale   = Math.min((scCanvas.width - pad*2) / gw, (scCanvas.height - pad*2) / gh, 2);
  scVpOffsetX = (scCanvas.width  - gw * scVpScale) / 2;
  scVpOffsetY = (scCanvas.height - gh * scVpScale) / 2;
  scDraw();
}

/* ════════════════════════════════════════════════════════
   WORLD → CANVAS
   ════════════════════════════════════════════════════════ */
function scW2C(wx, wy) {
  return {
    x: wx * GRID * scVpScale + scVpOffsetX,
    y: wy * GRID * scVpScale + scVpOffsetY
  };
}

/* ════════════════════════════════════════════════════════
   DRAW
   ════════════════════════════════════════════════════════ */
function scDraw() {
  scCtx.clearRect(0, 0, scCanvas.width, scCanvas.height);
  scCtx.fillStyle = '#fff';
  scCtx.fillRect(0, 0, scCanvas.width, scCanvas.height);
  if (!scComps.length) return;

  /* Draw wires between shared nets */
  scDrawWires();

  /* Draw components */
  scComps.forEach(function(c) { scDrawComp(c); });

  /* Draw net labels */
  scDrawNetLabels();
}

/* ── Wires ── */
function scDrawWires() {
  scCtx.save();
  scCtx.strokeStyle = '#222';
  scCtx.lineWidth   = Math.max(1, 1.5 * scVpScale);
  scCtx.lineJoin    = 'round';

  Object.keys(scNets).forEach(function(net) {
    var pts = scNets[net];
    if (pts.length < 2) return;

    if (net === 'GND' || net === 'PWR') return; // handled as symbols

    /* Connect all terminals of this net with orthogonal wires via a bus point */
    /* Find bounding box and route through centre */
    var xs = pts.map(function(p) { return p.wx; });
    var ys = pts.map(function(p) { return p.wy; });
    var midX = (Math.min.apply(null,xs) + Math.max.apply(null,xs)) / 2;
    var midY = (Math.min.apply(null,ys) + Math.max.apply(null,ys)) / 2;

    pts.forEach(function(p) {
      var a = scW2C(p.wx, p.wy);
      /* Route: horizontal to midX, then vertical to midY, then to target */
      /* Simple L-route: go horizontal then vertical */
      var mid = scW2C(midX, p.wy);
      var hub = scW2C(midX, midY);

      scCtx.beginPath();
      scCtx.moveTo(a.x, a.y);
      scCtx.lineTo(mid.x, mid.y);
      scCtx.lineTo(hub.x, hub.y);
      scCtx.stroke();
    });

    /* Draw junction dot at hub if 3+ terminals */
    if (pts.length >= 3) {
      var hub2 = scW2C(midX, midY);
      scCtx.beginPath();
      scCtx.arc(hub2.x, hub2.y, Math.max(2, 3*scVpScale), 0, Math.PI*2);
      scCtx.fillStyle = '#222';
      scCtx.fill();
    }
  });
  scCtx.restore();
}

/* ── Net labels ── */
function scDrawNetLabels() {
  var drawn = {};
  scCtx.save();
  scCtx.font      = Math.max(8, 11*scVpScale) + 'px Arial';
  scCtx.fillStyle = '#333';
  scCtx.textAlign = 'center';

  Object.keys(scNets).forEach(function(net) {
    if (net === 'GND' || net === 'PWR') return;
    var pts = scNets[net];
    if (drawn[net]) return;
    drawn[net] = true;
    /* Label at the first terminal of the net */
    var p = pts[0];
    var c = scW2C(p.wx, p.wy);
    scCtx.fillText(net, c.x, c.y - 6*scVpScale);
  });

  scCtx.restore();
}

/* ════════════════════════════════════════════════════════
   DRAW COMPONENT SYMBOLS
   ════════════════════════════════════════════════════════ */
function scDrawComp(c) {
  var cx = scCtx;
  var s  = scVpScale;
  cx.save();

  var terms = scTerminals(c);
  var p0    = scW2C(c.x, c.y);
  var g     = GRID * s;   // grid unit in canvas px

  cx.strokeStyle = '#222';
  cx.lineWidth   = Math.max(1, 1.5*s);
  cx.fillStyle   = '#fff';
  cx.lineJoin    = 'round';
  cx.lineCap     = 'round';

  switch (c.prefix) {
    case 'R': scDrawResistor(c, terms, g, s); break;
    case 'C': scDrawCapacitor(c, terms, g, s); break;
    case 'L': scDrawInductor(c, terms, g, s); break;
    case 'V': scDrawVSource(c, terms, g, s); break;
    case 'I': scDrawISource(c, terms, g, s); break;
    case 'D': scDrawDiode(c, terms, g, s); break;
    case 'Q': case 'M': case 'J': scDrawTransistor(c, terms, g, s); break;
    default:  scDrawIC(c, terms, g, s); break;
  }

  cx.restore();
}

/* ── Resistor ── */
function scDrawResistor(c, terms, g, s) {
  var t0 = scW2C(terms[0].wx, terms[0].wy);
  var t1 = scW2C(terms[1].wx, terms[1].wy);
  var cx = scCtx;
  var bw = g * 0.6, bh = g * 0.3;
  var mx = (t0.x + t1.x) / 2, my = (t0.y + t1.y) / 2;

  /* Lead wires */
  cx.beginPath(); cx.moveTo(t0.x, t0.y); cx.lineTo(mx - bw/2, my); cx.stroke();
  cx.beginPath(); cx.moveTo(t1.x, t1.y); cx.lineTo(mx + bw/2, my); cx.stroke();

  /* Zigzag body */
  var segs = 6, sw = bw / segs;
  cx.beginPath();
  cx.moveTo(mx - bw/2, my);
  for (var i = 0; i < segs; i++) {
    cx.lineTo(mx - bw/2 + sw*(i + 0.5), my + (i%2===0 ? -bh : bh));
    cx.lineTo(mx - bw/2 + sw*(i + 1),   my);
  }
  cx.stroke();

  scDrawLabel(c, mx, my - bh - 4*s);
}

/* ── Capacitor ── */
function scDrawCapacitor(c, terms, g, s) {
  var t0 = scW2C(terms[0].wx, terms[0].wy);
  var t1 = scW2C(terms[1].wx, terms[1].wy);
  var cx = scCtx;
  var gap = g * 0.12, pw = g * 0.55;
  var mx = (t0.x + t1.x) / 2, my = (t0.y + t1.y) / 2;

  cx.beginPath(); cx.moveTo(t0.x, t0.y); cx.lineTo(mx - gap, my); cx.stroke();
  cx.beginPath(); cx.moveTo(t1.x, t1.y); cx.lineTo(mx + gap, my); cx.stroke();

  /* Two plates */
  cx.beginPath(); cx.moveTo(mx-gap, my-pw/2); cx.lineTo(mx-gap, my+pw/2); cx.stroke();
  cx.beginPath(); cx.moveTo(mx+gap, my-pw/2); cx.lineTo(mx+gap, my+pw/2); cx.stroke();

  scDrawLabel(c, mx, my - pw/2 - 4*s);
}

/* ── Inductor ── */
function scDrawInductor(c, terms, g, s) {
  var t0 = scW2C(terms[0].wx, terms[0].wy);
  var t1 = scW2C(terms[1].wx, terms[1].wy);
  var cx = scCtx;
  var bw = g * 0.7, r = bw / 8;
  var mx = (t0.x + t1.x) / 2, my = (t0.y + t1.y) / 2;
  var n  = 4;

  cx.beginPath(); cx.moveTo(t0.x, t0.y); cx.lineTo(mx - bw/2, my); cx.stroke();
  cx.beginPath(); cx.moveTo(t1.x, t1.y); cx.lineTo(mx + bw/2, my); cx.stroke();

  /* Bumps */
  cx.beginPath();
  cx.moveTo(mx - bw/2, my);
  for (var i = 0; i < n; i++) {
    var cx0 = mx - bw/2 + (2*i)*r, cx1 = cx0 + r, cx2 = cx0 + 2*r;
    cx.arc(cx0 + r, my, r, Math.PI, 0, false);
  }
  cx.stroke();

  scDrawLabel(c, mx, my - r - 4*s);
}

/* ── Voltage source ── */
function scDrawVSource(c, terms, g, s) {
  var t0 = scW2C(terms[0].wx, terms[0].wy);
  var t1 = scW2C(terms[1].wx, terms[1].wy);
  var cx = scCtx;
  var r  = g * 0.55;
  var mx = (t0.x + t1.x)/2, my = (t0.y + t1.y)/2;

  cx.beginPath(); cx.moveTo(t0.x, t0.y); cx.lineTo(mx, my - r); cx.stroke();
  cx.beginPath(); cx.moveTo(t1.x, t1.y); cx.lineTo(mx, my + r); cx.stroke();

  cx.beginPath(); cx.arc(mx, my, r, 0, Math.PI*2); cx.stroke();

  /* + and - symbols */
  var fs = Math.max(8, 10*s);
  cx.font = 'bold ' + fs + 'px Arial';
  cx.fillStyle = '#222';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText('+', mx, my - r*0.45);
  cx.fillText('−', mx, my + r*0.45);

  scDrawLabel(c, mx - r - 4*s, my, 'right');
}

/* ── Current source ── */
function scDrawISource(c, terms, g, s) {
  var t0 = scW2C(terms[0].wx, terms[0].wy);
  var t1 = scW2C(terms[1].wx, terms[1].wy);
  var cx = scCtx;
  var r  = g * 0.55;
  var mx = (t0.x + t1.x)/2, my = (t0.y + t1.y)/2;

  cx.beginPath(); cx.moveTo(t0.x, t0.y); cx.lineTo(mx, my - r); cx.stroke();
  cx.beginPath(); cx.moveTo(t1.x, t1.y); cx.lineTo(mx, my + r); cx.stroke();
  cx.beginPath(); cx.arc(mx, my, r, 0, Math.PI*2); cx.stroke();

  /* Arrow inside */
  scCtx.fillStyle = '#222';
  scArrow(mx, my - r*0.3, mx, my + r*0.3, 5*s);

  scDrawLabel(c, mx - r - 4*s, my, 'right');
}

/* ── Diode ── */
function scDrawDiode(c, terms, g, s) {
  var t0 = scW2C(terms[0].wx, terms[0].wy);
  var t1 = scW2C(terms[1].wx, terms[1].wy);
  var cx = scCtx;
  var hw = g * 0.3, hh = g * 0.3;
  var mx = (t0.x + t1.x)/2, my = (t0.y + t1.y)/2;

  cx.beginPath(); cx.moveTo(t0.x, t0.y); cx.lineTo(mx - hw, my); cx.stroke();
  cx.beginPath(); cx.moveTo(t1.x, t1.y); cx.lineTo(mx + hw, my); cx.stroke();

  /* Triangle (anode left → cathode right) */
  cx.beginPath();
  cx.moveTo(mx - hw, my - hh);
  cx.lineTo(mx - hw, my + hh);
  cx.lineTo(mx + hw, my);
  cx.closePath();
  cx.fillStyle = '#222'; cx.fill(); cx.stroke();

  /* Cathode bar */
  cx.beginPath();
  cx.moveTo(mx + hw, my - hh);
  cx.lineTo(mx + hw, my + hh);
  cx.stroke();

  scDrawLabel(c, mx, my - hh - 4*s);
}

/* ── Transistor (BJT / MOSFET) ── */
function scDrawTransistor(c, terms, g, s) {
  var tC  = scW2C(terms[0].wx, terms[0].wy);  // collector/drain
  var tB  = scW2C(terms[1].wx, terms[1].wy);  // base/gate
  var tE  = scW2C(terms[2].wx, terms[2].wy);  // emitter/source
  var cx  = scCtx;
  var r   = g * 0.5;
  var mx  = tB.x + r, my = (tC.y + tE.y) / 2;

  /* Circle body */
  cx.beginPath(); cx.arc(mx, my, r, 0, Math.PI*2); cx.stroke();

  /* Base lead */
  var bx = mx - r; // left edge of circle
  cx.beginPath(); cx.moveTo(tB.x, tB.y); cx.lineTo(bx, my); cx.stroke();

  /* Vertical bar inside circle */
  cx.beginPath();
  cx.moveTo(bx + r*0.3, my - r*0.6);
  cx.lineTo(bx + r*0.3, my + r*0.6);
  cx.stroke();

  /* Collector line */
  cx.beginPath();
  cx.moveTo(bx + r*0.3, my - r*0.4);
  cx.lineTo(mx + r*0.3, my - r*0.7);
  cx.lineTo(tC.x, tC.y);
  cx.stroke();

  /* Emitter line with arrow */
  cx.beginPath();
  cx.moveTo(bx + r*0.3, my + r*0.4);
  cx.lineTo(mx + r*0.3, my + r*0.7);
  cx.lineTo(tE.x, tE.y);
  cx.stroke();

  /* Arrow on emitter (NPN points outward) */
  scArrow(mx + r*0.15, my + r*0.55, tE.x, tE.y, 5*s);

  scDrawLabel(c, mx + r + 4*s, my, 'left');
}

/* ── IC Box ── */
function scDrawIC(c, terms, g, s) {
  var cx   = scCtx;
  var n    = c.nets.length;
  var half = Math.ceil(n / 2);
  var icH  = Math.max(COMP_H, half + 1) * g;
  var icW  = (COMP_W + 2) * g;
  var ox   = scW2C(c.x, c.y).x;
  var oy   = scW2C(c.x, c.y).y;

  /* Box */
  cx.fillStyle = '#fff';
  cx.strokeStyle = '#222';
  cx.lineWidth = Math.max(1, 1.5*s);
  cx.beginPath();
  cx.rect(ox + g*0.5, oy + g*0.5, icW - g, icH - g*0.5);
  cx.fill(); cx.stroke();

  /* Pin stubs and labels */
  var fs = Math.max(7, 9*s);
  cx.font = fs + 'px Arial';
  cx.fillStyle = '#222';
  cx.lineWidth = Math.max(1, s);

  var TERM_LABELS_IC = {
    'NE555': ['GND','TRIG','OUT','RESET','CTRL','THR','DISCH','VCC'],
  };
  var subName = (c.prefix === 'X') ? c.value : c.refdes;
  var pinNames = TERM_LABELS_IC[subName] || terms.map(function(_,i){ return String(i+1); });

  terms.forEach(function(t, idx) {
    var tc = scW2C(t.wx, t.wy);
    cx.beginPath(); cx.moveTo(tc.x, tc.y);
    var isLeft = idx < half;
    var innerX = isLeft ? ox + g*0.5 : ox + icW - g;
    cx.lineTo(innerX, tc.y);
    cx.stroke();

    /* Pin label inside box */
    cx.textAlign    = isLeft ? 'left'  : 'right';
    cx.textBaseline = 'middle';
    cx.fillText(pinNames[idx] || String(idx+1), innerX + (isLeft ? 3*s : -3*s), tc.y);
  });

  /* Refdes + value label in centre of box */
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.font = 'bold ' + Math.max(8, 10*s) + 'px Arial';
  cx.fillText(c.refdes, ox + icW/2, oy + icH/2 - 6*s);
  if (c.value) {
    cx.font = Math.max(7, 9*s) + 'px Arial';
    cx.fillText(c.value, ox + icW/2, oy + icH/2 + 6*s);
  }
}

/* ── GND symbol ── */
function scDrawGND(wx, wy, g, s) {
  var p  = scW2C(wx, wy);
  var cx = scCtx;
  var w  = g * 0.4;
  cx.save();
  cx.strokeStyle = '#222';
  cx.lineWidth   = Math.max(1, 1.5*s);
  cx.beginPath(); cx.moveTo(p.x, p.y);    cx.lineTo(p.x, p.y + g*0.3);  cx.stroke();
  cx.beginPath(); cx.moveTo(p.x-w, p.y+g*0.3); cx.lineTo(p.x+w, p.y+g*0.3); cx.stroke();
  cx.beginPath(); cx.moveTo(p.x-w*0.6, p.y+g*0.5); cx.lineTo(p.x+w*0.6, p.y+g*0.5); cx.stroke();
  cx.beginPath(); cx.moveTo(p.x-w*0.2, p.y+g*0.7); cx.lineTo(p.x+w*0.2, p.y+g*0.7); cx.stroke();
  cx.restore();
}

/* ── Arrow helper ── */
function scArrow(x1, y1, x2, y2, size) {
  var angle = Math.atan2(y2-y1, x2-x1);
  scCtx.fillStyle = '#222';
  scCtx.beginPath();
  scCtx.moveTo(x2, y2);
  scCtx.lineTo(x2 - size*Math.cos(angle-0.4), y2 - size*Math.sin(angle-0.4));
  scCtx.lineTo(x2 - size*Math.cos(angle+0.4), y2 - size*Math.sin(angle+0.4));
  scCtx.closePath();
  scCtx.fill();
}

/* ── Component label (refdes + value) ── */
function scDrawLabel(c, x, y, align) {
  var cx = scCtx;
  var s  = scVpScale;
  cx.save();
  cx.font      = Math.max(7, 9*s) + 'px Arial';
  cx.fillStyle = '#333';
  cx.textAlign = align || 'center';
  cx.textBaseline = 'bottom';
  cx.fillText(c.refdes, x, y);
  if (c.value) {
    cx.textBaseline = 'top';
    cx.fillText(c.value, x, y + 1);
  }
  cx.restore();
}

/* ════════════════════════════════════════════════════════
   MOUSE EVENTS  (pan + zoom only — no node drag in schematic)
   ════════════════════════════════════════════════════════ */
scCanvas.addEventListener('mousedown', function(e) {
  scMode = 1;
  scPanStartX = e.clientX; scPanStartY = e.clientY;
  scPanOX = scVpOffsetX;   scPanOY = scVpOffsetY;
  scCanvas.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', function(e) {
  if (scMode !== 1) return;
  scVpOffsetX = scPanOX + (e.clientX - scPanStartX);
  scVpOffsetY = scPanOY + (e.clientY - scPanStartY);
  scDraw();
});
window.addEventListener('mouseup', function() {
  scMode = 0;
  scCanvas.style.cursor = 'default';
});
scCanvas.addEventListener('wheel', function(e) {
  e.preventDefault();
  var f = e.deltaY < 0 ? 1.1 : 0.9;
  var r = scCanvas.getBoundingClientRect();
  var px = e.clientX - r.left, py = e.clientY - r.top;
  scVpOffsetX = px - (px - scVpOffsetX)*f;
  scVpOffsetY = py - (py - scVpOffsetY)*f;
  scVpScale   = Math.min(Math.max(scVpScale*f, 0.05), 8);
  scDraw();
}, { passive: false });

/* ════════════════════════════════════════════════════════
   PUBLIC API
   ════════════════════════════════════════════════════════ */
function renderSchematic() {
  var src = document.getElementById('netlistBox').value.trim();
  var errEl = document.getElementById('error-msg');
  errEl.style.display = 'none';
  if (!src) { errEl.textContent = 'Netlist is empty.'; errEl.style.display = 'block'; return; }
  scParse(src);
  if (!scComps.length) {
    errEl.textContent = 'No components found.';
    errEl.style.display = 'block';
    return;
  }
  scLayout();
}

function exportPNG() {
  var link = document.createElement('a');
  link.download = 'schematic.png';
  link.href = scCanvas.toDataURL('image/png');
  link.click();
}

/* Initial size */
scResize();