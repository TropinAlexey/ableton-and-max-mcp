import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { AbletonOSCClient } from './osc-client.js';
import { transportTools, executeTransportTool } from './tools/transport.js';
import { tracksTools, executeTracksTool } from './tools/tracks.js';
import { clipsTools, executeClipsTool } from './tools/clips.js';
import { notesTools, executeNotesTool } from './tools/notes.js';
import { devicesTools, executeDevicesTool } from './tools/devices.js';
import { maxTools, executeMaxTool } from './tools/max.js';

const osc = new AbletonOSCClient();

const toolModules = [
  { tools: transportTools, exec: executeTransportTool },
  { tools: tracksTools, exec: executeTracksTool },
  { tools: clipsTools, exec: executeClipsTool },
  { tools: notesTools, exec: executeNotesTool },
  { tools: devicesTools, exec: executeDevicesTool },
  { tools: maxTools, exec: executeMaxTool },
];

const server = new McpServer({
  name: 'ableton-and-max-mcp',
  version: '2.0.0',
});

async function handleTool(executor, name, args) {
  try {
    const connected = await osc.healthCheck();
    if (!connected) {
      const status = osc.getConnectionStatus();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Ableton Live not connected. Enable AbletonOSC Remote Script.',
            debug: { port: status.remotePort, connected: status.connected },
          }),
        }],
      };
    }

    const result = await executor(osc, name, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: false, error: error.message }),
      }],
    };
  }
}

for (const { tools, exec } of toolModules) {
  for (const [name, config] of Object.entries(tools)) {
    server.registerTool(
      name,
      config,
      async (args) => handleTool(exec, name, args),
    );
  }
}

function shutdown() {
  console.error('Shutting down...');
  osc.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  try {
    await osc.connect();
    console.error('OSC connected');

    const connected = await osc.healthCheck();
    if (!connected) {
      console.error('Warning: Ableton unreachable. Start with AbletonOSC enabled.');
    }

    await serveStdio(server);
    console.error('MCP server running (v2.0)');
  } catch (error) {
    console.error('Fatal:', error.message);
    process.exit(1);
  }
}

main();
