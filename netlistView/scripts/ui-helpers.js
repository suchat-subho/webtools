// Global namespace for app utility modules
window.App = window.App || {};

(function (App) {
  'use strict';

  /* ── DOM refs ── */
  App.dom = {
    textarea: document.getElementById('netlistBox'),
    gutterEl: document.getElementById('line-numbers'),
    dotPreview: document.getElementById('dot-preview'),
    errorEl: document.getElementById('error-msg'),
    paneTitle: document.getElementById('pane-title'),
    btnConvert: document.getElementById('btn-convert'),
    btnDot: document.getElementById('btn-mode-dot'),
    btnNetlist: document.getElementById('btn-mode-netlist'),
    btnSchematic: document.getElementById('btn-mode-schematic'),
    canvas: document.getElementById('circuitCanvas')
  };

  /* ── Line numbers ── */
  App.updateLineNumbers = function () {
    var count = App.dom.textarea.value.split('\n').length;
    var html = '';
    for (var i = 1; i <= count; i++) {
      html += '<span>' + i + '</span>';
    }
    App.dom.gutterEl.innerHTML = html;
    App.dom.gutterEl.scrollTop = App.dom.textarea.scrollTop;
  };

  /* ── Error helpers ── */
  App.showAppError = function (msg) {
    App.dom.errorEl.textContent = msg;
    App.dom.errorEl.style.display = 'block';
  };

  App.clearAppError = function () {
    App.dom.errorEl.style.display = 'none';
  };

  /* ── Clear Canvas ── */
  App.clearCanvas = function () {
    if (typeof window.nodes !== 'undefined') { window.nodes = []; window.edges = []; }
    if (typeof window.scComps !== 'undefined') { window.scComps = []; window.scNets = {}; }
    
    var cx = App.dom.canvas.getContext('2d');
    cx.clearRect(0, 0, App.dom.canvas.width, App.dom.canvas.height);
    cx.fillStyle = '#fff';
    cx.fillRect(0, 0, App.dom.canvas.width, App.dom.canvas.height);
  };

})(window.App);