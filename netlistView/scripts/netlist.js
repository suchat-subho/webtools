const canvas = document.getElementById("circuitCanvas");
const ctx = canvas.getContext("2d");
const netlistBox = document.getElementById("netlistBox");

let zoom = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastX, lastY;

const DEFAULT_NETLIST = `* Example Netlist
V1 N001 0 DC 5
R1 N001 N002 10k
C1 N002 0 10u
R2 N002 N003 4.7k
L1 N003 0 2mH
D1 N003 N002 1N4148
`;

resetExample();

function resetExample() {
  netlistBox.value = DEFAULT_NETLIST;
  renderCircuit();
}

// Parse the netlist into elements and nodes
function parseNetlist(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("*"));
  const elements = [];
  const nodes = new Set();

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;
    const [name, n1, n2, ...rest] = parts;
    const value = rest.join(" ");
    elements.push({ name, n1, n2, value });
    nodes.add(n1);
    nodes.add(n2);
  }

  // Ensure ground is last
  const nodeList = Array.from(nodes);
  if (nodeList.includes("0")) {
    nodeList.splice(nodeList.indexOf("0"), 1);
    nodeList.push("0");
  }
  return { elements, nodes: nodeList };
}

// Draw everything
function renderCircuit() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoom, zoom);

  const { elements, nodes } = parseNetlist(netlistBox.value);

  const nodeX = {};
  const nodeY = {};
  const nodeGapY = 100;
  const startY = 100;

  nodes.forEach((node, i) => {
    nodeX[node] = 200 + i * 200;
    nodeY[node] = startY + i * nodeGapY;
  });

  // Draw grid
  drawGrid(50, "#eee");

  // Draw nodes
  nodes.forEach(node => {
    const x = nodeX[node];
    const y = nodeY[node];
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(node, x, y - 10);
  });

  // Draw components
  elements.forEach(el => {
    const x1 = nodeX[el.n1] ?? 100;
    const y1 = nodeY[el.n1] ?? 100;
    const x2 = nodeX[el.n2] ?? 300;
    const y2 = nodeY[el.n2] ?? 100;

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(cx - 20, cy);
    ctx.moveTo(cx + 20, cy);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Component box
    ctx.beginPath();
    ctx.rect(cx - 20, cy - 10, 40, 20);
    ctx.stroke();

    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(el.name, cx, cy - 12);
    if (el.value) ctx.fillText(el.value, cx, cy + 20);
  });

  ctx.restore();
}

// Draw grid background
function drawGrid(spacing, color) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -offsetX / zoom % spacing; x < w / zoom; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h / zoom);
  }
  for (let y = -offsetY / zoom % spacing; y < h / zoom; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(w / zoom, y);
  }
  ctx.stroke();
}

// Mouse drag for panning
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    offsetX += dx;
    offsetY += dy;
    renderCircuit();
  }
});

// Zoom with mouse wheel
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const scaleFactor = 1.1;
  if (e.deltaY < 0) zoom *= scaleFactor;
  else zoom /= scaleFactor;
  zoom = Math.min(Math.max(zoom, 0.2), 5);
  renderCircuit();
});

// Export to PNG
function exportPNG() {
  const link = document.createElement("a");
  link.download = "circuit.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
