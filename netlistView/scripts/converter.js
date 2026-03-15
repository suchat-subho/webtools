/* ═══════════════════════════════════════════════════════════════
   converter.js  —  SPICE-style netlist → Graphviz DOT
   ═══════════════════════════════════════════════════════════════

   Supported component prefixes (first letter of RefDes):
     R  Resistor          2 terminals: p, n
     C  Capacitor         2 terminals: p, n
     L  Inductor          2 terminals: p, n
     V  Voltage source    2 terminals: +, -
     I  Current source    2 terminals: +, -
     D  Diode             2 terminals: A (anode), K (cathode)
     Q  BJT               3 terminals: C, B, E
     M  MOSFET            3 terminals: D, G, S
     J  JFET              3 terminals: D, G, S
     U  IC / op-amp       N terminals: numbered 1…N
     X  Subcircuit        N terminals (last alpha token = subckt name)
     W  Wire / short      2 nets joined directly, no component node
     *  Comment           ignored
     .  SPICE directive   ignored (.tran, .end, .subckt, …)

   Line format:
     <RefDes>  <net1>  <net2>  [net3…]  [value]  [params]

   Special net aliases (collapsed to canonical names):
     GND  ←  0, gnd, vss, agnd, dgnd, pgnd
     PWR  ←  vcc, vdd, v+, avcc, dvcc, pwr, vbat, vsup

   Output: undirected graph (graph / --) with record-shape component
   nodes that carry named port labels. Edges have no labels.

   API:
     netlistToDot(netlistString, options?)
       → { dot: string, errors: string[] }

   Options:
     rankdir  'LR' | 'TB' | 'RL' | 'BT'   default 'LR'
     mergeGnd  boolean                       default true
     mergePwr  boolean                       default true
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/**
 * Convert a SPICE-style netlist to a Graphviz DOT string.
 *
 * @param {string} netlist
 * @param {{ rankdir?: string, mergeGnd?: boolean, mergePwr?: boolean }} [opts]
 * @returns {{ dot: string, errors: string[] }}
 */
