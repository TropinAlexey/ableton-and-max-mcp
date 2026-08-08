import { z } from 'zod/v4';

const trackIndexSchema = z.object({
  index: z.number().describe('Track index'),
});

export const tracksTools = {
  tracks_list: {
    description: 'List all tracks',
    inputSchema: z.object({}),
  },
  tracks_create_midi: {
    description: 'Create MIDI track',
    inputSchema: z.object({
      name: z.string().optional().describe('Track name'),
      index: z.number().optional().describe('Position'),
    }),
  },
  tracks_create_audio: {
    description: 'Create audio track',
    inputSchema: z.object({
      name: z.string().optional().describe('Track name'),
      index: z.number().optional().describe('Position'),
    }),
  },
  tracks_delete: {
    description: 'Delete track',
    inputSchema: trackIndexSchema,
  },
  tracks_rename: {
    description: 'Rename track',
    inputSchema: z.object({
      index: z.number().describe('Track index'),
      name: z.string().describe('New name'),
    }),
  },
  tracks_set_volume: {
    description: 'Set track volume (0-1)',
    inputSchema: z.object({
      index: z.number().describe('Track index'),
      volume: z.number().describe('Volume 0-1'),
    }),
  },
  tracks_set_pan: {
    description: 'Set track pan (-1 to 1)',
    inputSchema: z.object({
      index: z.number().describe('Track index'),
      pan: z.number().describe('Pan -1 to 1'),
    }),
  },
  tracks_mute: {
    description: 'Mute track',
    inputSchema: trackIndexSchema,
  },
  tracks_unmute: {
    description: 'Unmute track',
    inputSchema: trackIndexSchema,
  },
  tracks_solo: {
    description: 'Solo track',
    inputSchema: trackIndexSchema,
  },
  tracks_unsolo: {
    description: 'Unsolo track',
    inputSchema: trackIndexSchema,
  },
  tracks_arm: {
    description: 'Arm track for recording',
    inputSchema: trackIndexSchema,
  },
  tracks_disarm: {
    description: 'Disarm track',
    inputSchema: trackIndexSchema,
  },
};

export async function executeTracksTool(osc, name, input) {
  const idx = input.index;

  switch (name) {
    case 'tracks_list':
      return {
        success: true,
        tracks: await osc.request('/live/tracks'),
      };

    case 'tracks_create_midi':
      osc.send('/live/song/create_midi_track', [
        input.index ?? -1,
        input.name || 'MIDI Track',
      ]);
      return { success: true };

    case 'tracks_create_audio':
      osc.send('/live/song/create_audio_track', [
        input.index ?? -1,
        input.name || 'Audio Track',
      ]);
      return { success: true };

    case 'tracks_delete':
      osc.send('/live/tracks', [idx, 'delete']);
      return { success: true };

    case 'tracks_rename':
      osc.send('/live/tracks', [idx, 'set', 'name', input.name]);
      return { success: true };

    case 'tracks_set_volume':
      if (input.volume < 0 || input.volume > 1)
        return { success: false, error: 'Volume must be 0-1' };
      osc.send('/live/tracks', [idx, 'set', 'volume', input.volume]);
      return { success: true };

    case 'tracks_set_pan':
      if (input.pan < -1 || input.pan > 1)
        return { success: false, error: 'Pan must be -1 to 1' };
      osc.send('/live/tracks', [idx, 'set', 'pan', input.pan]);
      return { success: true };

    case 'tracks_mute':
      osc.send('/live/tracks', [idx, 'set', 'muted', 1]);
      return { success: true };

    case 'tracks_unmute':
      osc.send('/live/tracks', [idx, 'set', 'muted', 0]);
      return { success: true };

    case 'tracks_solo':
      osc.send('/live/tracks', [idx, 'set', 'solo', 1]);
      return { success: true };

    case 'tracks_unsolo':
      osc.send('/live/tracks', [idx, 'set', 'solo', 0]);
      return { success: true };

    case 'tracks_arm':
      osc.send('/live/tracks', [idx, 'set', 'arm', 1]);
      return { success: true };

    case 'tracks_disarm':
      osc.send('/live/tracks', [idx, 'set', 'arm', 0]);
      return { success: true };

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
