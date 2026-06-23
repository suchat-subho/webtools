window.App = window.App || {};

(function (App) {
  'use strict';

  /* ── Render Execution Logic ── */
  App.handleRender = function () {
    App.clearAppError();

    if (App.state.currentMode === 'schematic') {
      if (typeof window.renderSchematic === 'function') {
        window.renderSchematic(); /* defined in schematic.js */
      }
      return;
    }

    if (App.state.currentMode === 'netlist') {
      var src = App.dom.textarea.value.trim();
      if (!src) { App.showAppError('Netlist is empty.'); return; }
      
      var result = window.netlistToDot(src, { rankdir: 'LR' });
      if (result.errors.length) App.showAppError(result.errors.join('\n'));
      
      App.dom.dotPreview.textContent = result.dot;
      App.dom.dotPreview.style.display = 'block';
      
      var orig = App.dom.textarea.value;
      App.dom.textarea.value = result.dot;
      
      if (typeof window.renderCircuit === 'function') {
        window.renderCircuit(); /* defined in graph.js */
      }
      
      App.dom.textarea.value = orig;
      App.updateLineNumbers();
      return;
    }

    /* DOT mode */
    if (typeof window.renderCircuit === 'function') {
      window.renderCircuit(); /* defined in graph.js */
    }
  };

  /* ── Convert → DOT preview ── */
  App.handleConvert = function () {
    App.clearAppError();
    var src = App.dom.textarea.value.trim();
    if (!src) { App.showAppError('Netlist is empty.'); return; }
    
    var result = window.netlistToDot(src, { rankdir: 'LR' });
    if (result.errors.length) App.showAppError(result.errors.join('\n'));
    
    App.dom.dotPreview.textContent = result.dot;
    App.dom.dotPreview.style.display = App.dom.dotPreview.style.display === 'block' ? 'none' : 'block';
  };

})(window.App);