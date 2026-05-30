import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from './osc-client.js';
import { createTransportTools, executeTransportTool } from './tools/transport.js';
import { createTracksTools, executeTracksTool } from './tools/tracks.js';
import { createClipsTools, executeClipsTool } from './tools/clips.js';
import { createNotesTools, executeNotesTool } from './tools/notes.js';
import { createDevicesTools, executeDevicesTool } from './tools/devices.js';
import { createMaxTools, executeMaxTool } from './tools/max.js';

const osc = new AbletonOSCClient();

// Collect all tools
const allTools = [
  ...createTransportTools(osc),
  ...createTracksTools(osc),
  ...createClipsTools(osc),
  ...createNotesTools(osc),
  ...createDevicesTools(osc),
  ...createMaxTools(osc),
];

const server = new Server({
  name: 'ableton-and-max-mcp',
  version: '0.1.0',
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request;
  const toolInput = (args || {}) as Record<string, unknown>;

  try {
    // Check if Ableton is connected
    const abetonConnected = await osc.healthCheck();
    if (!abetonConnected) {
      const status = osc.getConnectionStatus();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Ableton Live is not connected. Please start Ableton with AbletonOSC Remote Script enabled.',
              debugInfo: {
                oscStatus: status,
                message: `Cannot reach Ableton on 127.0.0.1:${status.remotePort}`,
              },
            }),
          },
        ],
      };
    }

    let result: unknown;

    // Route to appropriate tool handler
    if (name.startsWith('transport_')) {
      result = await executeTransportTool(osc, name, toolInput);
    } else if (name.startsWith('tracks_')) {
      result = await executeTracksTool(osc, name, toolInput);
    } else if (name.startsWith('clips_')) {
      result = await executeClipsTool(osc, name, toolInput);
    } else if (name.startsWith('notes_')) {
      result = await executeNotesTool(osc, name, toolInput);
    } else if (name.startsWith('devices_')) {
      result = await executeDevicesTool(osc, name, toolInput);
    } else if (name.startsWith('max_')) {
      result = await executeMaxTool(osc, name, toolInput);
    } else {
      result = { success: false, error: `Unknown tool: ${name}` };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
    };
  }
});

// Main
async function main() {
  try {
    await osc.connect();
    console.error('OSC Client connected to Ableton');

    // Check connection
    const connected = await osc.healthCheck();
    if (!connected) {
      console.error(
        'Warning: Could not reach Ableton. Make sure Ableton Live is running with AbletonOSC Remote Script enabled.'
      );
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Server started');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
