// script.js - full updated file with Export/Import JSON

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;

// drawing state
let drawing = false, selecting = false, startX=0, startY=0;
let currentTool = 'pen';
let penColor = '#000';
let bgColor = '#fff';

// pages/history
let history = {};            // { pageId: { label: 'Page 1', bg: '#fff', steps: [dataUrl,...] } }
let currentPage = '1';
let pageCounter = 1;
const MAX_HISTORY = 25;

// UI refs
const tabs = document.getElementById('tabs');

function resizeCanvas() {
  // account for tools width and tabs height
  const toolsW = document.querySelector('.tools').offsetWidth;
  const tabsH = document.querySelector('.tabs').offsetHeight;
  canvas.width = (window.innerWidth - toolsW) * dpr;
  canvas.height = (window.innerHeight - tabsH) * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  redraw();
}
window.addEventListener('resize', resizeCanvas);

// initialize simple single page
function initPage(id, label) {
  label = label || `Page ${id}`;
  if (!history[id]) history[id] = { label, bg: bgColor, steps: [] };
}
function ensureTabExists(id, label) {
  if (!document.querySelector(`.tab[data-id="${id}"]`)) {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.id = id;
    tab.innerHTML = `${label}<span class="close">×</span>`;
    // insert before addPage button
    const addBtn = document.getElementById('addPage');
    tabs.insertBefore(tab, addBtn);
  }
}

function redraw() {
  // fill background with page bg
  const page = history[currentPage];
  const bg = page?.bg || bgColor;
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);

  // draw latest snapshot if present
  if (page && page.steps && page.steps.length) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width/dpr, canvas.height/dpr);
    };
    img.src = page.steps[page.steps.length - 1];
  }
}

// store current canvas snapshot into page history
function pushHistory() {
  const png = canvas.toDataURL('image/png');
  const page = history[currentPage];
  if (!page) return;
  if (!page.steps) page.steps = [];
  if (page.steps.length >= MAX_HISTORY) page.steps.shift();
  page.steps.push(png);
}

// initial setup
resizeCanvas();
initPage('1', 'Page 1');
ensureTabExists('1','Page 1');
document.querySelector('.tab[data-id="1"]').classList.add('active');
pushHistory();

// Pointer drawing & selection
canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);

  if (currentTool === 'pen') {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = ctx.lineCap = 'round';
  } else if (currentTool === 'eraser') {
    selecting = true;
    startX = x; startY = y;
  }
});

canvas.addEventListener('pointermove', e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);

  if (drawing && currentTool==='pen') {
    ctx.lineTo(x,y);
    ctx.stroke();
  } else if (selecting && currentTool==='eraser') {
    // realtime selection rectangle preview: redraw base and overlay rect
    redraw();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.setLineDash([6]);
    ctx.strokeRect(startX, startY, x - startX, y - startY);
    ctx.setLineDash([]);
  }
});

canvas.addEventListener('pointerup', e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);

  if (drawing) {
    drawing = false;
    ctx.closePath();
    pushHistory();
  } else if (selecting) {
    selecting = false;
    const w = x - startX, h = y - startY;
    // fill selection area with page background color (eraser effect)
    const page = history[currentPage];
    const fillBg = page?.bg || bgColor;
    ctx.fillStyle = fillBg;
    ctx.fillRect(startX, startY, w, h);
    pushHistory();
  }
});

// UI - basic tools
document.getElementById('penBtn').onclick = () => { currentTool='pen'; };
document.getElementById('eraserBtn').onclick = () => { currentTool='eraser'; };
document.getElementById('clearBtn').onclick = () => {
  const page = history[currentPage];
  ctx.fillStyle = page?.bg || bgColor;
  ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
  pushHistory();
};
document.getElementById('undoBtn').onclick = () => {
  const page = history[currentPage];
  if (!page || !page.steps || page.steps.length <= 1) return;
  page.steps.pop();
  // redraw using last snapshot
  redraw();
};

// color pickers
document.querySelectorAll('.color').forEach(c => {
  c.addEventListener('click', () => {
    penColor = c.style.background;
    currentTool = 'pen';
  });
});
document.querySelectorAll('.bgcolor').forEach(c => {
  c.addEventListener('click', () => {
    const color = c.style.background;
    bgColor = color;
    // set on current page
    if (!history[currentPage]) history[currentPage] = { label:`Page ${currentPage}`, bg: color, steps: [] };
    history[currentPage].bg = color;
    redraw();
    pushHistory();
  });
});

