const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;
let drawing = false, selecting = false, startX=0, startY=0;
let currentTool = 'pen';
let penColor = '#000';
let bgColor = '#fff';
let history = {}, currentPage = '1';
let pageCounter = 1;
const MAX_HISTORY = 25;

function resizeCanvas() {
  canvas.width = (window.innerWidth - document.querySelector('.tools').offsetWidth) * dpr;
  canvas.height = window.innerHeight * dpr - document.querySelector('.tabs').offsetHeight * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  redraw();
}
window.addEventListener('resize', resizeCanvas);

function initPage(id){
  history[id] = history[id] || { bg:bgColor, steps:[] };
  redraw();
}

function redraw(){
  ctx.fillStyle = history[currentPage]?.bg || bgColor;
  ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
  if (history[currentPage]?.steps?.length){
    const img = new Image();
    img.src = history[currentPage].steps.slice(-1)[0];
    img.onload = ()=>ctx.drawImage(img,0,0,canvas.width/dpr,canvas.height/dpr);
  }
}
resizeCanvas();
initPage('1');

function pushHistory(){
  const data = canvas.toDataURL();
  const steps = history[currentPage].steps;
  if (steps.length >= MAX_HISTORY) steps.shift();
  steps.push(data);
}

canvas.addEventListener('pointerdown', e=>{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  if(currentTool==='pen'){
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = ctx.lineCap = 'round';
  } else if(currentTool==='eraser'){
    selecting = true;
    startX=x; startY=y;
  }
});

canvas.addEventListener('pointermove', e=>{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  if(drawing && currentTool==='pen'){
    ctx.lineTo(x,y);
    ctx.stroke();
  } else if(selecting && currentTool==='eraser'){
    redraw();
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    ctx.setLineDash([6]);
    ctx.strokeRect(startX,startY,x-startX,y-startY);
    ctx.setLineDash([]);
  }
});

canvas.addEventListener('pointerup', e=>{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  if(drawing){
    drawing=false;
    ctx.closePath();
    pushHistory();
  } else if(selecting){
    selecting=false;
    const w=x-startX, h=y-startY;
    ctx.fillStyle = history[currentPage].bg;
    ctx.fillRect(startX,startY,w,h);
    pushHistory();
  }
});

document.getElementById('penBtn').onclick = ()=>currentTool='pen';
document.getElementById('eraserBtn').onclick = ()=>currentTool='eraser';
document.getElementById('clearBtn').onclick = ()=>{
  ctx.fillStyle = history[currentPage].bg;
  ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
  pushHistory();
};
document.getElementById('undoBtn').onclick = ()=>{
  const steps = history[currentPage].steps;
  if(steps.length<=1) return;
  steps.pop();
  redraw();
};

document.querySelectorAll('.color').forEach(c=>{
  c.addEventListener('click',()=>{
    penColor = c.style.background;
    currentTool='pen';
  });
});
document.querySelectorAll('.bgcolor').forEach(c=>{
  c.addEventListener('click',()=>{
    bgColor = c.style.background;
    history[currentPage].bg = bgColor;
    redraw();
    pushHistory();
  });
});

document.getElementById('pdfBtn').onclick = ()=>{
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(jsPDF=>{
    const { jsPDF:PDF } = jsPDF;
    const pdf = new PDF();
    const ids = Object.keys(history);
    ids.forEach((id,i)=>{
      const img = new Image();
      img.src = history[id].steps.slice(-1)[0];
      if(i>0) pdf.addPage();
      pdf.addImage(img.src,'PNG',0,0,210,297);
    });
    pdf.save('drawing.pdf');
  });
};

// Tab Management
const tabs = document.getElementById('tabs');
tabs.addEventListener('click', e=>{
  const t = e.target.closest('.tab');
  if(t && !e.target.classList.contains('close')){
    document.querySelectorAll('.tab').forEach(tb=>tb.classList.remove('active'));
    t.classList.add('active');
    currentPage = t.dataset.id;
    resizeCanvas();
    initPage(currentPage);
  }
});

document.getElementById('addPage').onclick = ()=>{
  pageCounter++;
  const id = String(pageCounter);
  const tab = document.createElement('div');
  tab.className='tab';
  tab.dataset.id=id;
  tab.innerHTML=`Page ${id}<span class="close">×</span>`;
  tabs.insertBefore(tab, document.getElementById('addPage'));
  initPage(id);
  document.querySelectorAll('.tab').forEach(tb=>tb.classList.remove('active'));
  tab.classList.add('active');
  currentPage=id;
  resizeCanvas();
};

tabs.addEventListener('dblclick', e=>{
  const t=e.target.closest('.tab');
  if(t && !e.target.classList.contains('close')){
    const name=prompt("Rename page:", t.textContent.replace('×','').trim());
    if(name) t.childNodes[0].textContent=name;
  }
});
tabs.addEventListener('click', e=>{
  if(e.target.classList.contains('close')){
    const t=e.target.parentElement;
    const id=t.dataset.id;
    if(confirm("Delete this page?")){
      delete history[id];
      t.remove();
      if(id===currentPage){
        const first=document.querySelector('.tab');
        if(first){
          first.classList.add('active');
          currentPage=first.dataset.id;
          resizeCanvas();
          redraw();
        }
      }
    }
  }
});
