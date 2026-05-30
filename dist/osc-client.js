import { UDPPort } from 'osc';
export class AbletonOSCClient {
    constructor(incomingPort = 11000, outgoingPort = 11001) {
        this.messageCallbacks = new Map();
        this.requestTimeout = 5000; // 5 seconds
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
        this.port.on('message', (...args) => {
            const oscMsg = args[0];
            this.handleMessage(oscMsg);
        });
        this.port.on('error', (...args) => {
            const error = args[0];
            console.error('OSC Port error:', error);
        });
    }
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.port.open();
                // Give it a moment to stabilize
                setTimeout(() => resolve(), 100);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    disconnect() {
        if (this.port.isOpen()) {
            this.port.close();
        }
    }
    handleMessage(oscMsg) {
        const address = oscMsg.address;
        // Extract base address (without trailing ID for responses)
        const baseAddress = address.replace(/\/response\/.*/, '').replace(/\d+$/, '');
        const callback = this.messageCallbacks.get(baseAddress);
        if (callback) {
            const data = oscMsg.args?.length === 1 ? oscMsg.args[0] : oscMsg.args;
            callback(data);
        }
    }
    send(address, args = []) {
        const message = {
            address,
            args: args.map((arg) => ({ type: typeof arg === 'number' ? 'f' : 's', value: arg })),
        };
        this.port.send(message);
    }
    async request(address, args = []) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.messageCallbacks.delete(address);
                reject(new Error(`OSC request timeout: ${address}`));
            }, this.requestTimeout);
            const callback = (data) => {
                clearTimeout(timeoutId);
                this.messageCallbacks.delete(address);
                resolve(data);
            };
            this.messageCallbacks.set(address, callback);
            try {
                this.send(address, args);
            }
            catch (error) {
                clearTimeout(timeoutId);
                this.messageCallbacks.delete(address);
                reject(error);
            }
        });
    }
    async isConnected() {
        try {
            // Try to get transport state as a health check
            const result = await this.request('/live/song/get', ['transport_position']);
            return result !== undefined;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=osc-client.js.map