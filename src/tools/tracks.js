import { z } from 'zod/v4';

const trackIndexSchema = z.object({
  index: z.number().int().min(0).describe('Track index (0-based)'),
});

export const tracksTools = {
  tracks_list: {
    description: 'List all tracks with names, volumes, pans, and states',
    inputSchema: z.object({}),
  },
  tracks_create_midi: {
    description: 'Create a new MIDI track. Use tracks_list after to get the actual index.',
    inputSchema: z.object({
      name: z.string().optional().describe('Track name'),
      index: z.number().int().min(0).optional().describe('Insert position (0-based). Omit to append at end.'),
    }),
  },
  tracks_create_audio: {
    description: 'Create a new audio track. Use tracks_list after to get the actual index.',
    inputSchema: z.object({
      name: z.string().optional().describe('Track name'),
      index: z.number().int().min(0).optional().describe('Insert position (0-based). Omit to append at end.'),
    }),
  },
  tracks_delete: {
    description: 'Permanently delete a track. Cannot be undone. Use tracks_list to verify the index first.',
    inputSchema: trackIndexSchema,
  },
  tracks_rename: {
    description: 'Rename a track',
    inputSchema: z.object({
      index: z.number().int().min(0).describe('Track index (0-based)'),
      name: z.string().describe('New name'),
    }),
  },
  tracks_set_volume: {
    description: 'Set track volume',
    inputSchema: z.object({
      index: z.number().int().min(0).describe('Track index (0-based)'),
      volume: z.number().min(0).max(1).describe('Volume 0.0 (silent) to 1.0 (full)'),
    }),
  },
  tracks_set_pan: {
    description: 'Set track pan',
    inputSchema: z.object({
      index: z.number().int().min(0).describe('Track index (0-based)'),
      pan: z.number().min(-1).max(1).describe('Pan: -1.0 (left) to 1.0 (right), 0 = center'),
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
    description: 'Solo track (mutes all other tracks)',
    inputSchema: trackIndexSchema,
  },
  tracks_unsolo: {
    description: 'Remove solo from track',
    inputSchema: trackIndexSchema,
  },
  tracks_arm: {
    description: 'Arm track for recording',
    inputSchema: trackIndexSchema,
  },
  tracks_disarm: {
    description: 'Disarm track (stop recording)',
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
      return { success: true, inserted_at: input.index ?? 'end' };

    case 'tracks_create_audio':
      osc.send('/live/song/create_audio_track', [
        input.index ?? -1,
        input.name || 'Audio Track',
      ]);
      return { success: true, inserted_at: input.index ?? 'end' };

    case 'tracks_delete':
      osc.send('/live/tracks', [idx, 'delete']);
      return { success: true };

    case 'tracks_rename':
      osc.send('/live/tracks', [idx, 'set', 'name', input.name]);
      return { success: true };

    case 'tracks_set_volume':
      osc.send('/live/tracks', [idx, 'set', 'volume', input.volume]);
      return { success: true };

    case 'tracks_set_pan':
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
