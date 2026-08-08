import { z } from 'zod/v4';

export const transportTools = {
  transport_get_state: {
    description: 'Get transport state (playing, tempo, position)',
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
    description: 'Set tempo (BPM)',
    inputSchema: z.object({
      bpm: z.number().describe('BPM value'),
    }),
  },
  transport_jump_to: {
    description: 'Jump to bar position',
    inputSchema: z.object({
      bar: z.number().describe('Bar number'),
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
      if (!Number.isFinite(input.bpm) || input.bpm < 20 || input.bpm > 300) {
        return { success: false, error: 'BPM must be 20-300' };
      }
      osc.send('/live/song/set/tempo', [input.bpm]);
      return { success: true, bpm: input.bpm };

    case 'transport_jump_to':
      if (!Number.isInteger(input.bar) || input.bar < 0) {
        return { success: false, error: 'Bar must be non-negative integer' };
      }
      osc.send('/live/song/set/current_song_time', [input.bar * 4]);
      return { success: true, bar: input.bar };

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
