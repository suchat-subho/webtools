let SIZE = 11;
const grid = document.getElementById('grid');
const poolDiv = document.getElementById('pool');

let history = [];
let pool = [];
let draggedToken = null;
let LOG_LEVEL = 2;

// Event listeners
//document.getElementById('logLevel').addEventListener('change', setLogLevel);
document.getElementById('undoButton').addEventListener('click', undo);
document.getElementById('loadButton').addEventListener('click', loadFromText);
document.getElementById("checkButton").addEventListener("click", check);
document.getElementById('setsize').addEventListener('change', setGamesize);
document.getElementById('setsize').addEventListener('click', setGamesize);
//document.getElementById('checkButton').addEventListener('click', checkGrid);

function setGamesize() {
  SIZE = parseInt(document.getElementById('setsize').value);
  //alert("ChangeSize="+SIZE);
  createGrid();
}

function log(level, ...args) {
  if(level <= LOG_LEVEL) console.log(...args);
}

function setLogLevel() {
  LOG_LEVEL = parseInt(document.getElementById('logLevel').value);
  log(2, 'Log level:', LOG_LEVEL);
}

function createColHeader() {
  const colHeader = document.getElementById('grid-col-header');
  colHeader.innerHTML = '';

  const tr = document.createElement('tr');

  for (let j = 0; j < SIZE; j++) {
    const td = document.createElement('td');
    td.textContent = j + 1;
    tr.appendChild(td);
  }

  colHeader.appendChild(tr);
}

function createRowHeader() {
  const rowHeader = document.getElementById('grid-row-header');
  rowHeader.innerHTML = '';

  for (let i = 0; i < SIZE; i++) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');

    td.textContent = i + 1;

    tr.appendChild(td);
    rowHeader.appendChild(tr);
  }
}

function createGrid() {
  createRowHeader();
  createColHeader();
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
function clearHighlights() {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const td = grid.rows[i].cells[j];
      td.classList.remove("error-cell");
    }
  }
}

function getCellValue(row, col) {
  let tab= document.getElementById('grid');
  console.log("Table:"& tab.innerHTML);
  let cell = tab.rows[row].cells[col];
  let input = cell.querySelector("input");
  if (!input) return null; // safety
  return input.value; // actual content
}

function highlightCell(row, col) {
  let val=grid.rows[row].cells[col];
  let cell = grid.rows[row].cells[col];
  cell.classList.add("error-cell");

  //alert(`Issue at [${row+1} , ${col+1}]: Value=\"${getCellValue(row, col)}\"`);
  //console.log("Grid["& row &","& col &"] -> "&${getCellValue(row, col));
  //const td = grid.rows[row].cells[col];
  //td.classList.add("error-cell");
}

function check() {
    const el = document.getElementById("gridInput");
    if (!el) {
        alert("Input not found");
        return;
    }

    clearHighlights();

    let raw = el.value;

    // Remove tokens
    let input = raw.replace(/<[^>]*>/g, "").trim();

    // Parse TSV
    const matrix = input.split("\n").map(row =>
        row.split("\t").map(cell => cell.trim())
    );

    const ROWS = matrix.length;
    const COLS = matrix[0].length;

    let hasIncomplete = false;

    // =========================
    // ✅ ROW CHECK
    // =========================
    for (let i = 0; i < ROWS; i++) {
        let expr = [];

        for (let j = 0; j < COLS; j++) {
            const cell = matrix[i][j];

            if (cell === "B") hasIncomplete = true;

            if (cell === ".") {
                expr = [];
                continue;
            }

            expr.push(cell);

            if (cell === "=") {
                const leftArr = expr.slice(0, -1);
                const right = matrix[i][j + 1];

                if (!right || right === "." || right === "B" || leftArr.includes("B")) {
                    hasIncomplete = true;
                    expr = [];
                    continue;
                }

                try {
                    const result = eval(leftArr.join("").replace(/x/g, "*"));

                    if (Number(result) !== Number(right)) {
                        console.log("❌ Row Error:", leftArr.join(" "), "=", right);
                        highlightCell(i, j);
                        alert(`Row issue at [${j+1},${i + 1}]->\"${getCellValue(i,j)}\"`);
                        return;
                    }

                } catch {
                    highlightCell(i, j);
                    alert(`Row issue at [${j+1},${i + 1}]-> \"${getCellValue(i,j)}\"`);
                    return;
                }

                expr = [];
            }
        }
    }

    // =========================
    // ✅ COLUMN CHECK
    // =========================
    for (let j = 0; j < COLS; j++) {
        let expr = [];

        for (let i = 0; i < ROWS; i++) {
            const cell = matrix[i][j];

            if (cell === "B") hasIncomplete = true;

            if (cell === ".") {
                expr = [];
                continue;
            }

            expr.push(cell);

            if (cell === "=") {
                const leftArr = expr.slice(0, -1);
                const right = (i + 1 < ROWS) ? matrix[i + 1][j] : null;

                if (!right || right === "." || right === "B" || leftArr.includes("B")) {
                    hasIncomplete = true;
                    expr = [];
                    continue;
                }

                try {
                    const result = eval(leftArr.join("").replace(/x/g, "*"));

                    if (Number(result) !== Number(right)) {
                        console.log("❌ Col Error:", leftArr.join(" "), "=", right);

                        highlightCell(i, j);      // "=" cell
                        highlightCell(i + 1, j);  // result cell

                        //alert(`Column issue at ${String.fromCharCode(65 + j)}${i + 1}`);
                        return;
                    }

                } catch {
                    highlightCell(i, j);
                    //alert(`Column issue at ${String.fromCharCode(65 + j)}${i + 1}`);
                    return;
                }

                expr = [];
            }
        }
    }
    // =========================
    // ✅ BLANK vs TOKEN CHECK
    // =========================
    let gameMatrix = document.getElementById('gridInput').value.trim();

    // count blanks
    let blankCount = gameMatrix.split(/\s+/).filter(x => x === 'B').length;

    // extract token pool from <...>
    let tokenMatch = raw.match(/<([^>]*)>/);
    let tokens = [];

    if (tokenMatch) {
        //tokens = tokenMatch[1].trim().split(/\s+/);
        tokens = (tokenMatch && tokenMatch[1].trim())? tokenMatch[1].trim().split(/\s+/): [];
    }

    // count remaining tokens (ignore operators if needed)
    let tokenCount = tokens.length;
    //alert("tokens:[" &tokenMatch.join(', ')&"]");
    console.log("Blanks:", blankCount, "Tokens:", tokenCount);

    // check mismatch
    if (blankCount !== tokenCount) {
        alert(`Mismatch: ${blankCount} blanks but ${tokenCount} tokens`);
        return;
    }

    // =========================
    // ✅ FINAL STATUS
    // =========================
    //let gameMatrix=document.getElementById('gridInput').value.trim();
    if (gameMatrix.includes('B')) {
      console.log("Blank cells exist:");
    } else{
      //alert("All cells are filled");
      hasIncomplete=false;
      console.log("No blank cells");
    }
    if (!hasIncomplete) {
        alert("Game Completed");
    } else {
        alert("No errors so far");
    }
}