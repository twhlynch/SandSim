let canvas = document.getElementById("renderer");
let context = canvas.getContext("2d");
let velocityData = new Array(2 * canvas.width * canvas.height);
let isMouseDown = false;
let mousePosition = { x: 0, y: 0 };
let type = "sand";
let radius = 8;
const colors = {
  sand: {red: 242, green: 209, blue: 107, alpha: 255},
  water: {red: 115, green: 182, blue: 254, alpha: 255},
  erase: {red: 0, green: 0, blue: 0, alpha: 0},
  stone: {red: 128, green: 128, blue: 128, alpha: 255},
  dirt: {red: 114, green: 93, blue: 76, alpha: 255},
};

function drawParticles(posX, posY) {
  let color = colors[type];

  const oldImageData = context.getImageData(posX - radius, posY - radius, 2 * radius, 2 * radius);
  let imageData = context.createImageData(2 * radius, 2 * radius);
  for(let y = 0; y < 2 * radius; y += 1) {
    for(let x = 0; x < 2 * radius; x += 1) {
      if((x - radius) * (x - radius) + (y - radius) * (y - radius) < radius * radius) {
        imageData.data[4 * (x + y * 2 * radius) + 0] = color.red;
        imageData.data[4 * (x + y * 2 * radius) + 1] = color.green;
        imageData.data[4 * (x + y * 2 * radius) + 2] = color.blue;
        imageData.data[4 * (x + y * 2 * radius) + 3] = color.alpha;
      } else {
        imageData.data[4 * (x + y * 2 * radius) + 0] = oldImageData.data[4 * (x + y * 2 * radius) + 0];
        imageData.data[4 * (x + y * 2 * radius) + 1] = oldImageData.data[4 * (x + y * 2 * radius) + 1];
        imageData.data[4 * (x + y * 2 * radius) + 2] = oldImageData.data[4 * (x + y * 2 * radius) + 2];
        imageData.data[4 * (x + y * 2 * radius) + 3] = oldImageData.data[4 * (x + y * 2 * radius) + 3];
      }
    }
  }

  context.putImageData(imageData, posX-radius, posY-radius);
}

function updateParticles() {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for(let y = canvas.height - 1; y >= 0; y -= 1) {
    let didMoveRight = false;
    let didMoveLeft = false;
    for(let x = 0; x < canvas.width; x += 1) {
      let currentIndex = (x + y * canvas.width) * 4;
      let belowIndex = currentIndex + canvas.width * 4;
      let leftIndex = currentIndex - 4;
      let rightIndex = currentIndex + 4;
      let leftBelowIndex = belowIndex - 4;
      let rightBelowIndex = belowIndex + 4;

      let newIndex = currentIndex;
      let swapPixels = false;

      if(data[currentIndex + 3] == 255) {
        if(!didMoveRight) {
          if(belowIndex < data.length && data[belowIndex + 3] == 0) {
            //Try to move down
            newIndex = belowIndex;
            didMoveLeft = false;
          } else if(belowIndex < data.length && data[belowIndex + 3] == 255 && data[currentIndex + 2] != 254 && data[belowIndex + 2] == 254) {
            //Let sand push away water
            swapPixels = true;
            newIndex = belowIndex;
            didMoveLeft = false;
          } else {
            if(x > 0 && leftBelowIndex < data.length && data[leftIndex + 3] == 0 && data[leftBelowIndex + 3] == 0) {
              //Try to move left below
              newIndex = leftBelowIndex;
              didMoveLeft = false;
            } else if(x < canvas.width - 1 && rightBelowIndex < data.length && data[rightIndex + 3] == 0 && data[rightBelowIndex + 3] == 0) {
              //Try to move right below
              newIndex = rightBelowIndex;
              didMoveLeft = false;
            } else if(data[currentIndex + 2] == 254) {
              //Is water
              var canMoveLeft = false;
              var canMoveRight = false;

              //Try to move left
              if(x > 0 && data[leftIndex + 3] == 0) {
                if(!didMoveLeft) {
                  canMoveLeft = true;
                } else {
                  didMoveLeft = false;
                }
              }

              //Try to move right
              if(x < canvas.width - 1 && data[rightIndex + 3] == 0) {
                canMoveRight = true;
              }

              if (canMoveRight && canMoveLeft) {
                let choice = (Math.random() > 0.5);
                if(choice) {
                  canMoveLeft = false;
                }
              }
              if(canMoveLeft) {
                newIndex = leftIndex;
                didMoveLeft = true;
              } else if(canMoveRight) {
                newIndex = rightIndex;
                didMoveRight = true;
                didMoveLeft = false;
              }
            }
          }

          if(newIndex != currentIndex) {
            let r = data[newIndex + 0];
            let g = data[newIndex + 1];
            let b = data[newIndex + 2];
            let a = data[newIndex + 3];

            data[newIndex + 0] = data[currentIndex + 0];
            data[newIndex + 1] = data[currentIndex + 1];
            data[newIndex + 2] = data[currentIndex + 2];
            data[newIndex + 3] = data[currentIndex + 3];

            if(swapPixels) {
              data[currentIndex + 0] = r;
              data[currentIndex + 1] = g;
              data[currentIndex + 2] = b;
              data[currentIndex + 3] = a;
            } else {
              data[currentIndex + 0] = 0;
              data[currentIndex + 1] = 0;
              data[currentIndex + 2] = 0;
              data[currentIndex + 3] = 0;
            }
          }
        } else {
          didMoveRight = false;
        }
      } else {
        didMoveLeft = false;
      }
    }
  }
  context.putImageData(imageData, 0, 0);
}

const typeButtons = document.querySelectorAll('.type-btn');
typeButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    type = e.target.id;
    document.querySelector('.active').classList.remove('active');
    e.target.classList.add('active');
  });
});

const radiusSlider = document.getElementById('radius');
radiusSlider.addEventListener('change', (e) => {
  radius = e.target.value;
});

canvas.addEventListener('mousemove', function(event) {
  mousePosition.x = event.layerX;
  mousePosition.y = event.layerY;
  if (isMouseDown) {
    drawParticles(event.layerX, event.layerY);
  }
});

canvas.addEventListener('mousedown', (e) => {
    mousePosition.x = e.layerX;
    mousePosition.y = e.layerY;
    isMouseDown = true;
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  mousePosition.x = e.layerX;
  mousePosition.y = e.layerY;
  isMouseDown = true;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  mousePosition.x = e.layerX;
  mousePosition.y = e.layerY;
  if (isMouseDown) {
    drawParticles(e.layerX, e.layerY);
  }
});

window.addEventListener('touchend', () => {
  isMouseDown = false;
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

function render() {

  if(isMouseDown) {
    drawParticles(mousePosition.x, mousePosition.y);
  }

  updateParticles();

  window.requestAnimationFrame(render)
}
requestAnimationFrame(render);
