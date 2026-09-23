import { z } from 'zod/v4';

const clipRef = z.object({
  track_index: z.number().int().min(0).describe('Track index (0-based)'),
  clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
});

export const clipsTools = {
  clips_list: {
    description: 'List clip slots in a track with clip_index, name and length in bars. Always call first to resolve clip_index for clips_* and notes_* tools.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
    }),
  },
  clips_create: {
    description: 'Create a new empty MIDI clip with length in bars (default 4). Use clips_list after to get its clip_index, then notes_set/add/generate_pattern to fill it with music.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      length: z.number().positive().optional().default(4).describe('Clip length in bars (default: 4)'),
      name: z.string().optional().default('Clip').describe('Clip name'),
    }),
  },
  clips_fire: {
    description: 'Launch (start playing) a clip in Session View. The clip must already exist (see clips_create). Use clips_stop to stop it.',
    inputSchema: clipRef,
  },
  clips_stop: {
    description: 'Stop a currently playing clip. Use clips_fire to launch it again.',
    inputSchema: clipRef,
  },
  clips_duplicate: {
    description: 'Duplicate a clip into the next available slot on the same track. Use clips_list after to find the new clip_index.',
    inputSchema: clipRef,
  },
  clips_set_name: {
    description: 'Rename a clip. Resolve track_index and clip_index via clips_list first.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
      name: z.string().describe('New clip name'),
    }),
  },
  clips_set_length: {
    description: 'Set clip length in bars (not beats). Resolve indices via clips_list first.',
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
