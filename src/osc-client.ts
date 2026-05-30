import { UDPPort } from 'osc';
import type { OSCMessage, OSCResponse } from './types.js';

export class AbletonOSCClient {
  private port: UDPPort;
  private incomingPort: number;
  private outgoingPort: number;
  private messageCallbacks: Map<string, (data: unknown) => void> = new Map();
  private requestTimeout: number = 5000; // 5 seconds

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
      console.error('OSC Port error:', error);
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.port.open();
        // Give it a moment to stabilize
        setTimeout(() => resolve(), 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.port.isOpen()) {
      this.port.close();
    }
  }

  private handleMessage(oscMsg: OSCMessage): void {
    const address = oscMsg.address;
    // Extract base address (without trailing ID for responses)
    const baseAddress = address.replace(/\/response\/.*/, '').replace(/\d+$/, '');

    const callback = this.messageCallbacks.get(baseAddress);
    if (callback) {
      const data = oscMsg.args?.length === 1 ? oscMsg.args[0] : oscMsg.args;
      callback(data);
    }
  }

  send(address: string, args: (string | number | Buffer)[] = []): void {
    const message = {
      address,
      args: args.map((arg) => ({ type: typeof arg === 'number' ? 'f' : 's', value: arg })),
    };
    this.port.send(message);
  }

  async request(address: string, args: (string | number | Buffer)[] = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageCallbacks.delete(address);
        reject(new Error(`OSC request timeout: ${address}`));
      }, this.requestTimeout);

      const callback = (data: unknown) => {
        clearTimeout(timeoutId);
        this.messageCallbacks.delete(address);
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

  async isConnected(): Promise<boolean> {
    try {
      // Try to get transport state as a health check
      const result = await this.request('/live/song/get', ['transport_position']);
      return result !== undefined;
    } catch {
      return false;
    }
  }
}
