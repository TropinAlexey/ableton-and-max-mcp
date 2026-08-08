import { z } from 'zod/v4';

const noteSchema = z.object({
  pitch: z.number(),
  time: z.number(),
  duration: z.number(),
  velocity: z.number().optional().default(100),
});

const clipRef = z.object({
  track_index: z.number(),
  clip_index: z.number(),
});

export const notesTools = {
  notes_get: {
    description: 'Get MIDI notes from clip',
    inputSchema: clipRef,
  },
  notes_set: {
    description: 'Replace all notes in clip',
    inputSchema: z.object({
      track_index: z.number(),
      clip_index: z.number(),
      notes: z.array(noteSchema),
    }),
  },
  notes_add: {
    description: 'Add single note',
    inputSchema: z.object({
      track_index: z.number(),
      clip_index: z.number(),
      pitch: z.number(),
      time: z.number(),
      duration: z.number(),
      velocity: z.number().optional().default(100),
    }),
  },
  notes_clear: {
    description: 'Clear all notes',
    inputSchema: clipRef,
  },
  notes_generate_pattern: {
    description: 'Generate MIDI pattern (arpeggio_up, arpeggio_down, chord)',
    inputSchema: z.object({
      track_index: z.number(),
      clip_index: z.number(),
      pattern: z.enum(['arpeggio_up', 'arpeggio_down', 'chord', 'random']),
      root_note: z.number().optional().default(60),
      length: z.number().optional().default(4),
      tempo: z.number().optional().default(120),
    }),
  },
};

function generateArpeggio(root, length, tempo, direction) {
  const notes = [];
  const beatDur = 0.5;
  const scale = [0, 2, 4, 5, 7, 9, 11];
  const notes_arr = direction === 'up'
    ? scale.map((i) => root + i)
    : scale.map((i) => root + i).reverse();

  for (let i = 0; i < length * 4; i += beatDur) {
    notes.push({
      pitch: notes_arr[Math.floor((i / beatDur) % notes_arr.length)],
      time: i,
      duration: beatDur,
      velocity: 100,
    });
  }
  return notes;
}

function generateChord(root, length) {
  return [
    { pitch: root, time: 0, duration: length, velocity: 100 },
    { pitch: root + 4, time: 0, duration: length, velocity: 100 },
    { pitch: root + 7, time: 0, duration: length, velocity: 100 },
  ];
}

export async function executeNotesTool(osc, name, input) {
  const ti = input.track_index;
  const ci = input.clip_index;

  switch (name) {
    case 'notes_get':
      return {
        success: true,
        notes: await osc.request('/live/tracks', [ti, 'clips', ci, 'notes']),
      };

    case 'notes_set':
      osc.send('/live/tracks', [ti, 'clips', ci, 'notes', input.notes]);
      return { success: true, count: input.notes.length };

    case 'notes_add':
      osc.send('/live/tracks', [
        ti,
        'clips',
        ci,
        'add_note',
        input.pitch,
        input.time,
        input.duration,
        input.velocity || 100,
      ]);
      return { success: true };

    case 'notes_clear':
      osc.send('/live/tracks', [ti, 'clips', ci, 'clear_notes']);
      return { success: true };

    case 'notes_generate_pattern': {
      const pattern = input.pattern;
      const root = input.root_note || 60;
      const length = input.length || 4;
      const tempo = input.tempo || 120;

      let notes;
      if (pattern === 'arpeggio_up') {
        notes = generateArpeggio(root, length, tempo, 'up');
      } else if (pattern === 'arpeggio_down') {
        notes = generateArpeggio(root, length, tempo, 'down');
      } else if (pattern === 'chord') {
        notes = generateChord(root, length);
      } else {
        return { success: false, error: 'Unknown pattern' };
      }

      osc.send('/live/tracks', [ti, 'clips', ci, 'notes', notes]);
      return { success: true, pattern, notes_count: notes.length };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
