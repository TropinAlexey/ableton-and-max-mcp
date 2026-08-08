import { z } from 'zod/v4';

const maxDeviceRef = z.object({
  track_index: z.number(),
  device_index: z.number(),
});

export const maxTools = {
  max_list_devices: {
    description: 'List Max for Live devices on track',
    inputSchema: z.object({
      track_index: z.number(),
    }),
  },
  max_send_message: {
    description: 'Send message to Max device',
    inputSchema: z.object({
      track_index: z.number(),
      device_index: z.number(),
      message: z.string(),
    }),
  },
  max_get_parameter: {
    description: 'Get Max parameter value',
    inputSchema: z.object({
      track_index: z.number(),
      device_index: z.number(),
      parameter: z.string(),
    }),
  },
  max_set_parameter: {
    description: 'Set Max parameter value',
    inputSchema: z.object({
      track_index: z.number(),
      device_index: z.number(),
      parameter: z.string(),
      value: z.number(),
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
      if (input.value < 0 || input.value > 1)
        return { success: false, error: 'Value must be 0-1' };
      osc.send('/live/tracks', [ti, 'max_devices', di, 'set', input.parameter, input.value]);
      return { success: true };

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
