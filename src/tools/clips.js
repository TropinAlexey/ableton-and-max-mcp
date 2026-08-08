import { z } from 'zod/v4';

const clipRef = z.object({
  track_index: z.number(),
  clip_index: z.number(),
});

export const clipsTools = {
  clips_list: {
    description: 'List clips in track',
    inputSchema: z.object({
      track_index: z.number(),
    }),
  },
  clips_create: {
    description: 'Create clip',
    inputSchema: z.object({
      track_index: z.number(),
      length: z.number().optional().default(4),
      name: z.string().optional().default('Clip'),
    }),
  },
  clips_fire: {
    description: 'Start playing clip',
    inputSchema: clipRef,
  },
  clips_stop: {
    description: 'Stop clip',
    inputSchema: clipRef,
  },
  clips_duplicate: {
    description: 'Duplicate clip',
    inputSchema: clipRef,
  },
  clips_set_name: {
    description: 'Rename clip',
    inputSchema: z.object({
      track_index: z.number(),
      clip_index: z.number(),
      name: z.string(),
    }),
  },
  clips_set_length: {
    description: 'Set clip length (bars)',
    inputSchema: z.object({
      track_index: z.number(),
      clip_index: z.number(),
      length: z.number(),
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
      return { success: true };

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
