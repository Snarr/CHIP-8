let default_font = [0b11110000,0b10010000,0b10010000,0b10010000,0b11110000,0b00100000,0b01100000,0b00100000,0b00100000,0b01110000,0b11110000,0b00010000,0b11110000,0b10000000,0b11110000,0b11110000,0b00010000,0b11110000,0b00010000,0b11110000,0b10010000,0b10010000,0b11110000,0b00010000,0b00010000,0b11110000,0b10000000,0b11110000,0b00010000,0b11110000,0b11110000,0b10000000,0b11110000,0b10010000,0b11110000,0b11110000,0b00010000,0b00100000,0b01000000,0b01000000,0b11110000,0b10010000,0b11110000,0b10010000,0b11110000,0b11110000,0b10010000,0b11110000,0b00010000,0b11110000,0b11110000,0b10010000,0b11110000,0b10010000,0b10010000,0b11100000,0b10010000,0b11100000,0b10010000,0b11100000,0b11110000,0b10000000,0b10000000,0b10000000,0b11110000,0b11100000,0b10010000,0b10010000,0b10010000,0b11100000,0b11110000,0b10000000,0b11110000,0b10000000,0b11110000,0b11110000,0b10000000,0b11110000,0b10000000,0b10000000];

export class CHIP8_Emulator {
  constructor() {
    this.RAM = new Uint8Array(4096).fill(0x00);
    this.STACK = new Uint16Array(16).fill(0x00);
    this.PC = 0x0200; // Program counter
    this.SP = 0x00; // Stack pointer
    this.I = 0x0000;
    this.DT = 0x0; // Delay timer
    this.ST = 0x0; // Sound timer
    this.vRegisters = new Uint8Array(16).fill(0x00);
    this.KEYMAP = new Array(16).fill(0x0);

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
    console.log("Program loaded...")
  }

  step() {
    this.execOpcode((this.RAM[this.PC] << 8) | this.RAM[this.PC+1])
    this.PC += 0x2;
  }

  setKey(key, state) {
    this.KEYMAP[key] = state;
  }

  logError(opcode) {
    console.log(`Invalid opcode 0x${opcode.toString(16)}`)
  }

  decrementTimers() {
    if (this.DT > 0) {
      this.DT--;
    }
    if (this.ST > 0) {
      this.ST--;
    }
  }

  //0x0NNN
  //0x0X00
  //0x00Y0
  //0x000N
  //0X00KK

