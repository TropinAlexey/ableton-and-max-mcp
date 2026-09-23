import { z } from 'zod/v4';

const clipRef = z.object({
  track_index: z.number().int().min(0).describe('Track index (0-based)'),
  clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
});

export const clipsTools = {
  clips_list: {
    description: 'List all clips in a track with names, lengths, and positions',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
    }),
  },
  clips_create: {
    description: 'Create a new empty MIDI clip. Use clips_list after to get the actual clip_index.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      length: z.number().positive().optional().default(4).describe('Clip length in bars (default: 4)'),
      name: z.string().optional().default('Clip').describe('Clip name'),
    }),
  },
  clips_fire: {
    description: 'Start playing a clip',
    inputSchema: clipRef,
  },
  clips_stop: {
    description: 'Stop a playing clip',
    inputSchema: clipRef,
  },
  clips_duplicate: {
    description: 'Duplicate a clip to the next available slot',
    inputSchema: clipRef,
  },
  clips_set_name: {
    description: 'Rename a clip',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
      name: z.string().describe('New clip name'),
    }),
  },
  clips_set_length: {
    description: 'Set clip length in bars',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
      length: z.number().positive().describe('Length in bars'),
    }),
  },
};

export async function executeClipsTool(osc, name, input) {
  const ti = input.track_index;
  const ci = input.clip_index;

  switch (name) {
    case 'clips_list':
      return {
        success: true,
        clips: await osc.request('/live/tracks', [ti, 'clips']),
      };

    case 'clips_create':
      osc.send('/live/tracks', [
        ti,
        'create_clip',
        input.length || 4,
        input.name || 'Clip',
      ]);
      return { success: true, track_index: ti };

    case 'clips_fire':
      osc.send('/live/tracks', [ti, 'clips', ci, 'fire']);
      return { success: true };

    case 'clips_stop':
      osc.send('/live/tracks', [ti, 'clips', ci, 'stop']);
      return { success: true };

    case 'clips_duplicate':
      osc.send('/live/tracks', [ti, 'clips', ci, 'duplicate']);
      return { success: true };

    case 'clips_set_name':
      osc.send('/live/tracks', [ti, 'clips', ci, 'set', 'name', input.name]);
      return { success: true };

    case 'clips_set_length':
      osc.send('/live/tracks', [
        ti,
        'clips',
        ci,
        'set',
        'length',
        input.length,
      ]);
      return { success: true };

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
