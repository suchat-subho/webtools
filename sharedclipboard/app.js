/* -------------------------
  Config & helpers
------------------------- */
const getBackend = () => document.getElementById('backend').value.replace(/\s+$/,'');
const setStatus = (s) => document.getElementById('status').textContent = 'Status: ' + s;
const hostBlock = document.getElementById('hostBlock');
const clientBlock = document.getElementById('clientBlock');
const activate = (role) => {
  if (role === 'host') { hostBlock.classList.add('active'); clientBlock.classList.add('inactive'); }
  else if (role === 'client') { clientBlock.classList.add('active'); hostBlock.classList.add('inactive'); }
  else { hostBlock.classList.remove('active','inactive'); clientBlock.classList.remove('active','inactive'); }
};

/* DB helpers */
async function db_set(obj) {
  const url = getBackend() + '?action=set&json=' + encodeURIComponent(JSON.stringify(obj));
  const res = await fetch(url);
  return await res.json();
}
async function db_get_keys(keyList) {
  const url = getBackend() + '?action=get&keys=' + encodeURIComponent(keyList);
  const res = await fetch(url);
  return await res.json();
}
async function db_get_all() {
  const url = getBackend();
  const res = await fetch(url);
  return await res.json();
}
async function db_delete(key) {
  const url = getBackend() + '?action=delete&key=' + encodeURIComponent(key);
  try { const r = await fetch(url); return await r.json(); } catch(e){ return null; }
}

/* -------------------------
  WebRTC helpers
------------------------- */
let pc = null;
let dataChannel = null;
let connected = false;
let hostOfferKey = null;
let clientAnswerKey = null;
let hostFoundAnswerKey = null;
let pollInterval = null;

function createPeer() {
  pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  pc.onconnectionstatechange = () => {
    const st = pc.connectionState;
    setStatus('Peer state: ' + st);
    if (st === 'connected') {
      connected = true;
      document.getElementById('clipboardWrap').style.display = 'block';
      if (hostOfferKey) db_delete(hostOfferKey);
      if (clientAnswerKey) db_delete(clientAnswerKey);
      if (hostFoundAnswerKey) db_delete(hostFoundAnswerKey);
    }
  };
}

function waitIceGatheringComplete(pcRef, timeout = 5000) {
  return new Promise(resolve => {
    if (!pcRef) return resolve();
    if (pcRef.iceGatheringState === 'complete') return resolve();
    function handler() {
      if (pcRef.iceGatheringState === 'complete') {
        pcRef.removeEventListener('icegatheringstatechange', handler);
        resolve();
      }
    }
    pcRef.addEventListener('icegatheringstatechange', handler);
    setTimeout(resolve, timeout);
  });
}

/* -------------------------
  HOST FLOW
------------------------- */
document.getElementById('hostBtn').addEventListener('click', async () => {
  try {
    activate('host');
    setStatus('Creating peer + datachannel (host) ...');
    createPeer();

    dataChannel = pc.createDataChannel('clipboard');
    dataChannel.onopen = () => setStatus('DataChannel open (host)');
    dataChannel.onmessage = (ev) => { document.getElementById('recvClip').value = ev.data; };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    setStatus('Gathering ICE (host)...');
    await waitIceGatheringComplete(pc, 6000);

    const payload = { offer: pc.localDescription };
    setStatus('Publishing offer to DB ...');
    const dbRes = await db_set(payload);
    hostOfferKey = dbRes.key || Object.values(dbRes)[0];
    document.getElementById('offerKey').textContent = hostOfferKey;
    setStatus('Offer published: ' + hostOfferKey + ' — waiting for answer ...');

    pollInterval = setInterval(async () => {
      try {
        const all = await db_get_all();
        for (const k in all) {
          let parsed;
          try { parsed = JSON.parse(all[k]); } catch(e){ continue; }
          if (parsed && parsed.answer_to === hostOfferKey && parsed.answer) {
            hostFoundAnswerKey = k;
            document.getElementById('foundAnswerKey').textContent = hostFoundAnswerKey;
            setStatus('Answer found: applying ...');
            await pc.setRemoteDescription(parsed.answer);
            clearInterval(pollInterval);
            pollInterval = null;
            return;
          }
        }
      } catch(e){ console.warn('poll error', e); }
    }, 1500);

  } catch (err) { console.error(err); setStatus('Host error: ' + (err.message || err)); }
});

/* -------------------------
  CLIENT FLOW
------------------------- */
document.getElementById('clientBtn').addEventListener('click', async () => {
  try {
    activate('client');
    const hostKey = document.getElementById('clientOfferInput').value.trim();
    if (!hostKey) return alert('Enter offer key from host');

    setStatus('Fetching offer from DB ...');
    const got = await db_get_keys(hostKey);
    if (!got || !got[hostKey]) { setStatus('Offer not found'); return; }

    let parsed;
    try { parsed = JSON.parse(got[hostKey]); } catch(e){ setStatus('Invalid JSON'); return; }
    if (!parsed.offer) { setStatus('Missing offer field'); return; }

    createPeer();
    pc.ondatachannel = (ev) => { dataChannel = ev.channel; dataChannel.onmessage = (ev) => { document.getElementById('recvClip').value = ev.data; }; dataChannel.onopen = () => setStatus('DataChannel open (client)'); };

    await pc.setRemoteDescription(parsed.offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitIceGatheringComplete(pc, 6000);

    const payload = { answer_to: hostKey, answer: pc.localDescription };
    setStatus('Publishing answer to DB ...');
    const dbRes = await db_set(payload);
    clientAnswerKey = dbRes.key || Object.values(dbRes)[0];
    document.getElementById('answerKey').textContent = clientAnswerKey;

    setStatus('Answer published: ' + clientAnswerKey);

  } catch(err){ console.error(err); setStatus('Client error: ' + (err.message || err)); }
});

/* -------------------------
  Clipboard actions
------------------------- */
document.getElementById('sendClip').addEventListener('input', () => {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(document.getElementById('sendClip').value);
  }
});

/* -------------------------
  Reset activation
------------------------- */
document.addEventListener('click', (e) => {
  if (!hostBlock.contains(e.target) && !clientBlock.contains(e.target)) activate(null);
});
