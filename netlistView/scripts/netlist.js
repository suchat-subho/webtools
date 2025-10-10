const canvas = document.getElementById("circuitCanvas");
const ctx = canvas.getContext("2d");
const netlistBox = document.getElementById("netlistBox");

let zoom = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastX, lastY;

const DEFAULT_NETLIST = `* Example Netlist with Transistor and 555 Timer
V1 N001 0 DC 5
R1 N001 N002 10k
C1 N002 0 10u
Q1 N002 N003 N004 NPN
R2 N003 0 4.7k
L1 N004 0 2mH
D1 N004 N002 1N4148
U1 N005 N006 N007 N008 N009 N010 N011 N012 555
`;

let nodePositions = {}; // Stores custom node positions
resetExample();

function resetExample() {
  netlistBox.value = DEFAULT_NETLIST;
  nodePositions = {}; // Reset manual positions
  renderCircuit();
}

// Parse netlist
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

  // Ground node at last
  const nodeList = Array.from(nodes);
  if (nodeList.includes("0")) {
    nodeList.splice(nodeList.indexOf("0"), 1);
    nodeList.push("0");
  }

  // Initialize positions if not set
  const nodeGapY = 100;
  const startY = 100;
  nodeList.forEach((node, i) => {
    if (!nodePositions[node]) {
      nodePositions[node] = { x: 200 + i * 200, y: startY + i * nodeGapY };
    }
  });

  return { elements, nodes: nodeList };
}

// Draw circuit
function renderCircuit() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoom, zoom);

  const { elements, nodes } = parseNetlist(netlistBox.value);

  // Draw grid
  drawGrid(50, "#eee");

  // Draw nodes
  nodes.forEach(node => {
    const pos = nodePositions[node];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(node, pos.x, pos.y - 10);
  });

  // Draw components
  elements.forEach(el => {
    const termNodes = el.nodes || [el.n1, el.n2]; // generalize nodes array
    const nPos = termNodes.map(n => nodePositions[n] ?? {x:100, y:100});

    // Calculate component center
    const cx = nPos.reduce((sum, p) => sum + p.x, 0) / nPos.length;
    const cy = nPos.reduce((sum, p) => sum + p.y, 0) / nPos.length;

    // Draw wires to each terminal
    nPos.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw symbol based on terminal count
    if (termNodes.length === 2) {
      // rectangle for 2-terminal components
      ctx.beginPath();
      ctx.rect(cx - 20, cy - 10, 40, 20);
      ctx.stroke();
    } else if (termNodes.length === 3 && el.type === "NPN") {
      // simple triangle for transistor
      ctx.beginPath();
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx - 15, cy + 15);
      ctx.lineTo(cx + 15, cy + 15);
      ctx.closePath();
      ctx.stroke();
    } else if (termNodes.length > 3) {
      // IC box
      const w = 80, h = 20 + termNodes.length * 10;
      ctx.strokeRect(cx - w/2, cy - h/2, w, h);
      // draw pins on left and right
      const leftCount = Math.floor(termNodes.length/2);
      for (let i = 0; i < leftCount; i++) {
        const py = cy - h/2 + (i+1)*(h/(leftCount+1));
        ctx.beginPath();
        ctx.moveTo(cx - w/2, py);
        ctx.lineTo(cx - w/2 - 10, py);
        ctx.stroke();
      }
      for (let i = leftCount; i < termNodes.length; i++) {
        const py = cy - h/2 + (i-leftCount+1)*(h/(termNodes.length-leftCount+1));
        ctx.beginPath();
        ctx.moveTo(cx + w/2, py);
        ctx.lineTo(cx + w/2 + 10, py);
        ctx.stroke();
      }
    }

    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(el.name, cx, cy - 12);
    if (el.value) ctx.fillText(el.value, cx, cy + 20);
  });

  ctx.restore();
}

// Grid
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

// -----------------
// Mouse events
// -----------------
let draggedNode = null;

// Node dragging takes priority
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left - offsetX) / zoom;
  const mouseY = (e.clientY - rect.top - offsetY) / zoom;

  // Check if any node is clicked
  const { nodes } = parseNetlist(netlistBox.value);
  for (const node of nodes) {
    const pos = nodePositions[node];
    const dx = mouseX - pos.x;
    const dy = mouseY - pos.y;
    if (Math.sqrt(dx*dx + dy*dy) < 10) {
      draggedNode = node;
      canvas.style.cursor = "grabbing";
      return;
    }
  }

  // If no node clicked, start panning
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mousemove", (e) => {
  if (draggedNode) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offsetX) / zoom;
    const mouseY = (e.clientY - rect.top - offsetY) / zoom;
    nodePositions[draggedNode].x = mouseX;
    nodePositions[draggedNode].y = mouseY;
    renderCircuit();
  } else if (isDragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    offsetX += dx;
    offsetY += dy;
    renderCircuit();
  }
});

canvas.addEventListener("mouseup", () => {
  draggedNode = null;
  isDragging = false;
  canvas.style.cursor = "grab";
});

canvas.addEventListener("mouseleave", () => {
  draggedNode = null;
  isDragging = false;
  canvas.style.cursor = "grab";
});

// Zoom
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const scaleFactor = 1.1;
  if (e.deltaY < 0) zoom *= scaleFactor;
  else zoom /= scaleFactor;
  zoom = Math.min(Math.max(zoom, 0.2), 5);
  renderCircuit();
});

// Export
function exportPNG() {
  const link = document.createElement("a");
  link.download = "circuit.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
