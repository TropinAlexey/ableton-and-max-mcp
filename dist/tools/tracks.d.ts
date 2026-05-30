import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';
export declare function createTracksTools(osc: AbletonOSCClient): Tool[];
export declare function executeTracksTool(osc: AbletonOSCClient, toolName: string, toolInput: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=tracks.d.ts.map