  execOpcode(opcode) {
    console.log(`0x${opcode.toString(16)}`)
    
    let firstByte = getFirstByte(opcode);
  
    switch (firstByte) {
      case 0x0:
        let kk = getKK(opcode);
        switch (kk) {
          case 0xE0:
            // Clear the display
            for (let i = 0; i < 32; i++) {
              this.DISPLAY[i] = new Array(64).fill(0);
            }
            break;
          case 0xEE:
            // Return from a subroutine
            this.PC = this.STACK[this.SP];
            this.SP--;
            break;
          default:
            this.logError(opcode);
            break;
        }
        break;
      case 0x1:
        // Jump to location nnn, subtract 0x2
        this.PC = getNNN(opcode) - 0x2;
        break;
      case 0x2:
        // Call subroutine at nnn, subtract 0x2
        this.SP++;
        this.STACK[this.SP] = this.PC;
        this.PC = getNNN(opcode) - 0x2;
        break;
      case 0x3:
        // Skip next instruction if Vx == kk
        if (this.vRegisters[getX(opcode)] == getKK(opcode)) {
          this.PC += 2;
        }
        break;
      case 0x4:
        // Skip next instruction if Vx != kk
        if (this.vRegisters[getX(opcode)] != getKK(opcode)) {
          this.PC += 2;
        }
        break;
      case 0x5:
        // Skip next instruction if Vx = Vy
        if (this.vRegisters[getX(opcode)] == this.vRegisters[getY(opcode)]) {
          this.PC += 2;
        }
        break;
      case 0x6:
        // Set Vx = kk
        this.vRegisters[getX(opcode)] = getKK(opcode);
        break;
      case 0x7:
        // Set Vx = Vx + kk
        this.vRegisters[getX(opcode)] += getKK(opcode);
        break;
      case 0x8:
        let nibble = getNibble(opcode);
        switch (nibble) {
          case 0x0:
            // Set Vx = Vy
            this.vRegisters[getX(opcode)] = this.vRegisters[getY(opcode)];
            break;
          case 0x1:
            // Set Vx = Vx OR Vy
            this.vRegisters[getX(opcode)] |= this.vRegisters[getY(opcode)];
            break;
          case 0x2:
            // Set Vx = Vx AND Vy
            this.vRegisters[getX(opcode)] &= this.vRegisters[getY(opcode)];
            break;
          case 0x3:
            // Set Vx = Vx XOR Vy
            this.vRegisters[getX(opcode)] ^= this.vRegisters[getY(opcode)];
            break;
          case 0x4: {
            // Set Vx = Vx + Vy, set VF = carry
            let x = getX(opcode);
            this.vRegisters[x] += this.vRegisters[getY(opcode)];
            this.vRegisters[0xF] = (this.vRegisters[x] > 255) ? 1 : 0;
            this.vRegisters[x] &= 0xFFFFFFFF 
            break;
          }
          case 0x5: {
            // Set Vx = Vx - Vy, set VF = NOT borrow
            let x = getX(opcode);
            let y = getY(opcode);
            this.vRegisters[0xF] = (this.vRegisters[x] > this.vRegisters[y]) ? 1 : 0;
            this.vRegisters[x] -= this.vRegisters[y];
            break;
          }
          case 0x6: {
            // VF = Least significant bit of Vx, Set Vx = Vx SHR 1,
            let x = getX(opcode);
            this.vRegisters[0xF] = this.vRegisters[x] & 0x1;
            this.vRegisters[x] = this.vRegisters[x] >> 1;
            break;
          }
          case 0x7: {
            // Set Vx = Vy - Vx, set VF = NOT borrow
            let x = getX(opcode);
            let y = getY(opcode);
            this.vRegisters[0xF] = (this.vRegisters[y] > this.vRegisters[x]) ? 1 : 0;
            this.vRegisters[x] = this.vRegisters[y] - this.vRegisters[x];
            break;
          }
          case 0xE:
            // Set VF = Most significant bit of Vx, Set Vx = Vx SHL 1;
            let x = getX(opcode);
            this.vRegisters[0xF] = (this.vRegisters[x] >> 7) & 0x1
            this.vRegisters[x] = this.vRegisters[x] << 1;
            break;
          default:
            this.logError(opcode);
        }
        break;
      case 0x9:
        // Skip next instruction if Vx != Vy
        if (this.vRegisters[getX(opcode)] != this.vRegisters[getY(opcode)]) {
          this.PC += 2;
        }
        break;
      case 0xA:
        // Set I = nnn
        this.I = getNNN(opcode);
        break;
      case 0xB:
        // Jump to location nnn + V0
        this.PC = getNNN(opcode) + this.vRegisters[0];
        break;
      case 0xC:
        // Set Vx = random byte AND kk.
        this.vRegisters[getX(opcode)] = this.getRandomUint8() & getKK(opcode);
        break;
      case 0xD: {
        // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision
        let startX = this.vRegisters[getX(opcode)] & 0b111111;
        let startY = this.vRegisters[getY(opcode)] & 0b011111;
        let spriteHeight = getNibble(opcode);

        this.vRegisters[0xF] = 0;
  
        // Draw the sprite on the screen starting left to right, top to bottom.
        for (let y = 0; y < spriteHeight; y++) {
          // Find current Y coordinate by adding Vy value and Loop Variable y
          let currentY = startY+y;
          if (currentY > 31) break;
  
          for (let x = 0; x < 8; x++) {
            // Find current X coordinate by adding Vx value and Loop Variable x
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
        break;
      }
      case 0xE: {
        let kk = getKK(opcode);

        switch (kk) {
          case 0x9E: {
            // Skip next instruction if key with the value of Vx is pressed
            if (this.KEYMAP[getX(opcode)] == 1) {
              this.PC += 0x2;
            }
            break;
          }
          case 0xA1: {
            // Skip next instruction if key with the value of Vx is not pressed.
            if (this.KEYMAP[getX(opcode)] == 0) {
              this.PC += 0x2;
            }
            break;
          }
          default: {
            this.logError(opcode);
            break;
          }
        }
        break;
      }
      case 0xF: {
        let kk = getKK(opcode);

        switch (kk) {
          case 0x07: {
            // Set Vx = delay timer value
            this.vRegisters[getX(opcode)] = this.DT;
            break;
          }
          case 0x0A: {
            // Wait for a key press, store the value of the key in Vx
            
            break;
          }
          case 0x15: {
            // Set delay timer = Vx
            this.DT = this.vRegisters[getX(opcode)];
            break;
          }
          case 0x18: {
            // Set sound timer = Vx
            this.ST = this.vRegisters[getX(opcode)];
            break;
          }
          case 0x1E: {
            // Set I = I + Vx
            this.I += this.vRegisters[getX(opcode)];
            break;
          }
          case 0x29: {
            // Set I = location of sprite for digit Vx
            this.I = this.vRegisters[getX(opcode)] * 5;
            break;
          }
          case 0x33: {
            // Store BCD representation of Vx in memory locations I, I+1, and I+2
            let x = getX(opcode);
            let Vx = this.vRegisters[x];
  
            this.RAM[this.I] = Math.floor(Vx/100);
            this.RAM[this.I + 1] = Math.floor((Vx/10) % 10); 
            this.RAM[this.I + 2] = Math.floor(Vx % 10);
            break;
          }
          case 0x55: {
            // Store registers V0 through Vx in memory starting at location I
            let x = getX(opcode);
            for (let i = 0; i <= x; i++) {
              this.RAM[this.I + i] = this.vRegisters[i]; 
            }
            break;
          }
          case 0x65: {
            // Read registers V0 through Vx from memory starting at location I
            let x = getX(opcode);
            for (let i = 0; i <= x; i++) {
              this.vRegisters[i] = this.RAM[this.I+i];
            } 
            break;
          }
          default: {
            this.logError(opcode);
            break;
          }
          
        }
        break;
      }
      default:
        this.logError(opcode);
    }
  }

  getDisplay() {
    return this.DISPLAY;
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