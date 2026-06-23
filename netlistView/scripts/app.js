window.App = window.App || {};

(function (App) {
  'use strict';

  /* ── Examples ── */
  var EXAMPLE_DOT =
    'digraph Architecture {\n' +
    '  rankdir=LR;\n' +
    '  node [shape=box];\n' +
    '\n' +
    '  Client -> "Load Balancer";\n' +
    '  "Load Balancer" -> "Web Server 1";\n' +
    '  "Load Balancer" -> "Web Server 2";\n' +
    '  "Web Server 1" -> "App Server";\n' +
    '  "Web Server 2" -> "App Server";\n' +
    '  "App Server" -> Cache [label="check"];\n' +
    '  "App Server" -> Database [label="query"];\n' +
    '  Cache -> "App Server" [label="hit", style=dashed];\n' +
    '}';

  var EXAMPLE_NETLIST =
    '* Example Netlist with Transistor and 555 Timer\n' +
    'V1 N001 0 DC 5\n' +
    'R1 N001 N002 10k\n' +
    'C1 N002 0 10u\n' +
    'Q1 N002 N003 N004 NPNMOD\n' +
    'R2 N003 0 4.7k\n' +
    'L1 N004 0 2mH\n' +
    'D1 N004 N002 D4148\n' +
    'XU1 N005 N006 N007 N008 N009 N010 N011 N012 NE555\n' +
    '.model NPNMOD NPN (BF=100)\n' +
    '.model D4148 D\n' +
    '.subckt NE555 1 2 3 4 5 6 7 8\n' +
    '* 1:GND 2:TRIG 3:OUT 4:RESET 5:CTRL 6:THR 7:DISCH 8:VCC\n' +
    '.ends NE555\n' +
    '.op\n' +
    '.end';

  /* ── State ── */
  App.state = {
    currentMode: 'dot'
  };

  /* ── State Mutation / Mode Changer ── */
  App.setMode = function (mode) {
    App.state.currentMode = mode;
    
    App.dom.btnDot.classList.toggle('active', mode === 'dot');
    App.dom.btnNetlist.classList.toggle('active', mode === 'netlist');
    App.dom.btnSchematic.classList.toggle('active', mode === 'schematic');

    var isNetlist = (mode === 'netlist' || mode === 'schematic');
    App.dom.paneTitle.textContent = isNetlist ? 'Netlist Input' : 'DOT Graph Input';
    App.dom.btnConvert.style.display = mode === 'netlist' ? '' : 'none';
    
    App.dom.dotPreview.style.display = 'none';
    App.dom.dotPreview.textContent = '';
    App.dom.errorEl.style.display = 'none';
    
    App.dom.textarea.value = isNetlist ? EXAMPLE_NETLIST : EXAMPLE_DOT;
    App.updateLineNumbers();
    App.clearCanvas();
  };

  /* ── Event Listener Bindings ── */
  function initEventListeners() {
    App.dom.textarea.addEventListener('input', App.updateLineNumbers);
    
    App.dom.textarea.addEventListener('scroll', function () { 
      App.dom.gutterEl.scrollTop = App.dom.textarea.scrollTop; 
    });
    
    App.dom.textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = App.dom.textarea.selectionStart, en = App.dom.textarea.selectionEnd;
        App.dom.textarea.value = App.dom.textarea.value.substring(0, s) + '  ' + App.dom.textarea.value.substring(en);
        App.dom.textarea.selectionStart = App.dom.textarea.selectionEnd = s + 2;
        App.updateLineNumbers();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        App.handleRender();
      }
    });

    App.dom.btnDot.addEventListener('click', function () { App.setMode('dot'); });
    App.dom.btnNetlist.addEventListener('click', function () { App.setMode('netlist'); });
    App.dom.btnSchematic.addEventListener('click', function () { App.setMode('schematic'); });
    
    document.getElementById('btn-render').addEventListener('click', App.handleRender);
    document.getElementById('btn-convert').addEventListener('click', App.handleConvert);
    document.getElementById('btn-reset').addEventListener('click', function () { App.setMode(App.state.currentMode); });
    
    document.getElementById('btn-export').addEventListener('click', function() {
      if (typeof window.exportPNG === 'function') window.exportPNG();
    });
  }

  /* ── Initialization ── */
  App.dom.btnConvert.style.display = 'none';
  App.dom.textarea.value = EXAMPLE_DOT;
  App.updateLineNumbers();
  initEventListeners();

})(window.App);