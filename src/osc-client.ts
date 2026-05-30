import osc from 'osc';
import type { OSCMessage, OSCResponse } from './types.js';

const UDPPort = osc.UDPPort;

const DEBUG = process.env.DEBUG === 'true';

export class AbletonOSCClient {
  private port: InstanceType<typeof UDPPort>;
  private incomingPort: number;
  private outgoingPort: number;
  private messageCallbacks: Map<string, (data: unknown) => void> = new Map();
  private requestTimeout: number = 5000;
  private isConnected_: boolean = false;

  constructor(incomingPort: number = 11000, outgoingPort: number = 11001) {
    this.incomingPort = incomingPort;
    this.outgoingPort = outgoingPort;

    this.port = new UDPPort({
      localAddress: '127.0.0.1',
      localPort: this.incomingPort,
      remoteAddress: '127.0.0.1',
      remotePort: this.outgoingPort,
      broadcast: false,
      metadata: false,
    });

    this.port.on('message', (...args: unknown[]) => {
      const oscMsg = args[0] as OSCMessage;
      this.handleMessage(oscMsg);
    });

    this.port.on('error', (...args: unknown[]) => {
      const error = args[0] as Error;
      console.error('[OSC] Port error:', error.message);
      this.isConnected_ = false;
    });

    this.port.on('ready', () => {
      if (DEBUG) console.error('[OSC] Port ready');
      this.isConnected_ = true;
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.port.open();
        if (DEBUG) console.error(`[OSC] Opening port on ${this.incomingPort} → ${this.outgoingPort}`);
        // Give it a moment to stabilize
        setTimeout(() => {
          this.isConnected_ = true;
          resolve();
        }, 100);
      } catch (error) {
        this.isConnected_ = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if ((this.port as any).socket) {
      this.port.close();
      this.isConnected_ = false;
      if (DEBUG) console.error('[OSC] Port closed');
    }
  }

  private handleMessage(oscMsg: OSCMessage): void {
    const address = oscMsg.address;
    if (DEBUG) console.error(`[OSC] Message: ${address}`, oscMsg.args);

    // Try direct address first
    let callback = this.messageCallbacks.get(address);

    // If not found, try with /response appended
    if (!callback) {
      const responseAddr = address.replace(/\/response/, '');
      callback = this.messageCallbacks.get(responseAddr);
    }

    if (callback) {
      const data = oscMsg.args?.length === 1 ? oscMsg.args[0] : oscMsg.args;
      callback(data);
    }
  }

  send(address: string, args: (string | number | Buffer)[] = []): void {
    if (!(this.port as any).socket) {
      throw new Error('OSC port is not open');
    }

    if (DEBUG) console.error(`[OSC] Send: ${address}`, args);

    const message = {
      address,
      args: args.map((arg) => ({ type: typeof arg === 'number' ? 'f' : 's', value: arg })),
    };

    try {
      this.port.send(message);
    } catch (error) {
      console.error(`[OSC] Send error on ${address}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async request(address: string, args: (string | number | Buffer)[] = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageCallbacks.delete(address);
        if (DEBUG) console.error(`[OSC] Request timeout: ${address}`);
        reject(new Error(`OSC request timeout: ${address}`));
      }, this.requestTimeout);

      const callback = (data: unknown) => {
        clearTimeout(timeoutId);
        this.messageCallbacks.delete(address);
        if (DEBUG) console.error(`[OSC] Response: ${address}`, data);
        resolve(data);
      };

      this.messageCallbacks.set(address, callback);

      try {
        this.send(address, args);
      } catch (error) {
        clearTimeout(timeoutId);
        this.messageCallbacks.delete(address);
        reject(error);
      }
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (DEBUG) console.error('[OSC] Health check...');
      const result = await this.request('/live/song/get', ['tempo']);
      if (DEBUG) console.error('[OSC] Health check OK, tempo:', result);
      return result !== undefined && result !== null;
    } catch (error) {
      if (DEBUG) console.error('[OSC] Health check failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  getConnectionStatus(): { connected: boolean; port: number; remotePort: number } {
    return {
      connected: this.isConnected_,
      port: this.incomingPort,
      remotePort: this.outgoingPort,
    };
  }
}
