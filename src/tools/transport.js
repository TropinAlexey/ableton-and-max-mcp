import { z } from 'zod/v4';

export const transportTools = {
  transport_get_state: {
    description: 'Get current transport state: playing (bool), tempo (BPM), position in beats. Use for one-off polling. For push updates, subscribe to the ableton://song/state resource instead.',
    inputSchema: z.object({}),
  },
  transport_play: {
    description: 'Start playback from the current playhead position. No-op if already playing. Use transport_jump_to first to start from a specific beat.',
    inputSchema: z.object({}),
  },
  transport_stop: {
    description: 'Stop playback and keep the current playhead position. Use transport_play to resume.',
    inputSchema: z.object({}),
  },
  transport_record: {
    description: 'Enable global session recording. Arm the target track with tracks_arm first, then use transport_play to start capturing.',
    inputSchema: z.object({}),
  },
  transport_set_tempo: {
    description: 'Set song tempo in BPM (range 20-300). Applies immediately to playback and clips.',
    inputSchema: z.object({
      bpm: z.number().positive().describe('BPM value'),
    }),
  },
  transport_jump_to: {
    description: 'Jump the playhead to a beat position. Beat 0 = start of song. Units are beats (not bars). Works in any time signature.',
    inputSchema: z.object({
      beat: z.number().min(0).describe('Beat position (0-based)'),
    }),
  },
};

export async function executeTransportTool(osc, name, input) {
  switch (name) {
    case 'transport_get_state':
      return {
        playing: await osc.request('/live/song/is_playing'),
        tempo: await osc.request('/live/song/tempo'),
        position: await osc.request('/live/song/current_song_time'),
      };

    case 'transport_play':
      osc.send('/live/song/start_playing');
      return { success: true };

    case 'transport_stop':
      osc.send('/live/song/stop_playing');
      return { success: true };

    case 'transport_record':
      osc.send('/live/song/record');
      return { success: true };

    case 'transport_set_tempo':
      osc.send('/live/song/set/tempo', [input.bpm]);
      return { success: true, bpm: input.bpm };

    case 'transport_jump_to':
      osc.send('/live/song/set/current_song_time', [input.beat]);
      return { success: true, beat: input.beat };

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
