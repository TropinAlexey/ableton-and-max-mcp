import { z } from 'zod/v4';

export const transportTools = {
  transport_get_state: {
    description: 'Get transport state: playing (bool), tempo (BPM), position (beats)',
    inputSchema: z.object({}),
  },
  transport_play: {
    description: 'Start playback',
    inputSchema: z.object({}),
  },
  transport_stop: {
    description: 'Stop playback',
    inputSchema: z.object({}),
  },
  transport_record: {
    description: 'Enable recording',
    inputSchema: z.object({}),
  },
  transport_set_tempo: {
    description: 'Set tempo in BPM',
    inputSchema: z.object({
      bpm: z.number().positive().describe('BPM value'),
    }),
  },
  transport_jump_to: {
    description: 'Jump to beat position. Beat 0 = start of song. Works in any time signature.',
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
