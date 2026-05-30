declare module 'osc' {
  export class UDPPort {
    constructor(options: {
      localAddress: string;
      localPort: number;
      remoteAddress: string;
      remotePort: number;
      broadcast: boolean;
      metadata: boolean;
    });
    open(): void;
    close(): void;
    isOpen(): boolean;
    send(message: Record<string, unknown>): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
  }

  const osc: {
    UDPPort: typeof UDPPort;
  };

  export default osc;
}
