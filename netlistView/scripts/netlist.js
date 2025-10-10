document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('circuitCanvas');
  const ctx = canvas.getContext('2d');
  const netlistInput = document.getElementById('netlistBox');

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let startX, startY;

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
    const gridSize = 20;
    ctx.strokeStyle = '#eee';
    ctx.beginPath();
    for (let x = offsetX % gridSize; x < canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = offsetY % gridSize; y < canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }

  function parseNetlist(text) {
    return text.trim().split(/\\n+/).map(line => {
      const parts = line.trim().split(/\\s+/);
      return { name: parts[0], node1: parts[1], node2: parts[2] };
    });
  }

  function drawCircuit(netlist) {
    clearCanvas();
    drawGrid();
    let x = 50 + offsetX;
    let y = 50 + offsetY;
    for (const comp of netlist) {
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, 60, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(comp.name, x + 5, y + 15);
      y += 40;
    }
  }

  // Functions triggered by buttons in HTML
  window.renderCircuit = function () {
    const netlist = parseNetlist(netlistInput.value);
    drawCircuit(netlist);
  };

  window.resetExample = function () {
    netlistInput.value = `R1 1 2\nC1 2 0\nV1 1 0`;
    renderCircuit();
  };

  window.exportPNG = function () {
    const link = document.createElement('a');
    link.download = 'circuit.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.offsetX - offsetX;
    startY = e.offsetY - offsetY;
  });

  canvas.addEventListener('mousemove', e => {
    if (isDragging) {
      offsetX = e.offsetX - startX;
      offsetY = e.offsetY - startY;
      const netlist = parseNetlist(netlistInput.value);
      drawCircuit(netlist);
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  drawGrid();
  window.resetExample();
});
