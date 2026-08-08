import { z } from 'zod/v4';

const deviceRef = z.object({
  track_index: z.number(),
  device_index: z.number(),
});

export const devicesTools = {
  devices_list: {
    description: 'List devices on track',
    inputSchema: z.object({
      track_index: z.number(),
    }),
  },
  devices_get_parameters: {
    description: 'Get device parameters',
    inputSchema: deviceRef,
  },
  devices_set_parameter: {
    description: 'Set parameter value',
    inputSchema: z.object({
      track_index: z.number(),
      device_index: z.number(),
      parameter: z.string(),
      value: z.number(),
    }),
  },
  devices_enable: {
    description: 'Enable device',
    inputSchema: deviceRef,
  },
  devices_disable: {
    description: 'Disable device',
    inputSchema: deviceRef,
  },
};

export async function executeDevicesTool(osc, name, input) {
  const ti = input.track_index;
  const di = input.device_index;

  switch (name) {
    case 'devices_list':
      return {
        success: true,
        devices: await osc.request('/live/tracks', [ti, 'devices']),
      };

    case 'devices_get_parameters':
      return {
        success: true,
        parameters: await osc.request('/live/tracks', [ti, 'devices', di, 'parameters']),
      };

    case 'devices_set_parameter':
      if (input.value < 0 || input.value > 1)
        return { success: false, error: 'Value must be 0-1' };
      osc.send('/live/tracks', [ti, 'devices', di, 'set', input.parameter, input.value]);
      return { success: true };

    case 'devices_enable':
      osc.send('/live/tracks', [ti, 'devices', di, 'set', 'enabled', 1]);
      return { success: true };

    case 'devices_disable':
      osc.send('/live/tracks', [ti, 'devices', di, 'set', 'enabled', 0]);
      return { success: true };

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
