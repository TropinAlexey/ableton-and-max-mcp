import { ResourceTemplate } from '@modelcontextprotocol/server';

function jsonResult(uri, data) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ uri, updated_at: new Date().toISOString(), ...data }, null, 2),
    }],
  };
}

function num(v, fallback = NaN) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Регистрирует 6 per-domain ресурсов (Подход A).
 * Read = подписка (start_listen) + best-effort опрос + кэш.
 * Push = AbletonStateManager.handlePush -> sendResourceUpdated.
 */
export function registerAbletonResources(server, osc, state) {
  void osc;

  server.registerResource(
    'song-state',
    'ableton://song/state',
    {
      title: 'Ableton Song State',
      description: 'Live song state: tempo, playback, loop, metronome, record mode. Subscribe for push updates.',
      mimeType: 'application/json',
    },
    async (uri) => {
      const data = await state.fetchSongState();
      return jsonResult(uri.href, data);
    },
  );

  server.registerResource(
    'track-state',
    new ResourceTemplate('ableton://track/{index}/state', { list: undefined }),
    {
      title: 'Ableton Track State',
      description: 'Track state: name, volume, panning, mute, solo, arm. Subscribe per track index.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const index = num(variables.index);
      if (!Number.isInteger(index) || index < 0) throw new Error(`Invalid track index: ${variables.index}`);
      const data = await state.fetchTrackState(index);
      return jsonResult(uri.href, data);
    },
  );

  server.registerResource(
    'clip-position',
    new ResourceTemplate('ableton://clip/{track}/{clip}/position', { list: undefined }),
    {
      title: 'Ableton Clip Playing Position',
      description: 'Live clip playing position in beats. Subscribe per track/clip.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const track = num(variables.track);
      const clip = num(variables.clip);
      if (!Number.isInteger(track) || track < 0 || !Number.isInteger(clip) || clip < 0) {
        throw new Error(`Invalid clip reference: track=${variables.track} clip=${variables.clip}`);
      }
      const data = await state.fetchClipPosition(track, clip);
      return jsonResult(uri.href, data);
    },
  );

  server.registerResource(
    'device-parameters',
    new ResourceTemplate('ableton://device/{track}/{device}/parameters', { list: undefined }),
    {
      title: 'Ableton Device Parameters',
      description: 'Device parameter values for a track device. Subscribe per track/device.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const track = num(variables.track);
      const device = num(variables.device);
      if (!Number.isInteger(track) || track < 0 || !Number.isInteger(device) || device < 0) {
        throw new Error(`Invalid device reference: track=${variables.track} device=${variables.device}`);
      }
      const data = await state.fetchDeviceParameters(track, device);
      return jsonResult(uri.href, data);
    },
  );

  server.registerResource(
    'view-state',
    'ableton://view/state',
    {
      title: 'Ableton View State',
      description: 'Selected track and scene indices. Subscribe for push updates.',
      mimeType: 'application/json',
    },
    async (uri) => {
      const data = await state.fetchViewState();
      return jsonResult(uri.href, data);
    },
  );

  server.registerResource(
    'scene-state',
    new ResourceTemplate('ableton://scene/{index}/state', { list: undefined }),
    {
      title: 'Ableton Scene State',
      description: 'Scene state: name, triggered status, tempo. Subscribe per scene index.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const index = num(variables.index);
      if (!Number.isInteger(index) || index < 0) throw new Error(`Invalid scene index: ${variables.index}`);
      const data = await state.fetchSceneState(index);
      return jsonResult(uri.href, data);
    },
  );
}
