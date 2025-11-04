// Simulated REST API using GET and PUT
async function mockAPIRequest(code, method) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let formatted = code
        .replace(/;/g, ";\n") // newline after ;
        .replace(/\n{2,}/g, "\n"); // collapse multiple newlines
      resolve({ formatted, method });
    }, 400);
  });
}

// Display line numbers
function updateLineNumbers(code) {
  const lines = code.split("\n").length;
  let nums = "";
  for (let i = 1; i <= lines; i++) nums += i + "\n";
  document.getElementById("lineNumbers").innerText = nums;
}

// GET (lint)
async function lintCode() {
  const code = document.getElementById("codeInput").value;
  const res = await mockAPIRequest(code, "GET");
  document.getElementById("formattedCode").innerText = res.formatted;
  updateLineNumbers(res.formatted);
}

// PUT (update)
async function updateCode() {
  const code = document.getElementById("codeInput").value;
  const res = await mockAPIRequest(code, "PUT");
  document.getElementById("formattedCode").innerText = res.formatted;
  updateLineNumbers(res.formatted);
}

// Copy to clipboard
function copyCode() {
  const text = document.getElementById("formattedCode").innerText;
  navigator.clipboard.writeText(text);
  alert("✅ Linted code copied!");
}

// Example curl-style logs (for demonstration)
console.log('GET example:\ncurl -X GET "http://localhost/index.html?code=YOUR_CODE"');
console.log('PUT example:\ncurl -X PUT "http://localhost/index.html?code=YOUR_CODE"');

