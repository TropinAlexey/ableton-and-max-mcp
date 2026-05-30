export function createTracksTools(osc) {
    return [
        {
            name: 'tracks_list',
            description: 'Get list of all tracks with their properties',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'tracks_create_midi',
            description: 'Create new MIDI track',
            inputSchema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Track name',
                    },
                    index: {
                        type: 'number',
                        description: 'Position in track list (optional)',
                    },
                },
            },
        },
        {
            name: 'tracks_create_audio',
            description: 'Create new audio track',
            inputSchema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Track name',
                    },
                    index: {
                        type: 'number',
                        description: 'Position in track list (optional)',
                    },
                },
            },
        },
        {
            name: 'tracks_delete',
            description: 'Delete track by index',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                },
                required: ['index'],
            },
        },
        {
            name: 'tracks_set_name',
            description: 'Rename track',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                    name: {
                        type: 'string',
                        description: 'New track name',
                    },
                },
                required: ['index', 'name'],
            },
        },
        {
            name: 'tracks_set_volume',
            description: 'Set track volume (0.0 to 1.0)',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                    volume: {
                        type: 'number',
                        description: 'Volume level (0.0-1.0)',
                    },
                },
                required: ['index', 'volume'],
            },
        },
        {
            name: 'tracks_set_pan',
            description: 'Set track panorama (-1.0 to 1.0)',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                    pan: {
                        type: 'number',
                        description: 'Pan value (-1.0=left, 0=center, 1.0=right)',
                    },
                },
                required: ['index', 'pan'],
            },
        },
        {
            name: 'tracks_mute',
            description: 'Mute track',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                },
                required: ['index'],
            },
        },
        {
            name: 'tracks_unmute',
            description: 'Unmute track',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                },
                required: ['index'],
            },
        },
        {
            name: 'tracks_solo',
            description: 'Enable solo for track',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                },
                required: ['index'],
            },
        },
        {
            name: 'tracks_unsolo',
            description: 'Disable solo for track',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                },
                required: ['index'],
            },
        },
        {
            name: 'tracks_arm',
            description: 'Arm track for recording',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                },
                required: ['index'],
            },
        },
        {
            name: 'tracks_disarm',
            description: 'Disarm track recording',
            inputSchema: {
                type: 'object',
                properties: {
                    index: {
                        type: 'number',
                        description: 'Track index',
                    },
                },
                required: ['index'],
            },
        },
    ];
}
export async function executeTracksTool(osc, toolName, toolInput) {
    try {
        const index = toolInput.index;
        switch (toolName) {
            case 'tracks_list': {
                // Note: This would require iterating through tracks via OSC
                // Full implementation depends on AbletonOSC script capabilities
                return {
                    success: true,
                    message: 'tracks_list requires custom Max for Live device',
                    tracks: [],
                };
            }
            case 'tracks_create_midi':
            case 'tracks_create_audio': {
                const name = toolInput.name || 'New Track';
                // Note: Creating tracks via OSC requires custom implementation
                return {
                    success: false,
                    error: 'Track creation requires Max for Live device',
                };
            }
            case 'tracks_delete':
                if (index === undefined)
                    throw new Error('Track index required');
                osc.send('/live/track/delete', [index]);
                return { success: true, message: `Track ${index} deleted` };
            case 'tracks_set_name':
                if (index === undefined)
                    throw new Error('Track index required');
                {
                    const name = toolInput.name;
                    osc.send(`/live/track/${index}/set`, ['name', name]);
                    return { success: true, message: `Track ${index} renamed to "${name}"` };
                }
            case 'tracks_set_volume':
                if (index === undefined)
                    throw new Error('Track index required');
                {
                    const volume = toolInput.volume;
                    if (volume < 0 || volume > 1) {
                        throw new Error('Volume must be between 0.0 and 1.0');
                    }
                    osc.send(`/live/track/${index}/set`, ['mixer_device/volume/value', volume]);
                    return { success: true, message: `Track ${index} volume set to ${volume}` };
                }
            case 'tracks_set_pan':
                if (index === undefined)
                    throw new Error('Track index required');
                {
                    const pan = toolInput.pan;
                    if (pan < -1 || pan > 1) {
                        throw new Error('Pan must be between -1.0 and 1.0');
                    }
                    osc.send(`/live/track/${index}/set`, ['mixer_device/panning/value', pan]);
                    return { success: true, message: `Track ${index} pan set to ${pan}` };
                }
            case 'tracks_mute':
                if (index === undefined)
                    throw new Error('Track index required');
                osc.send(`/live/track/${index}/set`, ['mute', 1]);
                return { success: true, message: `Track ${index} muted` };
            case 'tracks_unmute':
                if (index === undefined)
                    throw new Error('Track index required');
                osc.send(`/live/track/${index}/set`, ['mute', 0]);
                return { success: true, message: `Track ${index} unmuted` };
            case 'tracks_solo':
                if (index === undefined)
                    throw new Error('Track index required');
                osc.send(`/live/track/${index}/set`, ['solo', 1]);
                return { success: true, message: `Track ${index} solo enabled` };
            case 'tracks_unsolo':
                if (index === undefined)
                    throw new Error('Track index required');
                osc.send(`/live/track/${index}/set`, ['solo', 0]);
                return { success: true, message: `Track ${index} solo disabled` };
            case 'tracks_arm':
                if (index === undefined)
                    throw new Error('Track index required');
                osc.send(`/live/track/${index}/set`, ['arm', 1]);
                return { success: true, message: `Track ${index} armed for recording` };
            case 'tracks_disarm':
                if (index === undefined)
                    throw new Error('Track index required');
                osc.send(`/live/track/${index}/set`, ['arm', 0]);
                return { success: true, message: `Track ${index} disarmed` };
            default:
                throw new Error(`Unknown tracks tool: ${toolName}`);
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
//# sourceMappingURL=tracks.js.map