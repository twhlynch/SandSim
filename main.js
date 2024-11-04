const canvas = document.getElementById("renderer");
const ctx = canvas.getContext("2d");

const SCALE = 2;

canvas.width = Math.floor(window.innerWidth / SCALE);
canvas.height = Math.floor(window.innerHeight / SCALE);

const radiusSlider = document.getElementById('radius');
const eraseButton = document.getElementById('erase');
const speedButton = document.getElementById('speed');
const waterButton = document.getElementById('water');
const sandCounter = document.getElementById('counter');

let isMouseDown = false;
let mousePosition = { x: 0, y: 0 };
let color = { h: 0, s: 1, v: 0.7 };
let type = "rainbow";
let speed = 1;
let waterBlue = 255;
let radius = parseInt(radiusSlider.value);
let sandCount = 0;
let turn = true;

let imageData = new ImageData(canvas.width, canvas.height);

let WIDTH = canvas.width * 4;
let HEIGHT = canvas.height * 4;

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

  return { r: r * 255, g: g * 255, b: b * 255 };
}

function draw() {
  const { x, y } = mousePosition;
  let { r, g, b } = getRGB();
  let a = 255;

  if (type == "erase") {
    r = 0;
    g = 0;
    b = 0;
    a = 0;
  } else if (type == "water") {
    r = 0;
    g = 0;
    b = waterBlue;
  }

  const rSquared = radius * radius;

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {

      if (dx * dx + dy * dy > rSquared) continue;

      const nx = x + dx;
      const ny = y + dy;

      if (
        nx < 0 || nx >= canvas.width ||
        ny < 0 || ny >= canvas.height
      ) {
        continue;
      }

      const index = (nx + ny * canvas.width) * 4;

      imageData.data.set(
        [ r, g, b, a ], 
        index
      );
    }
  }

  color.h += 0.001;
  if (color.h > 1) color.h = 0;
}

function isEmpty(index) {
  return (
    imageData.data[index + 3] === 0
  );
}
function set(newIndex, oldIndex) {
  const data = [
    imageData.data[oldIndex],
    imageData.data[oldIndex + 1],
    imageData.data[oldIndex + 2],
    turn ? 255 : 254
  ];

  imageData.data.set(
    [0, 0, 0, 0], 
    oldIndex
  );
  imageData.data.set(
    data, 
    newIndex
  );
}
function move(index, i) {
  const x = i % canvas.width;
  const y = Math.floor(i / canvas.width);

  const canGoDown = y != canvas.height - 1;
  const canGoLeft = x != 0;
  const canGoRight = x != canvas.width - 1;

  const downIndex = index + WIDTH;
  const downRightIndex = downIndex + 4;
  const downLeftIndex = downIndex - 4;

  if (canGoDown) {
    // down
    if (isEmpty(downIndex)) {
      set(downIndex, index);
      return true;
    }
    // down right or down left
    if (
      canGoLeft && isEmpty(downLeftIndex) && 
      canGoRight && isEmpty(downRightIndex)
    ) {
      const randomIndex = Math.random() >= 0.5 ? downLeftIndex : downRightIndex;
      set(randomIndex, index);
      return true;
    }
    // down left
    if (
      canGoLeft && isEmpty(downLeftIndex)
    ) {
      set(downLeftIndex, index);
      return true;
    }
    // down right
    if (
      canGoRight && isEmpty(downRightIndex)
    ) {
      set(downRightIndex, index);
      return true;
    }
  }

  if (imageData.data[index + 2] == waterBlue) {
    const rightIndex = index + 4;
    const leftIndex = index - 4;

    // right or left
    if (
      canGoLeft && isEmpty(leftIndex) &&
      canGoRight && isEmpty(rightIndex)
    ) {
      const randomIndex = Math.random() >= 0.5 ? leftIndex : rightIndex;
      set(randomIndex, index);
      return true;
    }
    // left
    if (canGoLeft && isEmpty(leftIndex)) {
      set(leftIndex, index);
      return true;
    }
    // right
    if (canGoRight && isEmpty(rightIndex)) {
      set(rightIndex, index);
      return true;
    }
  }

  return false;
}
function update() {
  turn = !turn;
  sandCount = 0;

  const pixels = canvas.width * canvas.height;
  for (let i = 0; i < pixels; i++) {
    let j = i;
    if (turn) {
      const col = i % canvas.width;
      j = i - col + canvas.width - 1 - col;
    }

    const index = j * 4;
    if (
      imageData.data[index + 3] === 0 ||
      imageData.data[index + 3] === (turn ? 255 : 254)
    ) continue;

    sandCount++;
    if(!move(index, j)) {
      set(index, index);
    }
  }
}

radiusSlider.addEventListener('change', (e) => {
  radius = parseInt(e.target.value);
});
speedButton.addEventListener('click', () => {
  speed = speed === 2 ? 1 : speed + 1;
  speedButton.innerText = speed + 'x';
});

const typeButtons = document.querySelectorAll('.type-btn');
typeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    type = btn.id;
    typeButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    btn.classList.add('active');
  });
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

window.addEventListener('resize', () => {
  let oldWidth = canvas.width;
  let oldHeight = canvas.height;

  canvas.width = Math.floor(window.innerWidth / SCALE);
  canvas.height = Math.floor(window.innerHeight / SCALE);

  let newImageData = new ImageData(canvas.width, canvas.height);

  for (let i = 0; i < oldWidth * oldHeight; i++) {
    let ox = i % oldWidth;
    let oy = Math.floor(i / oldWidth);

    if (ox < canvas.width && oy < canvas.height) {
      let index = (ox + oy * canvas.width) * 4;
      newImageData.data.set(
        imageData.data.slice(i * 4, i * 4 + 4), 
        index
      );
    }
  }

  imageData = newImageData;

  isMouseDown = false;

  WIDTH = canvas.width * 4;
  HEIGHT = canvas.height * 4;
});

function render() {
  for (let i = 0; i < speed * 2; i++) {
    update();
  }
  if (isMouseDown) draw();

  sandCounter.innerText = sandCount + ' pixels';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(imageData, 0, 0);
  
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
