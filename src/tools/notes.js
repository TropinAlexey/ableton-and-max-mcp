import { z } from 'zod/v4';

const SCALES = {
  // Major modes
  major: [0, 2, 4, 5, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],

  // Minor variants
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],

  // Pentatonic
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],

  // Blues
  blues: [0, 3, 5, 6, 7, 10],
  blues_major: [0, 2, 3, 4, 7, 9],

  // Symmetric
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  whole_tone: [0, 2, 4, 6, 8, 10],
  diminished_half_whole: [0, 1, 3, 4, 6, 7, 9, 10],
  diminished_whole_half: [0, 2, 3, 5, 6, 8, 9, 11],
  augmented_scale: [0, 3, 4, 7, 8, 11],

  // Exotic / World
  hungarian_minor: [0, 2, 3, 6, 7, 8, 11],
  hungarian_major: [0, 3, 4, 6, 7, 9, 10],
  gypsy: [0, 2, 3, 6, 7, 8, 10],
  phrygian_dominant: [0, 1, 4, 5, 7, 8, 10],
  double_harmonic: [0, 1, 4, 5, 7, 8, 11],
  flamenco: [0, 1, 4, 5, 7, 8, 11],
  enigmatic: [0, 1, 4, 6, 8, 10, 11],
  neapolitan_minor: [0, 1, 3, 5, 7, 8, 11],
  neapolitan_major: [0, 1, 3, 5, 7, 9, 11],
  persian: [0, 1, 4, 5, 6, 8, 11],
  arabic: [0, 2, 4, 5, 6, 8, 10],
  romanian_minor: [0, 2, 3, 6, 7, 9, 10],
  ukrainian_dorian: [0, 2, 3, 6, 7, 9, 10],

  // Japanese
  hirajoshi: [0, 2, 3, 7, 8],
  in_sen: [0, 1, 5, 7, 10],
  iwato: [0, 1, 5, 6, 10],
  kumoi: [0, 2, 3, 7, 9],
  yo: [0, 2, 5, 7, 9],

  // Indian
  bhairav: [0, 1, 4, 5, 7, 8, 11],
  purvi: [0, 1, 4, 6, 7, 8, 11],
  marwa: [0, 1, 4, 6, 7, 9, 11],
  todi: [0, 1, 3, 6, 7, 8, 11],

  // Bebop
  bebop_dominant: [0, 2, 4, 5, 7, 9, 10, 11],
  bebop_major: [0, 2, 4, 5, 7, 8, 9, 11],
  bebop_minor: [0, 2, 3, 4, 5, 7, 9, 10],
  bebop_dorian: [0, 2, 3, 5, 7, 9, 10, 11],

  // Lydian variants
  lydian_augmented: [0, 2, 4, 6, 8, 9, 11],
  lydian_dominant: [0, 2, 4, 6, 7, 9, 10],
  lydian_minor: [0, 2, 4, 6, 7, 8, 10],

  // Altered / Diminished
  super_locrian: [0, 1, 3, 4, 6, 8, 10],
  altered: [0, 1, 3, 4, 6, 8, 10],

  // Other
  prometheus: [0, 2, 4, 6, 9, 10],
  tritone: [0, 1, 4, 6, 7, 10],
  acoustic: [0, 2, 4, 6, 7, 9, 10],
  algerian: [0, 2, 3, 6, 7, 8, 11],
  balinese: [0, 1, 3, 7, 8],
  chinese: [0, 4, 6, 7, 11],
  egyptian: [0, 2, 5, 7, 10],
  ethiopian: [0, 2, 4, 5, 7, 8, 11],
  hawaiian: [0, 2, 3, 5, 7, 9, 11],
  hindu: [0, 2, 4, 5, 7, 8, 10],
  mixolydian_b6: [0, 2, 4, 5, 7, 8, 10],
  mongolian: [0, 2, 4, 7, 9],
  spanish: [0, 1, 3, 4, 5, 7, 8, 10],
};

