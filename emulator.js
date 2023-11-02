class CHIP8_Emulator {
  constructor() {
    this.RAM = new Uint8Array(0x1000).fill(0x00);
    this.PC = 0x0200;
    this.SP = 0x00;
    this.I = 0x0000;
    this.DT = 0x0;
    this.ST = 0x0;
    this.vRegisters = new Uint8Array(16).fill(0x00);
  }

  loadProgram(buffer) {
    const instructions = new DataView(buffer);
    for (let i = 0; i < instructions.byteLength; i += 1) {
      this.RAM[i+0x0200] = instructions.getUint8(i);
    }
  }

  run() {
    let opcode = (this.RAM[this.PC] << 8) | this.RAM[this.PC+1]
    this.execOpcode(opcode);
    this.execOpcode(opcode);
    this.execOpcode(opcode);
    this.execOpcode(opcode);
    this.execOpcode(opcode);
  }

  //0x0NNN
  //0x0X00
  //0x00Y0
  //0x000N
  //0X00KK

  execOpcode(opcode) {
    if (opcode == 0x00E0) {
      console.log("Clear screen");
    } else if (getFirstByte(opcode) == 0xA) {
      this.I = opcode & 0x0FFF;
    } else if (getFirstByte(opcode) == 0x6) {
      this.vRegisters[getX(opcode)] = getKK(opcode);
    } else if (getFirstByte(opcode) == 0xD) {
      getX(opcode)
      getY(opcode);
      getNibble(opcode);
    } else if (getFirstByte(opcode) == 0x1) {
      this.I = getNNN(opcode) - 0x200;
    } else {
      console.log("Invalid opcode", opcode)
    }
  }
}

window.onload = function() {
  var fileInput = document.getElementById('fileInput');

  fileInput.addEventListener('change', function(e) {
    var file = fileInput.files[0];

    var reader = new FileReader();

    reader.onload = function(e) {
      // console.log(reader.result.data);
      let emulator = new CHIP8_Emulator()
      emulator.loadProgram(reader.result);

      emulator.run();
    }

    reader.readAsArrayBuffer(file);
  });
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