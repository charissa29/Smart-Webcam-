// app.js - Smart webcam using TensorFlow.js COCO-SSD
let video = document.getElementById('videoElement');
let overlay = document.getElementById('overlay');
let ctx = overlay.getContext('2d');
let model = null;
let running = false;
let detectInterval = null;

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('getUserMedia not supported in this browser.');
    throw new Error('getUserMedia not supported');
  }
  const stream = await navigator.mediaDevices.getUserMedia({video: {width:640, height:480}, audio:false});
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => { resolve(video); };
  });
}

async function loadModel() {
  // Load COCO-SSD model
  model = await cocoSsd.load();
  console.log('COCO-SSD model loaded.');
}

function drawDetections(predictions) {
  ctx.clearRect(0,0,overlay.width, overlay.height);
  if (!document.getElementById('drawBoxes').checked) return;
  predictions.forEach(pred => {
    const [x,y,w,h] = pred.bbox;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(x,y,w,h);
    ctx.font = '16px Arial';
    ctx.fillStyle = 'red';
    const text = `${pred.class} (${(pred.score*100).toFixed(1)}%)`;
    ctx.fillText(text, x, y > 20 ? y-6 : y+12);
  });
}

async function detectFrame() {
  if (!model) return;
  const predictions = await model.detect(video);
  // Filter to people and common objects (optional)
  const filtered = predictions.filter(p => p.score > 0.4);
  drawDetections(filtered);
}

document.getElementById('startBtn').addEventListener('click', async () => {
  if (running) return;
  try {
    await setupCamera();
  } catch (e) {
    console.error(e);
    return;
  }
  if (!model) await loadModel();
  running = true;
  detectInterval = setInterval(detectFrame, 150);
});

document.getElementById('stopBtn').addEventListener('click', () => {
  running = false;
  clearInterval(detectInterval);
  // stop camera
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  ctx.clearRect(0,0,overlay.width, overlay.height);
});

// Auto-start on page load (comment out if you prefer manual start)
window.addEventListener('load', async () => {
  // no auto start to allow user to grant permissions manually via Start button
});
