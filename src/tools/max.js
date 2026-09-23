import { z } from 'zod/v4';

const maxDeviceRef = z.object({
  track_index: z.number().int().min(0).describe('Track index (0-based)'),
  device_index: z.number().int().min(0).describe('Max for Live device index (0-based)'),
});

export const maxTools = {
  max_list_devices: {
    description: 'List only Max for Live devices on a track with device_index. For regular instruments and effects use devices_list instead. Always call first to resolve device_index.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
    }),
  },
  max_send_message: {
    description: 'Send a raw message string to a Max for Live patch (max 1024 characters). The message is passed directly to the patch and can modify patch state. For parameter changes use max_set_parameter instead.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      device_index: z.number().int().min(0).describe('Max for Live device index (0-based)'),
      message: z.string().max(1024).describe('Message string to send to the Max patch'),
    }),
  },
  max_get_parameter: {
    description: 'Get a parameter value from a Max for Live device. Use max_list_devices first to resolve device_index. For regular devices use devices_get_parameters instead.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      device_index: z.number().int().min(0).describe('Max for Live device index (0-based)'),
      parameter: z.string().max(256).describe('Parameter name'),
    }),
  },
  max_set_parameter: {
    description: 'Set a parameter on a Max for Live device (normalized value 0.0 to 1.0). Use max_get_parameter first to see the current value. For regular devices use devices_set_parameter instead.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      device_index: z.number().int().min(0).describe('Max for Live device index (0-based)'),
      parameter: z.string().max(256).describe('Parameter name'),
      value: z.number().min(0).max(1).describe('Normalized value 0.0 to 1.0'),
    }),
  },
};

export async function executeMaxTool(osc, name, input) {
  const ti = input.track_index;
  const di = input.device_index;

  switch (name) {
    case 'max_list_devices':
      return {
        success: true,
        devices: await osc.request('/live/tracks', [ti, 'max_devices']),
      };

    case 'max_send_message':
      osc.send('/live/tracks', [ti, 'max_devices', di, 'message', input.message]);
      return { success: true };

    case 'max_get_parameter':
      return {
        success: true,
        value: await osc.request('/live/tracks', [ti, 'max_devices', di, 'get', input.parameter]),
      };

    case 'max_set_parameter':
      osc.send('/live/tracks', [ti, 'max_devices', di, 'set', input.parameter, input.value]);
      return { success: true };

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
