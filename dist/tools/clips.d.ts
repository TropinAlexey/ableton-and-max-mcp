import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';
export declare function createClipsTools(osc: AbletonOSCClient): Tool[];
export declare function executeClipsTool(osc: AbletonOSCClient, toolName: string, toolInput: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=clips.d.ts.map