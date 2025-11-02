/* script.js */
(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let history = [];
  const MAX_HISTORY = 25;

  function resize() {
    const availableWidth = canvas.parentElement.clientWidth * 0.95;
    const availableHeight = canvas.parentElement.clientHeight * 0.9;
    canvas.width = availableWidth * dpr;
    canvas.height = availableHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, availableWidth, availableHeight);
    if (history.length) {
      const img = new Image();
      img.src = history[history.length - 1];
      img.onload = () => ctx.drawImage(img, 0, 0, availableWidth, availableHeight);
    }
  }

  window.addEventListener('resize', resize);
  resize();

  function pushHistory() {
    if (history.length >= MAX_HISTORY) history.shift();
    history.push(canvas.toDataURL('image/png'));
  }

  pushHistory();

  let drawing = false;
  let last = { x: 0, y: 0 };

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    const p = getPointerPos(ev);
    last = p;
    drawing = true;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (!drawing) return;
    const p = getPointerPos(ev);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });

  canvas.addEventListener('pointerup', () => {
    if (!drawing) return;
    drawing = false;
    ctx.closePath();
    pushHistory();
  });

  const clearBtn = document.getElementById('top-clear');
  const undoBtn = document.getElementById('top-undo');
  const pdfBtn = document.getElementById('top-pdf');

  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    pushHistory();
  });

  function undo() {
    if (history.length <= 1) return;
    history.pop();
    const data = history[history.length - 1];
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };
    img.src = data;
  }

  undoBtn.addEventListener('click', undo);

  pdfBtn.addEventListener('click', () => {
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(jsPDF => {
      const { jsPDF: PDF } = jsPDF;
      const pdf = new PDF();
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save('drawing.pdf');
    });
  });
})();