/* ── State ── */
let viz = null;
let canvasImg = null;
let scale = 1;
let offsetX = 0, offsetY = 0;
let dragging = false;
let dragStartX, dragStartY, dragOX, dragOY;

const canvas  = document.getElementById('circuitCanvas');
const ctx     = canvas.getContext('2d');
const errEl   = document.getElementById('error-msg');

/* ── Init Viz.js ── */
Viz.instance().then(v => { viz = v; });

/* ── Resize canvas to fill right pane ── */
const rightPane = document.getElementById('right-pane');

function resizeCanvas() {
  canvas.width  = rightPane.clientWidth  - 40;
  canvas.height = rightPane.clientHeight - 40;
  draw();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load',   resizeCanvas);

/* ── Draw current image to canvas ── */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!canvasImg) return;

  const iw = canvasImg.naturalWidth  * scale;
  const ih = canvasImg.naturalHeight * scale;
  const x  = offsetX + (canvas.width  - iw) / 2;
  const y  = offsetY + (canvas.height - ih) / 2;
  ctx.drawImage(canvasImg, x, y, iw, ih);
}

/* ── Render DOT source ── */
function renderCircuit() {
  const dot = document.getElementById('netlistBox').value.trim();

  hideError();

  if (!dot) {
    showError('DOT source is empty.');
    return;
  }
  if (!viz) {
    showError('Viz.js is not ready yet — please try again.');
    return;
  }

  try {
    const svgEl = viz.renderSVGElement(dot);
    const serialized = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([serialized], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      canvasImg = img;
      fitGraph();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      showError('Failed to load rendered SVG.');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  } catch (e) {
    showError(e.message || 'Failed to parse DOT source.');
  }
}

/* ── Fit graph inside canvas ── */
function fitGraph() {
  if (!canvasImg) return;
  const pad = 20;
  const scaleX = (canvas.width  - pad * 2) / canvasImg.naturalWidth;
  const scaleY = (canvas.height - pad * 2) / canvasImg.naturalHeight;
  scale   = Math.min(scaleX, scaleY, 1);
  offsetX = 0;
  offsetY = 0;
  draw();
}

/* ── Reset to example DOT ── */
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
  hideError();
}

/* ── Export canvas as PNG ── */
function exportPNG() {
  if (!canvasImg) {
    showError('Nothing to export — render a graph first.');
    return;
  }
  const link = document.createElement('a');
  link.download = 'graph.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ── Pan with mouse drag ── */
canvas.addEventListener('mousedown', e => {
  dragging  = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragOX    = offsetX;
  dragOY    = offsetY;
  canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', e => {
  if (!dragging) return;
  offsetX = dragOX + (e.clientX - dragStartX);
  offsetY = dragOY + (e.clientY - dragStartY);
  draw();
});

window.addEventListener('mouseup', () => {
  dragging = false;
  canvas.style.cursor = 'grab';
});

canvas.style.cursor = 'grab';

/* ── Zoom with scroll wheel ── */
canvas.addEventListener('wheel', e => {
  e.preventDefault();

  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (canvasImg) {
    const cx = (canvas.width  - canvasImg.naturalWidth  * scale) / 2 + offsetX;
    const cy = (canvas.height - canvasImg.naturalHeight * scale) / 2 + offsetY;
    offsetX = mx - (mx - cx) * factor;
    offsetY = my - (my - cy) * factor;
  }

  scale = Math.min(Math.max(scale * factor, 0.05), 10);
  draw();
}, { passive: false });

/* ── Keyboard shortcut: Ctrl/Cmd + Enter to render ── */
document.getElementById('netlistBox').addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    renderCircuit();
  }
});

/* ── Error helpers ── */
function showError(msg) {
  errEl.textContent = msg;
  errEl.style.display = 'block';
}

function hideError() {
  errEl.style.display = 'none';
}

/* ── Load example on startup ── */
resetExample();