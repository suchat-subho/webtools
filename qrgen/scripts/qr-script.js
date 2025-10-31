// Handles QR generation and modal zoom behavior

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const qrCanvas = document.getElementById('qrcodeCanvas');
  const statusText = document.getElementById('status');
  const generateBtn = document.getElementById('generateBtn');

  generateBtn.addEventListener('click', generateQRCode);
  qrCanvas.addEventListener('click', openModal);

  function generateQRCode() {
    const url = urlInput.value.trim();
    if (!url) {
      statusText.textContent = 'Please enter a valid URL.';
      return;
    }

    QRCode.toCanvas(qrCanvas, url, function (error) {
      if (error) {
        console.error(error);
        statusText.textContent = 'Failed to generate QR code.';
      } else {
        statusText.textContent = url;
      }
    });
  }

  function openModal() {
    const modal = document.getElementById('qrModal');
    const zoomedQR = document.getElementById('zoomedQR');
    const modalUrl = document.getElementById('modalUrl');
    const url = statusText.textContent.trim();

    if (!url) return;

    zoomedQR.src = qrCanvas.toDataURL('image/png');
    modalUrl.textContent = url;
    modal.style.display = 'flex';
  }
});

function closeModal() {
  const modal = document.getElementById('qrModal');
  modal.style.animation = 'fadeOut 0.3s ease';
  setTimeout(() => {
    modal.style.display = 'none';
    modal.style.animation = 'fadeIn 0.3s ease';
  }, 300);
}