function netlistToDot(netlist, opts) {
  opts = opts || {};
  var rankdir  = opts.rankdir  !== undefined ? opts.rankdir  : 'LR';
  var mergeGnd = opts.mergeGnd !== undefined ? opts.mergeGnd : true;
  var mergePwr = opts.mergePwr !== undefined ? opts.mergePwr : true;

  var errors    = [];
  var compNodes = new Map();   // refdes  → { recordLabel, style }
  var netNodes  = new Set();   // net name strings
  var edges     = [];          // { fromNode, fromPort, toNode, toPort, style }

  /* ── Net aliases ── */
  var GND_ALIASES = new Set(['0','gnd','vss','agnd','dgnd','pgnd']);
  var PWR_ALIASES = new Set(['vcc','vdd','v+','avcc','dvcc','pwr','vbat','vsup']);

  function normaliseNet(raw) {
    var lo = raw.toLowerCase();
    if (mergeGnd && GND_ALIASES.has(lo)) return 'GND';
    if (mergePwr && PWR_ALIASES.has(lo)) return 'PWR';
    return raw;
  }

  /* ── Terminal labels ── */
  var TERMINAL_LABELS = {
    R: ['p','n'], C: ['p','n'], L: ['p','n'],
    V: ['+','-'], I: ['+','-'],
    D: ['A','K'],
    Q: ['C','B','E'],
    M: ['D','G','S'],
    J: ['D','G','S'],
  };

  /* ── Node style overrides ── */
  var COMP_STYLE = {
    V: 'filled', I: 'filled',   // sources — filled ellipse look via style
    U: 'filled',
    X: 'dashed',
  };

  /* ── Known component prefixes ── */
  var KNOWN = new Set(['R','C','L','V','I','D','Q','M','J','U','X','W']);

  /* ── Model-type keywords to skip (not nets) ── */
  var MODEL_KW = new Set(['NPN','PNP','NMOS','PMOS','NJF','PJF']);

  /* ── Expected terminal counts (nets only) per prefix ── */
  var TERM_COUNT = { R:2, C:2, L:2, V:2, I:2, D:2, Q:3, M:3, J:3 };
  // U and X are variable — no fixed count

  /* ── Pre-pass: collect user-defined .model and .subckt names ── */
  var userLines = netlist.split(/\r?\n/);
  userLines.forEach(function(line) {
    var t = line.trim();
    // .model <name> <type> ...   or   .subckt <name> ...
    var m = t.match(/^\.(model|subckt)\s+(\S+)/i);
    if (m) MODEL_KW.add(m[2].toUpperCase());
  });

  /* ── Value-token test ── */
  function isValue(token) {
    if (token === '0') return false;                          // bare 0 = GND net
    if (/^(dc|ac|pulse|sin|pwl|exp|tran)$/i.test(token)) return true;
    if (/^\d/.test(token)) return true;                      // starts with digit
    return false;
  }

  /* ── Escape characters that are special inside a DOT record label ── */
  function escRec(s) {
    return s.replace(/[{}<>|"\\]/g, function(c) { return '\\' + c; });
  }

  /* ════════════════════════════════
     PARSE
     ════════════════════════════════ */
  var lines = netlist.split(/\r?\n/);

  for (var ln = 0; ln < lines.length; ln++) {
    var raw = lines[ln].trim();
    if (!raw || raw[0] === '*' || raw[0] === '.') continue;

    var tokens = raw.split(/\s+/);
    var refdes  = tokens[0].toUpperCase();
    var prefix  = refdes[0];

    if (!KNOWN.has(prefix)) {
      errors.push('Line ' + (ln+1) + ': unknown prefix "' + prefix + '" in "' + refdes + '" — skipped.');
      continue;
    }

    /* Wire: direct net-to-net, no component node */
    if (prefix === 'W') {
      if (tokens.length < 3) {
        errors.push('Line ' + (ln+1) + ': wire "' + refdes + '" needs 2 nets — skipped.');
        continue;
      }
      var wn1 = normaliseNet(tokens[1]);
      var wn2 = normaliseNet(tokens[2]);
      netNodes.add(wn1);
      netNodes.add(wn2);
      edges.push({ fromNode: wn1, fromPort: null, toNode: wn2, toPort: null, style: 'dashed' });
      continue;
    }

    /* Collect net tokens and value token */
    var netTokens  = [];
    var valueToken = '';
    var subcktName = '';

    if (prefix === 'X') {
      /* Subcircuit: X refdes net1 net2 … subcktName [value] */
      var xi = 1, xNets = [];
      while (xi < tokens.length && !isValue(tokens[xi])) { xNets.push(tokens[xi]); xi++; }
      subcktName = xNets.pop() || '';
      netTokens  = xNets;
      valueToken = tokens.slice(xi).join(' ');
    } else {
      var maxNets = TERM_COUNT[prefix] || 99;  // cap at known terminal count
      var i = 1;
      while (i < tokens.length) {
        var t = tokens[i];
        if (MODEL_KW.has(t.toUpperCase()))           { i++; continue; } // skip model names
        if (netTokens.length >= maxNets)             { valueToken = tokens.slice(i).join(' '); break; }
        if (isValue(t) && netTokens.length >= 2)     { valueToken = tokens.slice(i).join(' '); break; }
        netTokens.push(t);
        i++;
      }
    }

    if (netTokens.length < 2) {
      errors.push('Line ' + (ln+1) + ': "' + refdes + '" needs at least 2 net connections — skipped.');
      continue;
    }

    var normNets   = netTokens.map(normaliseNet);
    normNets.forEach(function(n) { netNodes.add(n); });

    var termLabels = TERMINAL_LABELS[prefix] || normNets.map(function(_, idx) { return String(idx + 1); });

    /* ── Build record label ──────────────────────────────────────────
       For 2-terminal components (R, C, L, V, I, D):
         { <p0> A | RefDes\nValue | <p1> B }
         — flat row, one port each side of the centre cell

       For 3+ terminal components (Q, M, U, X …):
         { {<p0> C\n|<p1> B\n|<p2> E} | RefDes\nValue }   (left ports)
         or split left/right:
         { {<p0> 1|<p1> 2|<p2> 3|<p3> 4} | U1\n555 | {<p4> 5|<p5> 6|<p6> 7|<p7> 8} }

       The centre text uses DOT's \n (a literal backslash+n in the DOT
       source, which Graphviz interprets as a line break).  We must NOT
       pass it through escRec because escRec would double-escape the
       backslash.  All other label text goes through escRec normally.
    ─────────────────────────────────────────────────────────────────── */

    // DOT newline inside a label = the two chars  \  n  in the file.
    // In a JS string that is written as  '\\n'.
    var DOT_NL = '\\n';

    var centre = valueToken
      ? (escRec(refdes) + DOT_NL + escRec(valueToken))
      : (subcktName ? (escRec(refdes) + DOT_NL + escRec(subcktName)) : escRec(refdes));

    var half       = Math.ceil(termLabels.length / 2);
    var leftTerms  = termLabels.slice(0, half);
    var rightTerms = termLabels.slice(half);

    var recordLabel;

    if (termLabels.length <= 2) {
      /* Simple 2-terminal: flat  { <p0> A | Centre | <p1> B } */
      var lc = leftTerms.map(function(lbl, idx) {
        return '<p' + idx + '> ' + escRec(lbl);
      }).join(' | ');
      var rc = rightTerms.map(function(lbl, idx) {
        return '<p' + (half + idx) + '> ' + escRec(lbl);
      }).join(' | ');

      recordLabel = rc
        ? ('{ ' + lc + ' | ' + centre + ' | ' + rc + ' }')
        : ('{ ' + lc + ' | ' + centre + ' }');

    } else {
      /* Multi-terminal IC: vertical port columns left and right of centre
         { { <p0> 1 | <p1> 2 | ... } | Centre | { <p4> 5 | ... } }
         Each sub-brace makes a vertical column in Graphviz record layout. */
      var leftCol = leftTerms.map(function(lbl, idx) {
        return '<p' + idx + '> ' + escRec(lbl);
      }).join(' | ');

      if (rightTerms.length > 0) {
        var rightCol = rightTerms.map(function(lbl, idx) {
          return '<p' + (half + idx) + '> ' + escRec(lbl);
        }).join(' | ');
        recordLabel = '{ { ' + leftCol + ' } | ' + centre + ' | { ' + rightCol + ' } }';
      } else {
        recordLabel = '{ { ' + leftCol + ' } | ' + centre + ' }';
      }
    }

    compNodes.set(refdes, {
      recordLabel : recordLabel,
      style       : COMP_STYLE[prefix] || '',
    });

    /* ── One edge per terminal: net -- component:portN ── */
    normNets.forEach(function(net, idx) {
      edges.push({
        fromNode : net,
        fromPort : null,
        toNode   : refdes,
        toPort   : 'p' + idx,
        style    : '',
      });
    });
  }

  /* ════════════════════════════════
     EMIT DOT
     ════════════════════════════════ */
  var out = [];

  out.push('graph Netlist {');
  out.push('  rankdir=' + rankdir + ';');
  out.push('  node [fontname="Arial", fontsize=11];');
  out.push('  edge [fontname="Arial", fontsize=10];');
  out.push('');

  out.push('  // Net nodes');
  netNodes.forEach(function(net) {
    if (net === 'GND') {
      out.push('  "' + net + '" [label="GND", shape=triangle, orientation=180];');
    } else if (net === 'PWR') {
      out.push('  "' + net + '" [label="PWR", shape=invtriangle];');
    } else {
      out.push('  "' + net + '" [label="' + net + '", shape=ellipse];');
    }
  });

  out.push('');
  out.push('  // Component nodes');
  compNodes.forEach(function(comp, refdes) {
    var attrs = ['label="' + comp.recordLabel + '"', 'shape=record'];
    if (comp.style) attrs.push('style="' + comp.style + '"');
    out.push('  "' + refdes + '" [' + attrs.join(', ') + '];');
  });

  out.push('');
  out.push('  // Connections');
  edges.forEach(function(e) {
    var src = e.fromPort ? ('"' + e.fromNode + '":"' + e.fromPort + '"') : ('"' + e.fromNode + '"');
    var dst = e.toPort   ? ('"' + e.toNode   + '":"' + e.toPort   + '"') : ('"' + e.toNode   + '"');
    var attr = e.style ? ' [style="' + e.style + '"]' : '';
    out.push('  ' + src + ' -- ' + dst + attr + ';');
  });

  out.push('}');

  return { dot: out.join('\n'), errors: errors };
}