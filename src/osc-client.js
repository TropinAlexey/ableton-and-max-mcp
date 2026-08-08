import dgram from 'dgram';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';

const DEBUG = process.env.DEBUG === '1';
const TIMEOUT_MS = 5000;

// Load Rust native module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let osc_native;

try {
  osc_native = await import(path.join(__dirname, '../native/target/release/osc_native.node'));
} catch (e) {
  console.error('[OSC] Warning: Native module not loaded, using JS fallback');
  console.error('[OSC] Run: cd native && npm run build');
  osc_native = null;
}

// JS fallback if native not available
function jsParseOSC(buffer) {
  let pos = 0;

  function readString() {
    let end = pos;
    while (end < buffer.length && buffer[end] !== 0) end++;
    const str = buffer.toString('utf8', pos, end);
    pos = end + 1;
    while (pos % 4) pos++;
    return str;
  }

  const address = readString();
  const typeTag = readString();
  const args = [];

  if (!typeTag.startsWith(',')) return { address, args };

  for (let i = 1; i < typeTag.length; i++) {
    const type = typeTag[i];
    if (type === 'i') {
      args.push(buffer.readInt32BE(pos));
      pos += 4;
    } else if (type === 'f') {
      args.push(buffer.readFloatBE(pos));
      pos += 4;
    } else if (type === 's') {
      args.push(readString());
    } else if (type === 'b') {
      const len = buffer.readInt32BE(pos);
      pos += 4;
      args.push(buffer.subarray(pos, pos + len));
      pos += len;
      while (pos % 4) pos++;
    }
  }

  return { address, args };
}

function parseOSC(buffer) {
  if (osc_native) {
    try {
      return osc_native.parse(buffer);
    } catch (e) {
      console.error('[OSC] Native parse error:', e);
      return jsParseOSC(buffer);
    }
  }
  return jsParseOSC(buffer);
}

function writeOSC(address, args) {
  if (osc_native) {
    try {
      return osc_native.write(address, args);
    } catch (e) {
      console.error('[OSC] Native write error:', e);
      return writeOSCFallback(address, args);
    }
  }
  return writeOSCFallback(address, args);
}

function writeOSCFallback(address, args = []) {
  const buf = Buffer.allocUnsafe(4096);
  let pos = 0;

  const addrBytes = Buffer.from(address + '\0');
  addrBytes.copy(buf, pos);
  pos += addrBytes.length;
  while (pos % 4) buf[pos++] = 0;

  let typeTag = ',';
  const argBuffers = [];

  for (const arg of args) {
    if (typeof arg === 'number') {
      if (Number.isInteger(arg)) typeTag += 'i';
      else typeTag += 'f';
    } else if (typeof arg === 'string') {
      typeTag += 's';
    } else if (Buffer.isBuffer(arg)) {
      typeTag += 'b';
    }
  }

  const typeBytes = Buffer.from(typeTag + '\0');
  typeBytes.copy(buf, pos);
  pos += typeBytes.length;
  while (pos % 4) buf[pos++] = 0;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg === 'number') {
      if (Number.isInteger(arg)) {
        buf.writeInt32BE(arg, pos);
        pos += 4;
      } else {
        buf.writeFloatBE(arg, pos);
        pos += 4;
      }
    } else if (typeof arg === 'string') {
      const strBytes = Buffer.from(arg + '\0');
      strBytes.copy(buf, pos);
      pos += strBytes.length;
      while (pos % 4) buf[pos++] = 0;
    } else if (Buffer.isBuffer(arg)) {
      buf.writeInt32BE(arg.length, pos);
      pos += 4;
      arg.copy(buf, pos);
      pos += arg.length;
      while (pos % 4) buf[pos++] = 0;
    }
  }

  return buf.subarray(0, pos);
}

export class AbletonOSCClient extends EventEmitter {
  constructor(incomingPort = 11000, outgoingPort = 11001) {
    super();
    this.incomingPort = incomingPort;
    this.outgoingPort = outgoingPort;
    this.socket = null;
    this.connected = false;
    this.messageCallbacks = new Map();
    this.requestId = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket('udp4');
      this.socket.on('message', (msg) => this.handleMessage(msg));
      this.socket.on('error', reject);
      this.socket.on('listening', () => {
        this.connected = true;
        if (DEBUG) console.error('[OSC] Connected on port', this.incomingPort);
        resolve();
      });
      this.socket.bind(this.incomingPort);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.connected = false;
    }
  }

  handleMessage(buffer) {
    try {
      const msg = parseOSC(buffer);
      if (DEBUG) console.error('[OSC] Message:', msg.address, msg.args);

      const callback = this.messageCallbacks.get(msg.address);
      if (callback) {
        callback(msg.args.length === 1 ? msg.args[0] : msg.args);
        this.messageCallbacks.delete(msg.address);
      }

      this.emit('message', msg);
    } catch (e) {
      console.error('[OSC] Parse error:', e);
    }
  }

  send(address, args = []) {
    if (!this.socket) throw new Error('OSC not connected');

    const msg = writeOSC(address, args);
    this.socket.send(msg, 0, msg.length, this.outgoingPort, '127.0.0.1', (err) => {
      if (err) console.error('[OSC] Send error:', err);
    });
  }

  async request(address, args = []) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageCallbacks.delete(address);
        reject(new Error(`OSC timeout: ${address}`));
      }, TIMEOUT_MS);

      this.messageCallbacks.set(address, (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      try {
        this.send(address, args);
      } catch (e) {
        clearTimeout(timeout);
        this.messageCallbacks.delete(address);
        reject(e);
      }
    });
  }

  async healthCheck() {
    try {
      await this.request('/live/this/is_playing');
      return true;
    } catch {
      return false;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.connected,
      port: this.incomingPort,
      remotePort: this.outgoingPort,
    };
  }
}
