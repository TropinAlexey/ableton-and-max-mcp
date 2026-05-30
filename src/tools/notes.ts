import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';
import type { Note } from '../types.js';

export function createNotesTools(osc: AbletonOSCClient): Tool[] {
  return [
    {
      name: 'notes_get',
      description: 'Get all notes from a MIDI clip',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
          sceneIndex: {
            type: 'number',
            description: 'Scene index',
          },
        },
        required: ['trackIndex', 'sceneIndex'],
      },
    },
    {
      name: 'notes_set',
      description: 'Replace all notes in a MIDI clip',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
          sceneIndex: {
            type: 'number',
            description: 'Scene index',
          },
          notes: {
            type: 'array',
            description: 'Array of notes',
            items: {
              type: 'object',
              properties: {
                pitch: { type: 'number' },
                startTime: { type: 'number' },
                duration: { type: 'number' },
                velocity: { type: 'number' },
              },
            },
          },
        },
        required: ['trackIndex', 'sceneIndex', 'notes'],
      },
    },
    {
      name: 'notes_add',
      description: 'Add a single note to a MIDI clip',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
          sceneIndex: {
            type: 'number',
            description: 'Scene index',
          },
          pitch: {
            type: 'number',
            description: 'MIDI pitch (0-127)',
          },
          startTime: {
            type: 'number',
            description: 'Start time in beats',
          },
          duration: {
            type: 'number',
            description: 'Duration in beats',
          },
          velocity: {
            type: 'number',
            description: 'Velocity (0-127)',
          },
        },
        required: ['trackIndex', 'sceneIndex', 'pitch', 'startTime', 'duration', 'velocity'],
      },
    },
    {
      name: 'notes_clear',
      description: 'Remove all notes from a MIDI clip',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
          sceneIndex: {
            type: 'number',
            description: 'Scene index',
          },
        },
        required: ['trackIndex', 'sceneIndex'],
      },
    },
    {
      name: 'notes_generate_pattern',
      description: 'Generate a musical pattern (arpeggio, chord, groove)',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
          sceneIndex: {
            type: 'number',
            description: 'Scene index',
          },
          pattern: {
            type: 'string',
            enum: ['arpeggio_up', 'arpeggio_down', 'chord', 'groove', 'random'],
            description: 'Pattern type',
          },
          root: {
            type: 'number',
            description: 'Root MIDI note (0-127)',
          },
          scale: {
            type: 'string',
            enum: ['major', 'minor', 'pentatonic', 'blues', 'chromatic'],
            description: 'Scale',
          },
          length: {
            type: 'number',
            description: 'Length in bars',
          },
        },
        required: ['trackIndex', 'sceneIndex', 'pattern', 'root', 'scale', 'length'],
      },
    },
  ];
}

function generateArpeggio(
  root: number,
  scale: string,
  length: number,
  direction: 'up' | 'down'
): Note[] {
  const notes: Note[] = [];
  const scaleNotes = getScaleNotes(root, scale);
  const beatPerBar = 4;
  const totalBeats = length * beatPerBar;
  const noteLength = 0.5; // 8th notes

  let noteIndex = direction === 'up' ? 0 : scaleNotes.length - 1;
  let currentBeat = 0;

  while (currentBeat < totalBeats) {
    notes.push({
      pitch: scaleNotes[noteIndex],
      startTime: currentBeat,
      duration: noteLength,
      velocity: 80,
    });

    currentBeat += noteLength;

    if (direction === 'up') {
      noteIndex = (noteIndex + 1) % scaleNotes.length;
    } else {
      noteIndex = (noteIndex - 1 + scaleNotes.length) % scaleNotes.length;
    }
  }

  return notes;
}

function generateChord(root: number, scale: string, length: number): Note[] {
  const notes: Note[] = [];
  const scaleNotes = getScaleNotes(root, scale);
  const beatPerBar = 4;
  const totalBeats = length * beatPerBar;

  // Play chord notes together
  const chordNotes = [scaleNotes[0], scaleNotes[2], scaleNotes[4]].filter((n) => n !== undefined);

  for (let bar = 0; bar < length; bar++) {
    chordNotes.forEach((pitch) => {
      notes.push({
        pitch,
        startTime: bar * beatPerBar,
        duration: beatPerBar,
        velocity: 90,
      });
    });
  }

  return notes;
}

function getScaleNotes(root: number, scale: string): number[] {
  const intervals: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };

  const baseIntervals = intervals[scale] || intervals.major;
  const notes: number[] = [];

  for (let octave = 0; octave < 2; octave++) {
    for (const interval of baseIntervals) {
      const note = root + octave * 12 + interval;
      if (note >= 0 && note <= 127) {
        notes.push(note);
      }
    }
  }

  return notes;
}

export async function executeNotesTool(
  osc: AbletonOSCClient,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  try {
    const trackIndex = toolInput.trackIndex as number | undefined;
    const sceneIndex = toolInput.sceneIndex as number | undefined;

    switch (toolName) {
      case 'notes_get':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        return {
          success: true,
          message: 'notes_get requires full AbletonOSC implementation',
          notes: [],
        };

      case 'notes_set':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        {
          const notes = toolInput.notes as Note[];
          // Send notes to clip
          osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/clip/notes/set`, [
            JSON.stringify(notes),
          ]);
          return { success: true, message: `${notes.length} notes set` };
        }

      case 'notes_add':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        {
          const pitch = toolInput.pitch as number;
          const startTime = toolInput.startTime as number;
          const duration = toolInput.duration as number;
          const velocity = toolInput.velocity as number;

          osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/clip/notes/add`, [
            pitch,
            startTime,
            duration,
            velocity,
          ]);
          return { success: true, message: `Note added (pitch=${pitch})` };
        }

      case 'notes_clear':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/clip/notes/clear`);
        return { success: true, message: 'All notes cleared' };

      case 'notes_generate_pattern': {
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        const pattern = toolInput.pattern as string;
        const root = toolInput.root as number;
        const scale = toolInput.scale as string;
        const length = toolInput.length as number;

        let generatedNotes: Note[] = [];

        if (pattern === 'arpeggio_up') {
          generatedNotes = generateArpeggio(root, scale, length, 'up');
        } else if (pattern === 'arpeggio_down') {
          generatedNotes = generateArpeggio(root, scale, length, 'down');
        } else if (pattern === 'chord') {
          generatedNotes = generateChord(root, scale, length);
        } else {
          return { success: false, error: `Pattern "${pattern}" not yet implemented` };
        }

        // Send notes to clip
        osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/clip/notes/set`, [
          JSON.stringify(generatedNotes),
        ]);

        return {
          success: true,
          message: `Pattern "${pattern}" generated with ${generatedNotes.length} notes`,
          notes: generatedNotes,
        };
      }

      default:
        throw new Error(`Unknown notes tool: ${toolName}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
