export function createTransportTools(osc) {
    return [
        {
            name: 'transport_get_state',
            description: 'Get current transport state: playing, position, BPM, time signature',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'transport_play',
            description: 'Start playback',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'transport_stop',
            description: 'Stop playback',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'transport_record',
            description: 'Enable recording',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'transport_set_tempo',
            description: 'Set BPM',
            inputSchema: {
                type: 'object',
                properties: {
                    bpm: {
                        type: 'number',
                        description: 'BPM value (30-300)',
                    },
                },
                required: ['bpm'],
            },
        },
        {
            name: 'transport_set_time_signature',
            description: 'Set time signature (e.g., 4/4, 3/4)',
            inputSchema: {
                type: 'object',
                properties: {
                    numerator: {
                        type: 'number',
                        description: 'Numerator (1-16)',
                    },
                    denominator: {
                        type: 'number',
                        description: 'Denominator (1, 2, 4, 8, 16)',
                    },
                },
                required: ['numerator', 'denominator'],
            },
        },
        {
            name: 'transport_jump_to',
            description: 'Jump to position in bars',
            inputSchema: {
                type: 'object',
                properties: {
                    bars: {
                        type: 'number',
                        description: 'Position in bars',
                    },
                },
                required: ['bars'],
            },
        },
    ];
}
export async function executeTransportTool(osc, toolName, toolInput) {
    try {
        switch (toolName) {
            case 'transport_get_state': {
                const isPlaying = await osc.request('/live/song/get', ['is_playing']);
                const position = await osc.request('/live/song/get', ['current_song_time']);
                const bpm = await osc.request('/live/song/get', ['tempo']);
                const isRecording = await osc.request('/live/song/get', ['is_recording']);
                const state = {
                    isPlaying: isPlaying === 1,
                    position: position || 0,
                    bpm: bpm || 120,
                    timeSignatureNumerator: 4,
                    timeSignatureDenominator: 4,
                    isRecording: isRecording === 1,
                };
                return state;
            }
            case 'transport_play':
                osc.send('/live/song/set', ['is_playing', 1]);
                return { success: true, message: 'Playback started' };
            case 'transport_stop':
                osc.send('/live/song/set', ['is_playing', 0]);
                return { success: true, message: 'Playback stopped' };
            case 'transport_record':
                osc.send('/live/song/set', ['record_mode', 1]);
                return { success: true, message: 'Recording enabled' };
            case 'transport_set_tempo': {
                const bpm = toolInput.bpm;
                if (bpm < 30 || bpm > 300) {
                    throw new Error('BPM must be between 30 and 300');
                }
                osc.send('/live/song/set', ['tempo', bpm]);
                return { success: true, message: `Tempo set to ${bpm} BPM` };
            }
            case 'transport_set_time_signature': {
                const num = toolInput.numerator;
                const denom = toolInput.denominator;
                // Note: Ableton doesn't expose time signature through Live Object Model
                // This is a limitation - would need custom Max for Live device
                return { success: false, error: 'Time signature control requires Max for Live device' };
            }
            case 'transport_jump_to': {
                const bars = toolInput.bars;
                osc.send('/live/song/set', ['current_song_time', bars]);
                return { success: true, message: `Jumped to bar ${bars}` };
            }
            default:
                throw new Error(`Unknown transport tool: ${toolName}`);
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
//# sourceMappingURL=transport.js.map