import { CHIP8_Emulator } from "./emulator.js";

let runtime;
let fileInput, stopButton, startButton, nextButton;


let emulator = new CHIP8_Emulator();
let canvas, ctx;
let stopFlag = false;

window.onload = function() {
  fileInput = document.getElementById('fileInput');
  startButton = document.getElementById('start');
  stopButton = document.getElementById('stop');
  nextButton = document.getElementById('next');
  canvas = document.getElementById('canvas');
  canvas.width = 640;
  canvas.height = 320;
  ctx = canvas.getContext('2d');

  fileInput.addEventListener('change', function(e) {
    let file = fileInput.files[0];

    let reader = new FileReader();

    reader.onload = function(e) {
      emulator = new CHIP8_Emulator();
      emulator.loadProgram(reader.result);
    }

    reader.readAsArrayBuffer(file);
  });


  startButton.addEventListener('click', () => { start() })
  stopButton.addEventListener('click', () => { stop() })
  nextButton.addEventListener('click', () => {{
    emulator.step()
    drawDisplayToCanvas(ctx, emulator.getDisplay());

    console.log(emulator);
  }})

  document.addEventListener('keydown', (e) => {
    let keyValue = parseInt(e.key, 16);
    if (keyValue >= 0 && keyValue <= 15) {
      emulator.setKey(keyValue, 1)
    }
  })

  document.addEventListener('keyup', (e) => {
    let keyValue = parseInt(e.key, 16);
    if (keyValue >= 0 && keyValue <= 15) {
      emulator.setKey(keyValue, 0)
    }
  })



}

function start() {
  console.log("Starting runtime...")
  stopFlag = false;

  drawDisplayToCanvas(ctx, emulator.getDisplay());

  let fps = 15;
  let now;
  let elapsed;

  let fpsInterval = 1000 / fps;
  let then = Date.now();

  var animate = () => {

    if (stopFlag) {
      return;
    }
    
    // request another frame
    requestAnimationFrame(animate);
  
    // calc elapsed time since last loop
    now = Date.now();
    elapsed = now - then;
  
    // if enough time has elapsed, draw the next frame
    if (elapsed > fpsInterval) {
        // Get ready for next frame by setting then=now, but...
        // Also, adjust for fpsInterval not being multiple of 16.67
        then = now - (elapsed % fpsInterval);
  
        // draw stuff here
        emulator.step()
        drawDisplayToCanvas(ctx, emulator.getDisplay());
  
    }
  }
  
  animate();
}
function stop() {
  stopFlag = true;
  console.log("Runtime stopped.")
}

function drawDisplayToCanvas(ctx, display) {
  let cellSize = 10;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      if (display[y][x] == 0) {
        ctx.fillStyle = "white"
      } else {
        ctx.fillStyle = "black"
      }
      ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize)
    }
  }
}