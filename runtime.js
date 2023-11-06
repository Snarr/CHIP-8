import { CHIP8_Emulator } from "./emulator";

window.onload = function() {
  let fileInput = document.getElementById('fileInput');
  let canvas = document.getElementById('canvas');
  canvas.width = 640;
  canvas.height = 320;
  let ctx = canvas.getContext('2d');

  fileInput.addEventListener('change', function(e) {
    let file = fileInput.files[0];

    let reader = new FileReader();

    reader.onload = function(e) {
      // console.log(reader.result.data);
      let emulator = new CHIP8_Emulator()

      emulator.loadProgram(reader.result);
      if (emulator.step() == 1) {
        drawDisplayToCanvas(ctx, emulator.getDisplay());
      } else {

      }

    }

    reader.readAsArrayBuffer(file);
  });
}

function drawDisplayToCanvas(ctx, display) {
  let cellSize = 10;

  ctx.fillStyle = "black";
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      if (display[y][x] == 0) continue;
      ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize)
    }
  }
}