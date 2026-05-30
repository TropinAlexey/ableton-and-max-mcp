import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';
export declare function createDevicesTools(osc: AbletonOSCClient): Tool[];
export declare function executeDevicesTool(osc: AbletonOSCClient, toolName: string, toolInput: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=devices.d.ts.map