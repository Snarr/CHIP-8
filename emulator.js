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

  getRandomUint8() {
    return Math.floor(Math.random() * 256);
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
    let firstByte = getFirstByte(opcode);

    if (opcode == 0x00E0) {
      for (let i = 0; i < 32; i++) {
        this.DISPLAY[i] = new Array(64).fill(0);
      }
    } else if (opcode == 0x00EE) { 
      // Return from a subroutine
    }else if (firstByte == 0x1) {
      // Jump to location nnn
      this.PC = getNNN(opcode);
    } else if (firstByte == 0x2) {
      // Call subroutine at nnn
    } else if (firstByte == 0x3) {
      // Skip next instruction if Vx == kk
      if (this.vRegisters[getX(opcode)] == getKK(opcode)) {
        this.PC += 1;
      }
    } else if (firstByte == 0x4) {
      // Skip next instruction if Vx != kk
      if (this.vRegisters[getX(opcode)] != getKK(opcode)) {
        this.PC += 1;
      }
    } else if (firstByte == 0x5) {
      // Skip next instruction if Vx = Vy
      if (this.vRegisters[getX(opcode)] == this.vRegisters[getY(opcode)]) {
        this.PC += 1;
      }
    } else if (firstByte == 0x6) {
      // Set Vx = kk
      this.vRegisters[getX(opcode)] = getKK(opcode);
    } else if (firstByte == 0x7) {
      // Set Vx = Vx + kk
      this.vRegisters[getX(opcode)] += getKK(opcode);
    } else if (firstByte == 0x8) {
      let nibble = getNibble(opcode);
      if (nibble == 0x0) {
        // Set Vx = Vy
        this.vRegisters[getX(opcode)] = this.vRegisters[getY(opcode)];
      } else if (nibble == 0x1) {
        // Set Vx = Vx OR Vy
        this.vRegisters[getX(opcode)] |= this.vRegisters[getY(opcode)];
      } else if (nibble == 0x2) {
        // Set Vx = Vx AND Vy
        this.vRegisters[getX(opcode)] &= this.vRegisters[getY(opcode)];
      } else if (nibble == 0x3) {
        // Set Vx = Vx XOR Vy
        this.vRegisters[getX(opcode)] ^= this.vRegisters[getY(opcode)];
      } else if (nibble == 0x4) {
        // Set Vx = Vx + Vy, set VF = carry
        let x = getX(opcode);
        this.vRegisters[x] += this.vRegisters[getY(opcode)];
        this.vRegisters[0xF] = (this.vRegisters[x] > 255) ? 1 : 0;
        this.vRegisters[x] &= 0xFFFFFFFF
      } else if (nibble == 0x5) {
        // Set Vx = Vx - Vy, set VF = NOT borrow
        let x = getX(opcode);
        let y = getY(opcode);
        this.vRegisters[0xF] = (this.vRegisters[x] > this.vRegisters[y]) ? 1 : 0;
        this.vRegisters[x] -= this.vRegisters[y];
      } else if (nibble == 0x6) {
        let x = getX(opcode);
        this.vRegisters[0xF] = (this.vRegisters[x] & 0x1) ? 1 : 0;
        this.vRegisters[x] = this.vRegisters[x] >> 1;
      } else if (nibble == 0x7) {
        // Set Vx = Vy - Vx, set VF = NOT borrow
        let x = getX(opcode);
        let y = getY(opcode);
        this.vRegisters[0xF] = (this.vRegisters[y] > this.vRegisters[x]) ? 1 : 0;
        this.vRegisters[x] = this.vRegisters[y] - this.vRegisters[x];
      } else if (nibble = 0xE) {
        let x = getX(opcode);
        this.vRegisters[0xF] = ((this.vRegisters[x] & 0x1) == 0x1) ? 1 : 0;
        this.vRegisters[x] = this.vRegisters[x] << 1;
      } else {
        return 0;
      }
    } else if (firstByte == 0x9) {
      // Skip next instruction if Vx != Vy
      if (this.vRegisters[getX(opcode)] != this.vRegisters[getY(opcode)]) {
        this.PC += 1;
      }
    } else if (firstByte == 0xA) {
      // Set I = nnn
      this.I = getNNN(opcode);
    } else if (firstByte == 0xB) {
      // Jump to location nnn + V0
      this.PC = getNNN(opcode) + this.vRegisters[0];
    } else if (firstByte == 0xC) {
      // Set Vx = random byte AND kk.
      this.vRegisters[getX(opcode)] = this.getRandomUint8() & getKK(opcode);
    } else if (firstByte == 0xD) {
      // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision
      let startX = this.vRegisters[getX(opcode)] & 0b111111;
      let startY = this.vRegisters[getY(opcode)] & 0b011111;
      let spriteHeight = getNibble(opcode);

      for (let y = 0; y < spriteHeight; y++) {
        let currentY = startY+y;
        if (currentY > 31) break;

        for (let x = 0; x < 8; x++) {
          let currentX = startX+x;
          if (currentX > 63) break;

          let pixelBefore = this.DISPLAY[currentY][currentX];
          let pixelAfter = pixelBefore ^ getNthBit(this.RAM[this.I+y], 7-x);
          this.DISPLAY[currentY][currentX] = pixelAfter;
          
          if (pixelBefore == 0x1 && pixelAfter == 0x0) {
            this.vRegisters[0xF] = 0x1;
          }
        }
      }
    } else if (firstByte == 0xE) {
      let kk = getKK(opcode);
      if (kk == 0x9E) {
        // Skip next instruction if key with the value of Vx is pressed
        
      } else if (kk == 0xA1) {
        // Skip next instruction if key with the value of Vx is not pressed.
      } else {
        return 0;
      }
    } else if (firstByte == 0xF) {

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