const CHORD_TYPES = {
  // Power
  power: [0, 7],

  // Triads
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],

  // Seventh
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
  diminished7: [0, 3, 6, 9],
  half_diminished7: [0, 3, 6, 10],
  minor_major7: [0, 3, 7, 11],
  augmented7: [0, 4, 8, 10],
  augmented_major7: [0, 4, 8, 11],
  dominant7sus4: [0, 5, 7, 10],
  dominant7sus2: [0, 2, 7, 10],

  // Sixth
  sixth: [0, 4, 7, 9],
  minor6: [0, 3, 7, 9],

  // Ninth
  ninth: [0, 4, 7, 10, 14],
  major9: [0, 4, 7, 11, 14],
  minor9: [0, 3, 7, 10, 14],
  dominant7b9: [0, 4, 7, 10, 13],
  dominant7sharp9: [0, 4, 7, 10, 15],
  add9: [0, 4, 7, 14],
  minor_add9: [0, 3, 7, 14],
  six_nine: [0, 4, 7, 9, 14],

  // Eleventh
  eleventh: [0, 4, 7, 10, 14, 17],
  minor11: [0, 3, 7, 10, 14, 17],
  major11: [0, 4, 7, 11, 14, 17],
  dominant7sharp11: [0, 4, 7, 10, 18],

  // Thirteenth
  thirteenth: [0, 4, 7, 10, 14, 17, 21],
  minor13: [0, 3, 7, 10, 14, 17, 21],
  major13: [0, 4, 7, 11, 14, 17, 21],
};

const scaleNames = Object.keys(SCALES);
const chordTypeNames = Object.keys(CHORD_TYPES);

const clipRef = z.object({
  track_index: z.number().int().min(0).describe('Track index (0-based)'),
  clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
});

export const notesTools = {
  notes_get: {
    description: 'Get all MIDI notes in a clip (pitch 0-127, time in beats, duration in beats, velocity 0-127). Resolve indices via clips_list first.',
    inputSchema: clipRef,
  },
  notes_set: {
    description: 'Replace ALL notes in a clip with the given list. Existing notes are lost. For a single extra note use notes_add, for generated music use notes_generate_pattern.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
      notes: z.array(z.object({
        pitch: z.number().int().min(0).max(127).describe('MIDI pitch (0-127, 60 = C4)'),
        time: z.number().min(0).describe('Start time in beats'),
        duration: z.number().positive().describe('Duration in beats'),
        velocity: z.number().int().min(0).max(127).optional().default(100).describe('Velocity (0-127)'),
      })),
    }),
  },
  notes_add: {
    description: 'Add one MIDI note to a clip and keep existing notes (pitch 0-127, 60 = C4; time and duration in beats). To replace everything use notes_set, for patterns use notes_generate_pattern.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
      pitch: z.number().int().min(0).max(127).describe('MIDI pitch (0-127, 60 = C4)'),
      time: z.number().min(0).describe('Start time in beats'),
      duration: z.number().positive().describe('Duration in beats'),
      velocity: z.number().int().min(0).max(127).optional().default(100).describe('Velocity (0-127)'),
    }),
  },
  notes_clear: {
    description: 'Remove ALL notes from a clip but keep the clip itself. Cannot be undone. To delete the clip use clips tools.',
    inputSchema: clipRef,
  },
  notes_generate_pattern: {
    description: 'Generate a MIDI pattern (arpeggio_up, arpeggio_down, chord, random) and write it to a clip, replacing existing notes. Root default 60 = C4, length in bars. Supports 60+ scales and 30+ chord types. For one manual note use notes_add, for a custom note list use notes_set.',
    inputSchema: z.object({
      track_index: z.number().int().min(0).describe('Track index (0-based)'),
      clip_index: z.number().int().min(0).describe('Clip slot index (0-based)'),
      pattern: z.enum(['arpeggio_up', 'arpeggio_down', 'chord', 'random']),
      root_note: z.number().int().min(0).max(127).optional().default(60).describe('Root MIDI note (default: 60 = C4)'),
      scale: z.enum(scaleNames).optional().default('major').describe('Scale to use'),
      length: z.number().positive().optional().default(4).describe('Length in bars'),
      chord_type: z.enum(chordTypeNames).optional().describe('Chord voicing (for chord pattern). If omitted, builds triad from scale degrees 1-3-5.'),
      degrees: z.array(z.number().int().min(1).max(21)).optional().describe('Custom scale degrees to use (1-based, max 21 = 3 octaves). Overrides chord_type for chord pattern. Example: [1, 3, 5, 7]'),
    }),
  },
};

