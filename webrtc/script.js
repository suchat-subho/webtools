/* ===========================================
   Canvas Drawing + P2P Whiteboard
=========================================== */

/* ---------- Canvas Drawing ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let penColor = '#fff';
let bgColor = '#000';
let pages = [{ history: [] }];
let currentPage = 0;
let last = { x: 0, y: 0 };
let dpr = window.devicePixelRatio || 1;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  // Make canvas drawing use CSS pixels coordinates:
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redraw();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ensure initial blank snapshot so undo/redraw work
function ensureInitialHistory() {
  const page = pages[currentPage];
  if (!page.history || page.history.length === 0) {
    // fill background and push an initial image
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.restore();
    page.history = page.history || [];
    page.history.push(canvas.toDataURL('image/png'));
  }
}
ensureInitialHistory();

function pushHistory() {
  const page = pages[currentPage];
  page.history = page.history || [];
  page.history.push(canvas.toDataURL('image/png'));
  if (page.history.length > 25) page.history.shift();
}

function redraw() {
  // draw background
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  ctx.restore();

  const page = pages[currentPage];
  if (page && page.history && page.history.length) {
    const img = new Image();
    img.onload = () => {
      // draw using CSS pixel dimensions
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };
    img.src = page.history[page.history.length - 1];
  }
}

// pointer helpers
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  // use clientX/clientY and return CSS pixel coords (not scaled)
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', e => {
  // capture so pointerup still fires outside canvas
  canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  drawing = true;
  const p = getPointerPos(e);
  last = p;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.strokeStyle = penColor;
  ctx.lineWidth = 3;
  ctx.lineJoin = ctx.lineCap = 'round';
});

canvas.addEventListener('pointermove', ev => {
  if (!drawing) return;
  const p = getPointerPos(ev);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
  // no immediate send; auto-sync sends every second when connected
});

function endStroke(e) {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
  pushHistory();
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('pointerout', e => { /* don't force end on out */ });

/* ---------- Controls (left pane) ---------- */
document.getElementById('clearBtn').onclick = () => {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  pushHistory();
};
document.getElementById('undoBtn').onclick = () => {
  const page = pages[currentPage];
  if (page.history && page.history.length > 1) {
    page.history.pop();
    const img = new Image();
    img.src = page.history[page.history.length - 1];
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
  }
};
document.getElementById('addPageBtn').onclick = () => {
  pages.push({ history: [] });
  currentPage = pages.length - 1;
  updateTabs();
  // initialize and redraw
  ensureInitialHistory();
  redraw();
};
document.getElementById('downloadBtn').onclick = () => {
  import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js').then(jsPDF => {
    const { jsPDF: PDF } = jsPDF;
    const pdf = new PDF();
    pages.forEach((p, i) => {
      if (i > 0) pdf.addPage();
      const img = p.history && p.history.length ? p.history[p.history.length - 1] : canvas.toDataURL();
      pdf.addImage(img, 'PNG', 0, 0, 210, 297);
    });
    pdf.save('whiteboard.pdf');
  });
};

/* Tabs */
const pageTabs = document.getElementById('pageTabs');
function updateTabs() {
  pageTabs.innerHTML = '';
  pages.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.textContent = `Page ${i + 1}`;
    btn.className = i === currentPage ? 'active' : '';
    btn.onclick = () => { currentPage = i; updateTabs(); redraw(); };
    pageTabs.appendChild(btn);
  });
}
updateTabs();

/* Colors */
const colorTable = document.getElementById('colorTable');
['#fff','#f00','#0f0','#00f','#ff0','#0ff','#f0f','#888'].forEach(c => {
  const el = document.createElement('div');
  el.style.background = c;
  el.onclick = () => { penColor = c; };
  colorTable.appendChild(el);
});
const bgTable = document.getElementById('bgTable');
['#000','#111','#222','#333'].forEach(c => {
  const el = document.createElement('div');
  el.style.background = c;
  el.onclick = () => { bgColor = c; redraw(); };
  bgTable.appendChild(el);
});

/* ===========================================
   WebRTC (sender/receiver style, reliable)
   Uses JSON offer/answer; waits for ICE gathering
=========================================== */

/* UI elements */
const settingsBtn = document.getElementById('settingsBtn');
const modal = document.getElementById('connectionModal');
const closeModal = document.getElementById('closeModal');
const statusEl = document.getElementById('connStatus');
const indicator = document.getElementById('clientIndicator');
const serverBtn = document.getElementById('serverModeBtn');
const clientBtn = document.getElementById('clientModeBtn');
const serverSection = document.getElementById('serverSection');
const clientSection = document.getElementById('clientSection');
const offerOut = document.getElementById('offerOut');
const answerIn = document.getElementById('answerIn');
const offerIn = document.getElementById('offerIn');
const answerOut = document.getElementById('answerOut');

let pc = null, dc = null, role = null;

/* UI show/hide */
settingsBtn.onclick = () => { modal.style.display = 'block'; modal.setAttribute('aria-hidden','false'); };
closeModal.onclick = () => { modal.style.display = 'none'; modal.setAttribute('aria-hidden','true'); };
window.onclick = e => { if (e.target === modal) { modal.style.display = 'none'; modal.setAttribute('aria-hidden','true'); }};

