const SIZE = 11;
const grid = document.getElementById('grid');
const poolDiv = document.getElementById('pool');

let history = [];
let pool = [];
let draggedToken = null;
let LOG_LEVEL = 2;

// Event listeners
document.getElementById('logLevel').addEventListener('change', setLogLevel);
document.getElementById('undoButton').addEventListener('click', undo);
document.getElementById('loadButton').addEventListener('click', loadFromText);
document.getElementById('checkButton').addEventListener('click', checkGrid);

function log(level, ...args) {
  if(level <= LOG_LEVEL) console.log(...args);
}

function setLogLevel() {
  LOG_LEVEL = parseInt(document.getElementById('logLevel').value);
  log(2, 'Log level:', LOG_LEVEL);
}

function createGrid() {
  grid.innerHTML = '';

  for (let i = 0; i < SIZE; i++) {
    const tr = document.createElement('tr');

    for (let j = 0; j < SIZE; j++) {
      const td = document.createElement('td');
      td.classList.add('active');

      const input = document.createElement('input');
      input.maxLength = 2;
      td.appendChild(input);

      td.ondragover = e => e.preventDefault();

      td.ondrop = e => {
        e.preventDefault();
        log(3, 'drop', draggedToken?.dataset?.val);

        if (!td.classList.contains('active')) return;
        if (!draggedToken) return;

        saveState(input, input.value, draggedToken.dataset.val);

        input.value = draggedToken.dataset.val;
        draggedToken.remove();
        draggedToken = null;

        updateTextbox();
      };

      tr.appendChild(td);
    }

    grid.appendChild(tr);
  }
}

createGrid();

function loadFromText() {
  log(2, 'Loading grid');

  const text = document.getElementById('gridInput').value.trim();
  const [gridPart, poolRaw] = text.split('<');
  const poolPart = poolRaw ? poolRaw.replace('>', '').trim() : '';

  const rows = gridPart.trim().split('\n');

  rows.forEach((row, i) => {
    const cells = row.trim().split(/\s+/);

    cells.forEach((val, j) => {
      const td = grid.rows[i].cells[j];
      const input = td.querySelector('input');

      td.classList.remove('unused', 'active');
      input.classList.remove('fixed');

      if (val === '.') {
        td.classList.add('unused');
        input.value = '';
        input.disabled = true;
      } else if (val === 'B') {
        td.classList.add('active');
        input.value = '';
        input.disabled = false;
      } else {
        td.classList.add('active');
        input.value = val;
        input.disabled = true;
        input.classList.add('fixed');
      }
    });
  });

  pool = poolPart ? poolPart.split(/\s+/).filter(x => x) : [];
  renderPool();
  updateTextbox();
}

function renderPool() {
  log(2, 'Render pool', pool);

  poolDiv.innerHTML = '';

  pool.forEach(val => {
    const el = document.createElement('div');
    el.className = 'token';
    el.textContent = val;
    el.draggable = true;
    el.dataset.val = val;

    el.ondragstart = () => draggedToken = el;

    poolDiv.appendChild(el);
  });
}

function saveState(input, prevVal, tokenVal) {
  history.push({ input, prevVal, tokenVal });
}

function undo() {
  log(2, 'Undo');

  const last = history.pop();
  if (!last) return;

  last.input.value = last.prevVal;

  if (last.tokenVal) {
    const el = document.createElement('div');
    el.className = 'token';
    el.textContent = last.tokenVal;
    el.draggable = true;
    el.dataset.val = last.tokenVal;

    el.ondragstart = () => draggedToken = el;

    poolDiv.appendChild(el);
  }

  updateTextbox();
}

function updateTextbox() {
  let lines = [];

  for (let i = 0; i < SIZE; i++) {
    let row = [];

    for (let j = 0; j < SIZE; j++) {
      const td = grid.rows[i].cells[j];
      const input = td.querySelector('input');

      if (td.classList.contains('unused')) row.push('.');
      else if (input.value === '') row.push('B');
      else row.push(input.value);
    }

    lines.push(row.join('\t'));
  }

  const remaining = Array.from(poolDiv.children).map(t => t.dataset.val);
  const output = lines.join('\n') + '\n\n<' + remaining.join(' ') + '>';

  document.getElementById('gridInput').value = output;
}

function checkGrid() {
  const current = document.getElementById('gridInput').value;
  log(2, 'Check button clicked. Current grid + pool:\n', current);
  alert('Check complete! Open console for details.');
}