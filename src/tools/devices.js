import { z } from 'zod/v4';

const deviceRef = z.object({
  track_index: z.number().int().min(0).describe('Track index (0-based)'),
  device_index: z.number().int().min(0).describe('Device index in the track\'s device chain (0-based)'),
});

export const devicesTools = {
  devices_list: {
    description: 'List regular instruments and effects on a track with device_index, name and enabled status. For Max for Live devices use max_list_devices instead. Always call first to resolve device_index.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
    }),
  },
  devices_get_parameters: {
    description: 'Get all parameters of a regular device with current values and ranges. Use devices_list first to resolve device_index, then devices_set_parameter to change a value.',
    inputSchema: deviceRef,
  },
  devices_set_parameter: {
    description: 'Set a parameter on a regular instrument or effect (normalized value 0.0 to 1.0). Use devices_get_parameters first to see names and ranges. For Max for Live devices use max_set_parameter instead.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      device_index: z.number().int().min(0).describe('Device index (0-based)'),
      parameter: z.string().max(256).describe('Parameter name (from devices_get_parameters)'),
      value: z.number().min(0).max(1).describe('Normalized value 0.0 to 1.0'),
    }),
  },
  devices_enable: {
    description: 'Turn on a regular device (bypass off) so it processes audio. Use devices_disable to bypass it.',
    inputSchema: deviceRef,
  },
  devices_disable: {
    description: 'Turn off a regular device (bypass on). Audio passes through unprocessed. Use devices_enable to turn it back on.',
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
