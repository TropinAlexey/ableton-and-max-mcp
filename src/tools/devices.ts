import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';

export function createDevicesTools(osc: AbletonOSCClient): Tool[] {
  return [
    {
      name: 'devices_list',
      description: 'Get all devices (effects) on a track',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
        },
        required: ['trackIndex'],
      },
    },
    {
      name: 'devices_get_parameters',
      description: 'Get all parameters of a device',
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
        },
        required: ['trackIndex', 'deviceIndex'],
      },
    },
    {
      name: 'devices_set_parameter',
      description: 'Set device parameter value',
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
            description: 'Parameter value (0.0-1.0)',
          },
        },
        required: ['trackIndex', 'deviceIndex', 'parameterName', 'value'],
      },
    },
    {
      name: 'devices_enable',
      description: 'Enable device (turn on)',
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
        },
        required: ['trackIndex', 'deviceIndex'],
      },
    },
    {
      name: 'devices_disable',
      description: 'Disable device (turn off)',
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
        },
        required: ['trackIndex', 'deviceIndex'],
      },
    },
  ];
}

export async function executeDevicesTool(
  osc: AbletonOSCClient,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  try {
    const trackIndex = toolInput.trackIndex as number | undefined;
    const deviceIndex = toolInput.deviceIndex as number | undefined;

    switch (toolName) {
      case 'devices_list':
        if (trackIndex === undefined) throw new Error('Track index required');
        return {
          success: true,
          message: 'devices_list requires full AbletonOSC implementation',
          devices: [],
        };

      case 'devices_get_parameters':
        if (trackIndex === undefined || deviceIndex === undefined) {
          throw new Error('Track index and device index required');
        }
        return {
          success: true,
          message: 'devices_get_parameters requires full AbletonOSC implementation',
          parameters: [],
        };

      case 'devices_set_parameter':
        if (trackIndex === undefined || deviceIndex === undefined) {
          throw new Error('Track index and device index required');
        }
        {
          const parameterName = toolInput.parameterName as string;
          const value = toolInput.value as number;

          if (value < 0 || value > 1) {
            throw new Error('Parameter value must be between 0.0 and 1.0');
          }

          osc.send(`/live/track/${trackIndex}/devices/${deviceIndex}/parameters/${parameterName}/value`, [
            value,
          ]);
          return { success: true, message: `Parameter "${parameterName}" set to ${value}` };
        }

      case 'devices_enable':
        if (trackIndex === undefined || deviceIndex === undefined) {
          throw new Error('Track index and device index required');
        }
        osc.send(`/live/track/${trackIndex}/devices/${deviceIndex}/set`, ['is_active', 1]);
        return { success: true, message: 'Device enabled' };

      case 'devices_disable':
        if (trackIndex === undefined || deviceIndex === undefined) {
          throw new Error('Track index and device index required');
        }
        osc.send(`/live/track/${trackIndex}/devices/${deviceIndex}/set`, ['is_active', 0]);
        return { success: true, message: 'Device disabled' };

      default:
        throw new Error(`Unknown devices tool: ${toolName}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