function updateTitle(roleVal) {
  const titleEl = document.querySelector('.toolbar h1');
  if (!titleEl) return;
  if (roleVal === 'server') {
    document.title = 'Whiteboard - Server';
    titleEl.textContent = '🧠 Whiteboard — Server';
  } else if (roleVal === 'client') {
    document.title = 'Whiteboard - Client';
    titleEl.textContent = '🧠 Whiteboard — Client';
  } else {
    document.title = 'Whiteboard';
    titleEl.textContent = '🧠 Whiteboard';
  }
}

function logStatus(msg) {
  statusEl.textContent = 'Status: ' + msg;
  console.log('[RTC]', msg);
}

/* helper: wait for ICE gathering to finish so offer/answer contain candidates */
async function waitForIceGathering(pcInstance) {
  if (!pcInstance) return;
  if (pcInstance.iceGatheringState === "complete") return;
  await new Promise(resolve => {
    function check() {
      if (pcInstance.iceGatheringState === "complete") {
        pcInstance.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    }
    pcInstance.addEventListener("icegatheringstatechange", check);
  });
}

/* role selection */
serverBtn.onclick = () => {
  role = 'server';
  serverSection.classList.remove('hidden');
  clientSection.classList.add('hidden');
  updateTitle(role);
};
clientBtn.onclick = () => {
  role = 'client';
  clientSection.classList.remove('hidden');
  serverSection.classList.add('hidden');
  updateTitle(role);
};

/* ---------- SERVER: create offer ---------- */
document.getElementById('createOfferBtn').onclick = async () => {
  pc = new RTCPeerConnection();
  dc = pc.createDataChannel('board');

  dc.onopen = () => {
    updateTitle(role);
    logStatus('Channel open (' + role + ')');
    if (indicator) {
      indicator.classList.replace('disconnected', 'connected');
      indicator.textContent = role === 'server' ? 'Client: ✅ Connected' : 'Server: ✅ Connected';
    }
    if (role === 'server') startAutoSync();
  };

  dc.onclose = () => {
    if (indicator) {
      indicator.classList.replace('connected', 'disconnected');
      indicator.textContent = role === 'server' ? 'Client: ❌ Disconnected' : 'Server: ❌ Disconnected';
    }
    stopAutoSync();
  };

  dc.onmessage = e => {
    try { console.log('Client:', e.data); } catch (err) { console.warn(err); }
  };

  // Create offer and wait for ICE candidates to be gathered
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGathering(pc);
  offerOut.value = JSON.stringify(pc.localDescription);
  logStatus('Offer ready – copy to client');
};

/* ---------- SERVER: set answer ---------- */
document.getElementById('setAnswerBtn').onclick = async () => {
  try {
    const answer = JSON.parse(answerIn.value.trim());
    await pc.setRemoteDescription(answer);
    logStatus('Answer set – waiting for channel to open...');
  } catch (err) {
    alert('Invalid answer JSON');
    console.error(err);
  }
};

/* ---------- CLIENT: create answer from offer ---------- */
document.getElementById('createAnswerBtn').onclick = async () => {
  try {
    const offer = JSON.parse(offerIn.value.trim());
    await createAnswerFromOffer(offer);
  } catch (err) {
    alert('Invalid offer JSON');
    console.error(err);
  }
};

async function createAnswerFromOffer(offer) {
  pc = new RTCPeerConnection();

  pc.ondatachannel = e => {
    dc = e.channel;
    dc.onmessage = ev => {
      try { applyRemoteState(JSON.parse(ev.data)); } catch (err) { console.warn(err); }
    };
    dc.onopen = () => {
      logStatus('Channel open (client)');
      // client doesn't have server indicator element update (server has it)
    };
    dc.onclose = () => logStatus('Channel closed (client)');
  };

  // Set remote offer, create local answer, wait for ICE gather
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceGathering(pc);
  answerOut.value = JSON.stringify(pc.localDescription);
  logStatus('Answer ready – copy to server');
}

/* ---------- Sync (periodic) ---------- */
const oldPush = pushHistory;
pushHistory = function () {
  oldPush();
  // immediate send on push isn't needed because periodic sync sends updates.
};

function applyRemoteState(data) {
  if (!data) return;
  if (data.pages) {
    pages = data.pages;
    currentPage = data.currentPage;
    updateTabs();
  }
  if (data.currentImage) {
    const img = new Image();
    img.onload = () => {
      // draw image using CSS pixel coords — we setTransform with dpr so use CSS dims
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };
    img.src = data.currentImage;
  }
}

/* Send periodic updates to client (every 1 second) */
function startAutoSync() {
  if (window.autoSyncInterval) clearInterval(window.autoSyncInterval);
  window.autoSyncInterval = setInterval(() => {
    if (role === 'server' && dc && dc.readyState === 'open') {
      try {
        const data = {
          pages,
          currentPage,
          currentImage: canvas.toDataURL('image/png'),
        };
        dc.send(JSON.stringify(data));
        // console.log('[RTC] Sent periodic board update');
      } catch (e) {
        console.error('AutoSync send failed:', e);
      }
    }
  }, 1000);
}

function stopAutoSync() {
  if (window.autoSyncInterval) {
    clearInterval(window.autoSyncInterval);
    window.autoSyncInterval = null;
  }
}

/* ensure initial history exists on new pages */
(function init() {
  ensureInitialHistory();
  updateTabs();
})();