// PDF export (uses global jspdf script included in HTML)
document.getElementById('pdfBtn').onclick = () => {
  // require jspdf included via <script src=".../jspdf.umd.min.js"></script>
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('jsPDF not loaded. Please include jspdf.umd.min.js in your HTML.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const ids = Object.keys(history);
  let addedAny = false;

  ids.forEach((id, idx) => {
    const page = history[id];
    const snapshot = (page && page.steps && page.steps.length) ? page.steps[page.steps.length - 1] : null;
    if (!snapshot) return; // skip empty pages
    if (idx > 0 && addedAny) pdf.addPage();
    // Fit image into A4 conserving its aspect ratio is more complex; for now stretch to A4
    pdf.addImage(snapshot, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    addedAny = true;
  });

  if (!addedAny) {
    alert('No content to export.');
    return;
  }
  pdf.save('drawing.pdf');
};

// Tab management
tabs.addEventListener('click', e => {
  const t = e.target.closest('.tab');
  if (t && !e.target.classList.contains('close')) {
    // select
    document.querySelectorAll('.tab').forEach(tb => tb.classList.remove('active'));
    t.classList.add('active');
    currentPage = t.dataset.id;
    resizeCanvas();
    initPage(currentPage);
  }
});

document.getElementById('addPage').onclick = () => {
  pageCounter++;
  const id = String(pageCounter);
  const label = `Page ${id}`;
  // create tab
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.dataset.id = id;
  tab.innerHTML = `${label}<span class="close">×</span>`;
  tabs.insertBefore(tab, document.getElementById('addPage'));
  // init history and switch
  initPage(id, label);
  document.querySelectorAll('.tab').forEach(tb => tb.classList.remove('active'));
  tab.classList.add('active');
  currentPage = id;
  resizeCanvas();
  pushHistory();
};

// rename on dblclick
tabs.addEventListener('dblclick', e => {
  const t = e.target.closest('.tab');
  if (t && !e.target.classList.contains('close')) {
    const currentText = t.childNodes[0].textContent.trim();
    const name = prompt('Rename page:', currentText);
    if (name) {
      // update label in DOM and history meta
      t.childNodes[0].textContent = name;
      if (history[t.dataset.id]) history[t.dataset.id].label = name;
    }
  }
});

// close tab
tabs.addEventListener('click', e => {
  if (e.target.classList.contains('close')) {
    const t = e.target.parentElement;
    const id = t.dataset.id;
    if (confirm('Delete this page?')) {
      delete history[id];
      t.remove();
      // switch to first tab
      const first = document.querySelector('.tab');
      if (first) {
        first.classList.add('active');
        currentPage = first.dataset.id;
        resizeCanvas();
        redraw();
      } else {
        // no tabs remain — create a new blank one
        pageCounter = 0;
        document.getElementById('addPage').click();
      }
    }
  }
});

/* -----------------------
   Export / Import JSON
   -----------------------
   Export will create a JSON object:
   {
     pageCounter: <n>,
     currentPage: <id>,
     pages: {
       id1: { label, bg, steps: [dataURLs...] },
       ...
     }
   }
*/

// Export
function exportBoard() {
  const state = {
    pageCounter,
    currentPage,
    pages: {}
  };
  Object.keys(history).forEach(id => {
    // copy only serializable data
    const p = history[id];
    state.pages[id] = {
      label: p.label || `Page ${id}`,
      bg: p.bg || '#ffffff',
      steps: (p.steps && p.steps.slice()) || []
    };
  });

  const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whiteboard_backup.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Import
function importBoardFile(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const obj = JSON.parse(evt.target.result);
      loadState(obj);
      alert('Import successful.');
    } catch (err) {
      alert('Invalid JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function clearAllTabsDOM() {
  // remove existing tabs except addPage placeholder
  document.querySelectorAll('.tab').forEach(tb => tb.remove());
}

function loadState(state) {
  // basic validation
  if (!state || !state.pages) {
    alert('Invalid state file.');
    return;
  }
  // clear current data
  history = {};
  clearAllTabsDOM();

  // rebuild pages/tabs
  Object.keys(state.pages).forEach((id) => {
    const p = state.pages[id];
    // ensure steps exist as array
    history[id] = { label: p.label || `Page ${id}`, bg: p.bg || '#ffffff', steps: Array.isArray(p.steps) ? p.steps.slice() : [] };
    // create tab DOM
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.id = id;
    tab.innerHTML = `${history[id].label}<span class="close">×</span>`;
    tabs.insertBefore(tab, document.getElementById('addPage'));
  });

  // restore pageCounter & currentPage safely
  pageCounter = state.pageCounter || Math.max(1, ...Object.keys(history).map(n => Number(n)));
  currentPage = state.currentPage && history[state.currentPage] ? state.currentPage : Object.keys(history)[0];

  // activate first/current tab
  document.querySelectorAll('.tab').forEach(tb => tb.classList.remove('active'));
  const activeTab = document.querySelector(`.tab[data-id="${currentPage}"]`) || document.querySelector('.tab');
  if (activeTab) activeTab.classList.add('active');

  // redraw canvas for current page (the redraw function loads last snapshot)
  resizeCanvas();
}

// wire export/import UI
document.getElementById('exportBtn').addEventListener('click', exportBoard);
const importFileEl = document.getElementById('importFile');
document.getElementById('importBtn').addEventListener('click', () => importFileEl.click());
importFileEl.addEventListener('change', (ev) => {
  if (ev.target.files && ev.target.files[0]) importBoardFile(ev.target.files[0]);
});
