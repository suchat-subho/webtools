self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Intercept POST requests to the root (index path)
  if ((url.pathname === '/' || url.pathname.endsWith('/index.html')) &&
      event.request.method === 'POST') {
    event.respondWith(handleLint(event.request));
  }
});

async function handleLint(request) {
  try {
    const { code } = await request.json();
    const linted = lintCppLogic(code);
    return new Response(JSON.stringify({ linted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function lintCppLogic(src) {
  src = src.replace(/[\t ]+/g, ' ');
  src = src.replace(/;\s*/g, ';\n');
  src = src.replace(/\{\s*/g, '{\n');
  src = src.replace(/\}\s*/g, '}\n');
  src = src.replace(/\n{3,}/g, '\n\n');
  const lines = src.split(/\n/);
  let indent = 0;
  const out = lines.map(line => {
    line = line.trim();
    if (line.endsWith('}')) indent = Math.max(0, indent - 1);
    const t = ' '.repeat(indent * 4) + line;
    if (line.endsWith('{')) indent++;
    return t;
  });
  return out.join('\n');
}
