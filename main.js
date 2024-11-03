const canvas = document.getElementById("renderer");
const ctx = canvas.getContext("2d");

const SCALE = 2;

canvas.width = Math.floor(window.innerWidth / SCALE);
canvas.height = Math.floor(window.innerHeight / SCALE);

const radiusSlider = document.getElementById('radius');
const eraseButton = document.getElementById('erase');
const speedButton = document.getElementById('speed');

let isMouseDown = false;
let mousePosition = { x: 0, y: 0 };
let color = { h: 0, s: 1, v: 0.8 };
let erase = false;
let speed = 1;
let radius = parseInt(radiusSlider.value);

let imageData = new ImageData(canvas.width, canvas.height);
let newImageData = new ImageData(canvas.width, canvas.height);

function getRGB() {
  let r, g, b;
  let { h, s, v } = color;

  let _i, _f, _p, _q, _t;
  _i = Math.floor(h * 6);
  _f = h * 6 - _i;
  _p = v * (1 - s);
  _q = v * (1 - _f * s);
  _t = v * (1 - (1 - _f) * s);
  switch (_i % 6) {
      case 0: r = v, g = _t, b = _p; break;
      case 1: r = _q, g = v, b = _p; break;
      case 2: r = _p, g = v, b = _t; break;
      case 3: r = _p, g = _q, b = v; break;
      case 4: r = _t, g = _p, b = v; break;
      case 5: r = v, g = _p, b = _q; break;
  }

  r *= 255;
  g *= 255;
  b *= 255;

  return { r, g, b };
}

function draw() {
  const { x, y } = mousePosition;
  let { r, g, b } = getRGB();
  let a = 255;

  if (erase) {
    r = 0;
    g = 0;
    b = 0;
    a = 0;
  }

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const nx = x + dx;
      const ny = y + dy;

      const distance = Math.sqrt(dx**2 + dy**2);

      if (
        nx < 0 ||
        ny < 0 ||
        nx >= canvas.width ||
        ny >= canvas.height ||
        distance > radius
      ) {
        continue;
      }

      const index = (nx + ny * canvas.width) * 4;

      imageData.data[index] = r;
      imageData.data[index + 1] = g;
      imageData.data[index + 2] = b;
      imageData.data[index + 3] = a;
    }
  }

  color.h += 0.001;
  if (color.h > 1) color.h = 0;
}

function isEmpty(index) {
  if (imageData.data[index + 3] === 0) {
    return true;
  }
  return false;
}
function set(newIndex, oldIndex) {
  newImageData.data[newIndex] = imageData.data[oldIndex];
  newImageData.data[newIndex + 1] = imageData.data[oldIndex + 1];
  newImageData.data[newIndex + 2] = imageData.data[oldIndex + 2];
  newImageData.data[newIndex + 3] = imageData.data[oldIndex + 3];
}
function update() {
  newImageData = new ImageData(canvas.width, canvas.height);

  for (let i = 0; i < canvas.width * canvas.height; i++) {
    const index = i * 4;
    if (isEmpty(index)) {
      continue;
    }

    const x = i % canvas.width;

    const downIndex = index + canvas.width * 4;
    const downRightIndex = index + canvas.width * 4 + 4;
    const downLeftIndex = index + canvas.width * 4 - 4;

    if (isEmpty(downIndex)) {
      set(downIndex, index);
    } else if (
      x != 0 && isEmpty(downLeftIndex) && 
      x != canvas.width - 1 && isEmpty(downRightIndex)
    ) {
      const randomIndex = Math.random() >= 0.5 ? downLeftIndex : downRightIndex;
      set(randomIndex, index);
    } else if (x != 0 && isEmpty(downLeftIndex)) {
      set(downLeftIndex, index);
    } else if (x != canvas.width - 1 && isEmpty(downRightIndex)) {
      set(downRightIndex, index);
    } else {
      set(index, index);
    }
  }

  imageData.data.set(newImageData.data);
}

radiusSlider.addEventListener('change', (e) => {
  radius = parseInt(e.target.value);
});
eraseButton.addEventListener('click', () => {
  erase = !erase;
  eraseButton.className = erase ? 'active' : '';
});
speedButton.addEventListener('click', () => {
  speed = speed === 1 ? 2 : 1;
  speedButton.innerText = speed + 'x';
});

window.addEventListener('mousemove', function(event) {
  mousePosition.x = Math.floor(event.clientX / SCALE);
  mousePosition.y = Math.floor(event.clientY / SCALE);
  if (isMouseDown) draw();
});
window.addEventListener('touchmove', (e) => {
  e.preventDefault();
  mousePosition.x = Math.floor(e.touches[0].clientX / SCALE);
  mousePosition.y = Math.floor(e.touches[0].clientY / SCALE);
  if (isMouseDown) draw();
});

canvas.addEventListener('mousedown', (e) => {
  mousePosition.x = Math.floor(e.clientX / SCALE);
  mousePosition.y = Math.floor(e.clientY / SCALE);
  isMouseDown = true;
  draw();
});
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  mousePosition.x = Math.floor(e.touches[0].clientX / SCALE);
  mousePosition.y = Math.floor(e.touches[0].clientY / SCALE);
  isMouseDown = true;
  draw();
});

window.addEventListener('touchend', () => {
  isMouseDown = false;
});
window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.putImageData(imageData, 0, 0);
  

  for (let i = 0; i < speed; i++) {
    update();
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
