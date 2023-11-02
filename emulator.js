let default_font = [0b11110000,0b10010000,0b10010000,0b10010000,0b11110000,0b00100000,0b01100000,0b00100000,0b00100000,0b01110000,0b11110000,0b00010000,0b11110000,0b10000000,0b11110000,0b11110000,0b00010000,0b11110000,0b00010000,0b11110000,0b10010000,0b10010000,0b11110000,0b00010000,0b00010000,0b11110000,0b10000000,0b11110000,0b00010000,0b11110000,0b11110000,0b10000000,0b11110000,0b10010000,0b11110000,0b11110000,0b00010000,0b00100000,0b01000000,0b01000000,0b11110000,0b10010000,0b11110000,0b10010000,0b11110000,0b11110000,0b10010000,0b11110000,0b00010000,0b11110000,0b11110000,0b10010000,0b11110000,0b10010000,0b10010000,0b11100000,0b10010000,0b11100000,0b10010000,0b11100000,0b11110000,0b10000000,0b10000000,0b10000000,0b11110000,0b11100000,0b10010000,0b10010000,0b10010000,0b11100000,0b11110000,0b10000000,0b11110000,0b10000000,0b11110000,0b11110000,0b10000000,0b11110000,0b10000000,0b10000000];

class CHIP8_Emulator {
  constructor() {
    this.RAM = new Uint8Array(0x1000).fill(0x00);
    this.PC = 0x0200;
    this.SP = 0x00;
    this.I = 0x0000;
    this.DT = 0x0;
    this.ST = 0x0;
    this.vRegisters = new Uint8Array(16).fill(0x00);
    this.DISPLAY = new Array(32)
    for (let i = 0; i < 32; i++) {
      this.DISPLAY[i] = new Array(64).fill(0);
    }

    this.loadFont();
  }

  loadFont() {
    let font = default_font;

    for (let i = 0; i < font.length; i++) {
      this.RAM[i] = font[i];
    }
  }

  loadProgram(buffer) {
    const instructions = new DataView(buffer);
    for (let i = 0; i < instructions.byteLength; i += 1) {
      this.RAM[i+0x0200] = instructions.getUint8(i);
    }
  }

  step() {
    let status = this.execOpcode((this.RAM[this.PC] << 8) | this.RAM[this.PC+1])
    this.PC += 0x2;
    return status;
  }

  //0x0NNN
  //0x0X00
  //0x00Y0
  //0x000N
  //0X00KK

  execOpcode(opcode) {
    if (opcode == 0x00E0) {
      for (let i = 0; i < 32; i++) {
        this.DISPLAY[i] = new Array(64).fill(0);
      }
    } else if (getFirstByte(opcode) == 0xA) {
      this.I = opcode & 0x0FFF;
    } else if (getFirstByte(opcode) == 0x6) {
      this.vRegisters[getX(opcode)] = getKK(opcode);
    } else if (getFirstByte(opcode) == 0xD) {
      let startX = this.vRegisters[getX(opcode)];
      console.log("Start X: " + startX);

      let startY = this.vRegisters[getY(opcode)];
      console.log("Start Y: " + startY);

      let spriteHeight = getNibble(opcode);
      console.log("Height: " + spriteHeight);

      for (let y = 0; y < spriteHeight; y++) {
        let currentY = startY+y;
        if (currentY > 31) break;

        for (let x = 0; x < 8; x++) {
          let currentX = startX+x;
          if (currentX > 63) break;
          this.DISPLAY[currentY][currentX] = getNthBit(this.RAM[this.I+y], 7-x) ^ this.DISPLAY[currentY][currentX]
        }
      }
    } else if (getFirstByte(opcode) == 0x1) {
      this.I = getNNN(opcode);
    } else {
      console.log("Invalid opcode", opcode)
      return 0;
    }

    return 1;
  }

  getDisplay() {
    return this.DISPLAY;
  }
}

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

      while (emulator.step() == 1) {
        drawDisplayToCanvas(ctx, emulator.getDisplay());
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

function getFirstByte(i) {
  return i >> 12;
}

function getX(i) {
  return (i & 0x0F00) >> 8;
}

function getY(i) {
  return (i & 0x00F0) >> 4;
}

function getNibble(i) {
  return (i & 0x000F);
}

function getNNN(i) {
  return (i & 0x0FFF)
}

function getKK(i) {
  return (i & 0x00FF)
}

function getNthBit(x, n) {
  return (x >> n) & 1
}