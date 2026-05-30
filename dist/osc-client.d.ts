export declare class AbletonOSCClient {
    private port;
    private incomingPort;
    private outgoingPort;
    private messageCallbacks;
    private requestTimeout;
    constructor(incomingPort?: number, outgoingPort?: number);
    connect(): Promise<void>;
    disconnect(): void;
    private handleMessage;
    send(address: string, args?: (string | number | Buffer)[]): void;
    request(address: string, args?: (string | number | Buffer)[]): Promise<unknown>;
    isConnected(): Promise<boolean>;
}
//# sourceMappingURL=osc-client.d.ts.map