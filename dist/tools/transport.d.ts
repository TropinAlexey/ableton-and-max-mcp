import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';
export declare function createTransportTools(osc: AbletonOSCClient): Tool[];
export declare function executeTransportTool(osc: AbletonOSCClient, toolName: string, toolInput: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=transport.d.ts.map