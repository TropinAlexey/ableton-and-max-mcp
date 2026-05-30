import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AbletonOSCClient } from '../osc-client.js';

export function createClipsTools(osc: AbletonOSCClient): Tool[] {
  return [
    {
      name: 'clips_list',
      description: 'Get all clips in a track',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
        },
        required: ['trackIndex'],
      },
    },
    {
      name: 'clips_create',
      description: 'Create new MIDI clip',
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
          length: {
            type: 'number',
            description: 'Clip length in bars',
          },
        },
        required: ['trackIndex', 'sceneIndex', 'length'],
      },
    },
    {
      name: 'clips_delete',
      description: 'Delete clip',
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
      name: 'clips_fire',
      description: 'Start playing clip',
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
      name: 'clips_stop',
      description: 'Stop playing clip',
      inputSchema: {
        type: 'object',
        properties: {
          trackIndex: {
            type: 'number',
            description: 'Track index',
          },
        },
        required: ['trackIndex'],
      },
    },
    {
      name: 'clips_set_name',
      description: 'Rename clip',
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
          name: {
            type: 'string',
            description: 'New clip name',
          },
        },
        required: ['trackIndex', 'sceneIndex', 'name'],
      },
    },
    {
      name: 'clips_set_length',
      description: 'Set clip length in bars',
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
          length: {
            type: 'number',
            description: 'Length in bars',
          },
        },
        required: ['trackIndex', 'sceneIndex', 'length'],
      },
    },
    {
      name: 'clips_duplicate',
      description: 'Duplicate clip',
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
          targetSceneIndex: {
            type: 'number',
            description: 'Target scene index for duplicate',
          },
        },
        required: ['trackIndex', 'sceneIndex', 'targetSceneIndex'],
      },
    },
  ];
}

export async function executeClipsTool(
  osc: AbletonOSCClient,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  try {
    const trackIndex = toolInput.trackIndex as number | undefined;
    const sceneIndex = toolInput.sceneIndex as number | undefined;

    switch (toolName) {
      case 'clips_list':
        if (trackIndex === undefined) throw new Error('Track index required');
        return {
          success: true,
          message: 'clips_list requires full AbletonOSC implementation',
          clips: [],
        };

      case 'clips_create':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        {
          const length = toolInput.length as number;
          osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/create_clip`, [length]);
          return { success: true, message: `Clip created at track ${trackIndex}, scene ${sceneIndex}` };
        }

      case 'clips_delete':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/delete_clip`);
        return { success: true, message: `Clip deleted` };

      case 'clips_fire':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/fire`);
        return { success: true, message: `Clip fired` };

      case 'clips_stop':
        if (trackIndex === undefined) throw new Error('Track index required');
        osc.send(`/live/track/${trackIndex}/stop_all_clips`);
        return { success: true, message: `Clip stopped` };

      case 'clips_set_name':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        {
          const name = toolInput.name as string;
          osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/clip/set`, ['name', name]);
          return { success: true, message: `Clip renamed to "${name}"` };
        }

      case 'clips_set_length':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        {
          const length = toolInput.length as number;
          osc.send(`/live/track/${trackIndex}/clip_slots/${sceneIndex}/clip/set`, [
            'loop_end',
            length * 4,
          ]); // Convert bars to beats
          return { success: true, message: `Clip length set to ${length} bars` };
        }

      case 'clips_duplicate':
        if (trackIndex === undefined || sceneIndex === undefined) {
          throw new Error('Track index and scene index required');
        }
        {
          const targetSceneIndex = toolInput.targetSceneIndex as number;
          // This would require duplicating MIDI data
          return { success: false, error: 'Clip duplication requires Max for Live device' };
        }

      default:
        throw new Error(`Unknown clips tool: ${toolName}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
