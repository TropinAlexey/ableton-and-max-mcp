import osc from 'osc';
const UDPPort = osc.UDPPort;
const DEBUG = process.env.DEBUG === 'true';
export class AbletonOSCClient {
    constructor(incomingPort = 11000, outgoingPort = 11001) {
        this.messageCallbacks = new Map();
        this.requestTimeout = 5000;
        this.isConnected_ = false;
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
            console.error('[OSC] Port error:', error.message);
            this.isConnected_ = false;
        });
        this.port.on('ready', () => {
            if (DEBUG)
                console.error('[OSC] Port ready');
            this.isConnected_ = true;
        });
    }
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.port.open();
                if (DEBUG)
                    console.error(`[OSC] Opening port on ${this.incomingPort} → ${this.outgoingPort}`);
                // Give it a moment to stabilize
                setTimeout(() => {
                    this.isConnected_ = true;
                    resolve();
                }, 100);
            }
            catch (error) {
                this.isConnected_ = false;
                reject(error);
            }
        });
    }
    disconnect() {
        if (this.port.socket) {
            this.port.close();
            this.isConnected_ = false;
            if (DEBUG)
                console.error('[OSC] Port closed');
        }
    }
    handleMessage(oscMsg) {
        const address = oscMsg.address;
        if (DEBUG)
            console.error(`[OSC] Message: ${address}`, oscMsg.args);
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
    send(address, args = []) {
        if (!this.port.socket) {
            throw new Error('OSC port is not open');
        }
        if (DEBUG)
            console.error(`[OSC] Send: ${address}`, args);
        const message = {
            address,
            args: args.map((arg) => ({ type: typeof arg === 'number' ? 'f' : 's', value: arg })),
        };
        try {
            this.port.send(message);
        }
        catch (error) {
            console.error(`[OSC] Send error on ${address}:`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async request(address, args = []) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.messageCallbacks.delete(address);
                if (DEBUG)
                    console.error(`[OSC] Request timeout: ${address}`);
                reject(new Error(`OSC request timeout: ${address}`));
            }, this.requestTimeout);
            const callback = (data) => {
                clearTimeout(timeoutId);
                this.messageCallbacks.delete(address);
                if (DEBUG)
                    console.error(`[OSC] Response: ${address}`, data);
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
    async healthCheck() {
        try {
            if (DEBUG)
                console.error('[OSC] Health check...');
            const result = await this.request('/live/song/get', ['tempo']);
            if (DEBUG)
                console.error('[OSC] Health check OK, tempo:', result);
            return result !== undefined && result !== null;
        }
        catch (error) {
            if (DEBUG)
                console.error('[OSC] Health check failed:', error instanceof Error ? error.message : String(error));
            return false;
        }
    }
    getConnectionStatus() {
        return {
            connected: this.isConnected_,
            port: this.incomingPort,
            remotePort: this.outgoingPort,
        };
    }
}
//# sourceMappingURL=osc-client.js.map