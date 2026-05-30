import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';

export function createMaxTools(osc: AbletonOSCClient): Tool[] {
  return [
    {
      name: 'max_list_devices',
      description: 'List all Max for Live devices in current project',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'max_send_message',
      description: 'Send a message to a Max for Live device',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index containing M4L device',
          },
          deviceIndex: {
            type: 'number',
            description: 'Device index on track',
          },
          message: {
            type: 'string',
            description: 'Message to send to Max device',
          },
        },
        required: ['trackIndex', 'deviceIndex', 'message'],
      },
    },
    {
      name: 'max_get_parameter',
      description: 'Get Max for Live device parameter value',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
          deviceIndex: {
            type: 'number',
            description: 'Device index on track',
          },
          parameterName: {
            type: 'string',
            description: 'Parameter name',
          },
        },
        required: ['trackIndex', 'deviceIndex', 'parameterName'],
      },
    },
    {
      name: 'max_set_parameter',
      description: 'Set Max for Live device parameter value',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
          deviceIndex: {
            type: 'number',
            description: 'Device index on track',
          },
          parameterName: {
            type: 'string',
            description: 'Parameter name',
          },
          value: {
            type: 'number',
            description: 'Parameter value',
          },
        },
        required: ['trackIndex', 'deviceIndex', 'parameterName', 'value'],
      },
    },
  ];
}

export async function executeMaxTool(
  osc: AbletonOSCClient,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  try {
    switch (toolName) {
      case 'max_list_devices':
        return {
          success: true,
          message: 'max_list_devices requires full Max for Live integration',
          devices: [],
        };

      case 'max_send_message': {
        const trackIndex = toolInput.trackIndex as number;
        const deviceIndex = toolInput.deviceIndex as number;
        const message = toolInput.message as string;

        if (!trackIndex && trackIndex !== 0) throw new Error('Track index required');
        if (!deviceIndex && deviceIndex !== 0) throw new Error('Device index required');
        if (!message) throw new Error('Message required');

        osc.send(`/live/track/${trackIndex}/devices/${deviceIndex}/max/message`, [message]);
        return { success: true, message: `Message sent: "${message}"` };
      }

      case 'max_get_parameter': {
        const trackIndex = toolInput.trackIndex as number;
        const deviceIndex = toolInput.deviceIndex as number;
        const parameterName = toolInput.parameterName as string;

        if (!trackIndex && trackIndex !== 0) throw new Error('Track index required');
        if (!deviceIndex && deviceIndex !== 0) throw new Error('Device index required');
        if (!parameterName) throw new Error('Parameter name required');

        const value = await osc.request(
          `/live/track/${trackIndex}/devices/${deviceIndex}/max/parameters/${parameterName}/value`
        );
        return { success: true, value };
      }

      case 'max_set_parameter': {
        const trackIndex = toolInput.trackIndex as number;
        const deviceIndex = toolInput.deviceIndex as number;
        const parameterName = toolInput.parameterName as string;
        const value = toolInput.value as number;

        if (!trackIndex && trackIndex !== 0) throw new Error('Track index required');
        if (!deviceIndex && deviceIndex !== 0) throw new Error('Device index required');
        if (!parameterName) throw new Error('Parameter name required');

        osc.send(`/live/track/${trackIndex}/devices/${deviceIndex}/max/parameters/${parameterName}/set`, [
          value,
        ]);
        return { success: true, message: `Parameter "${parameterName}" set to ${value}` };
      }

      default:
        throw new Error(`Unknown Max tool: ${toolName}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
