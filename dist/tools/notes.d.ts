import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';
export declare function createNotesTools(osc: AbletonOSCClient): Tool[];
export declare function executeNotesTool(osc: AbletonOSCClient, toolName: string, toolInput: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=notes.d.ts.map