function getScaleNotes(root, scaleName) {
  const intervals = SCALES[scaleName] || SCALES.major;
  return intervals.map((i) => root + i);
}

function generateArpeggio(root, scaleName, length, direction) {
  const notes = [];
  const beatDur = 0.5;
  const scaleNotes = getScaleNotes(root, scaleName);
  const ordered = direction === 'up' ? scaleNotes : [...scaleNotes].reverse();

  for (let t = 0; t < length * 4; t += beatDur) {
    const idx = Math.floor((t / beatDur) % ordered.length);
    notes.push({
      pitch: Math.min(127, Math.max(0, ordered[idx])),
      time: t,
      duration: beatDur,
      velocity: 100,
    });
  }
  return notes;
}

function generateChord(root, scaleName, length, chordType, degrees) {
  let intervals;

  if (degrees && degrees.length > 0) {
    const scaleIntervals = SCALES[scaleName] || SCALES.major;
    intervals = degrees.map((deg) => {
      const octave = Math.floor((deg - 1) / scaleIntervals.length);
      const idx = (deg - 1) % scaleIntervals.length;
      return scaleIntervals[idx] + octave * 12;
    });
  } else if (chordType && CHORD_TYPES[chordType]) {
    intervals = CHORD_TYPES[chordType];
  } else {
    const scaleIntervals = SCALES[scaleName] || SCALES.major;
    intervals = [
      scaleIntervals[0],
      scaleIntervals[2 % scaleIntervals.length],
      scaleIntervals[4 % scaleIntervals.length],
    ];
  }

  return intervals.map((interval) => ({
    pitch: Math.min(127, Math.max(0, root + interval)),
    time: 0,
    duration: length * 4,
    velocity: 100,
  }));
}

function generateRandom(root, scaleName, length) {
  const notes = [];
  const scaleNotes = getScaleNotes(root, scaleName);
  const totalBeats = length * 4;
  const beatDur = 0.5;

  for (let t = 0; t < totalBeats; t += beatDur) {
    const idx = Math.floor(Math.random() * scaleNotes.length);
    const octaveShift = Math.floor(Math.random() * 2) * 12;
    const pitch = Math.min(127, Math.max(0, scaleNotes[idx] + octaveShift));
    const velocity = 60 + Math.floor(Math.random() * 67);

    notes.push({
      pitch,
      time: t,
      duration: beatDur,
      velocity,
    });
  }
  return notes;
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
      const root = input.root_note || 60;
      const scale = input.scale || 'major';
      const length = input.length || 4;

      let notes;
      switch (input.pattern) {
        case 'arpeggio_up':
          notes = generateArpeggio(root, scale, length, 'up');
          break;
        case 'arpeggio_down':
          notes = generateArpeggio(root, scale, length, 'down');
          break;
        case 'chord':
          notes = generateChord(root, scale, length, input.chord_type, input.degrees);
          break;
        case 'random':
          notes = generateRandom(root, scale, length);
          break;
        default:
          return { success: false, error: `Unknown pattern: ${input.pattern}` };
      }

      osc.send('/live/tracks', [ti, 'clips', ci, 'notes', notes]);
      return { success: true, pattern: input.pattern, scale, notes_count: notes.length };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
