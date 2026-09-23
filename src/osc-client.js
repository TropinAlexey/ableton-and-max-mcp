import dgram from 'dgram';
import { EventEmitter } from 'events';

const DEBUG = process.env.DEBUG === '1';
const TIMEOUT_MS = 5000;
const HEALTH_CACHE_TTL_MS = 10000;

function parseOSC(buffer) {
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

function flattenArgs(args) {
  const flat = [];
  for (const arg of args) {
    if (Array.isArray(arg)) {
      flat.push(...flattenArgs(arg));
    } else if (arg !== null && arg !== undefined && typeof arg === 'object' && !Buffer.isBuffer(arg)) {
      flat.push(...flattenArgs(Object.values(arg)));
    } else {
      flat.push(arg);
    }
  }
  return flat;
}

function writeOSC(address, args = []) {
  const flatArgs = flattenArgs(args);

  const addrBuf = Buffer.from(address + '\0');
  const addrPadded = Buffer.alloc(Math.ceil(addrBuf.length / 4) * 4);
  addrBuf.copy(addrPadded);

  let typeTag = ',';
  const argBuffers = [];

  for (const arg of flatArgs) {
    if (typeof arg === 'number') {
      if (Number.isInteger(arg)) {
        typeTag += 'i';
        const b = Buffer.alloc(4);
        b.writeInt32BE(arg, 0);
        argBuffers.push(b);
      } else {
        typeTag += 'f';
        const b = Buffer.alloc(4);
        b.writeFloatBE(arg, 0);
        argBuffers.push(b);
      }
    } else if (typeof arg === 'string') {
      typeTag += 's';
      const strBuf = Buffer.from(arg + '\0');
      const padded = Buffer.alloc(Math.ceil(strBuf.length / 4) * 4);
      strBuf.copy(padded);
      argBuffers.push(padded);
    } else if (Buffer.isBuffer(arg)) {
      typeTag += 'b';
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeInt32BE(arg.length, 0);
      const padded = Buffer.alloc(Math.ceil(arg.length / 4) * 4);
      arg.copy(padded);
      argBuffers.push(Buffer.concat([lenBuf, padded]));
    } else if (typeof arg === 'boolean') {
      typeTag += 'i';
      const b = Buffer.alloc(4);
      b.writeInt32BE(arg ? 1 : 0, 0);
      argBuffers.push(b);
    }
  }

  const typeBuf = Buffer.from(typeTag + '\0');
  const typePadded = Buffer.alloc(Math.ceil(typeBuf.length / 4) * 4);
  typeBuf.copy(typePadded);

  return Buffer.concat([addrPadded, typePadded, ...argBuffers]);
}

export class AbletonOSCClient extends EventEmitter {
  constructor(incomingPort = 11000, outgoingPort = 11001) {
    super();
    this.incomingPort = incomingPort;
    this.outgoingPort = outgoingPort;
    this.socket = null;
    this.connected = false;
    this.messageCallbacks = new Map();
    this.requestQueue = [];
    this.processing = false;
    this.healthCacheValid = false;
    this.healthCacheTime = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket('udp4');
      this.socket.on('message', (msg) => this.handleMessage(msg));
      this.socket.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(
            `Port ${this.incomingPort} already in use. Is another instance running? Check: lsof -i :${this.incomingPort}`
          ));
        } else {
          reject(err);
        }
      });
      this.socket.on('listening', () => {
        this.connected = true;
        if (DEBUG) console.error('[OSC] Connected on port', this.incomingPort);
        resolve();
      });
      this.socket.bind(this.incomingPort, '127.0.0.1');
    });
  }

  disconnect() {
    for (const { reject } of this.requestQueue) {
      reject(new Error('OSC client disconnecting'));
    }
    this.requestQueue = [];
    this.processing = false;
    for (const [address, callback] of this.messageCallbacks) {
      this.messageCallbacks.delete(address);
    }
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
      this.requestQueue.push({ address, args, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;
    this.processing = true;

    const { address, args, resolve, reject } = this.requestQueue.shift();

    const timeout = setTimeout(() => {
      this.messageCallbacks.delete(address);
      this.processing = false;
      reject(new Error(`OSC timeout: ${address}`));
      this.processQueue();
    }, TIMEOUT_MS);

    this.messageCallbacks.set(address, (data) => {
      clearTimeout(timeout);
      this.processing = false;
      resolve(data);
      this.processQueue();
    });

    try {
      this.send(address, args);
    } catch (e) {
      clearTimeout(timeout);
      this.messageCallbacks.delete(address);
      this.processing = false;
      reject(e);
      this.processQueue();
    }
  }

  async healthCheck() {
    const now = Date.now();
    if (this.healthCacheValid && (now - this.healthCacheTime) < HEALTH_CACHE_TTL_MS) {
      return true;
    }
    try {
      await this.directRequest('/live/this/is_playing');
      this.healthCacheValid = true;
      this.healthCacheTime = now;
      return true;
    } catch {
      this.healthCacheValid = false;
      return false;
    }
  }

  async directRequest(address, args = []) {
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

  getConnectionStatus() {
    return {
      connected: this.connected,
      port: this.incomingPort,
      remotePort: this.outgoingPort,
    };
  }
}
