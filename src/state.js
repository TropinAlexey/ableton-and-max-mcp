/**
 * AbletonStateManager — кэш live-состояния + управление AbletonOSC listeners.
 *
 * Подход A (per-domain ресурсы):
 *   ableton://song/state
 *   ableton://track/{index}/state
 *   ableton://clip/{track}/{clip}/position
 *   ableton://device/{track}/{device}/parameters
 *   ableton://view/state
 *   ableton://scene/{index}/state
 *
 * AbletonOSC listener-паттерн (см. ideoforms/AbletonOSC):
 *   Song:  /live/song/start_listen/<prop>        -> push на /live/song/get/<prop> <value>
 *   Track: /live/track/start_listen/<prop> <trk> -> push на /live/track/get/<prop> <trk> <value>
 *   Clip:  /live/clip/start_listen/playing_position <trk> <clip>
 *          -> push на /live/clip/get/playing_position <trk> <clip> <pos>
 *   View:  /live/view/start_listen/<prop>        -> push на /live/view/get/<prop> <value>
 *   Scene: /live/scene/start_listen/<prop> <sc>  -> push на /live/scene/get/<prop> <sc> <value>
 *   Device:/live/device/start_listen/<prop> ...  -> push на /live/device/get/<prop> ...
 * Поддерживается wildcard `*` (например /live/track/start_listen/* 0).
 */

const SONG_PROPS = ['tempo', 'is_playing', 'loop', 'metronome', 'record_mode'];
const TRACK_PROPS = ['name', 'volume', 'panning', 'mute', 'solo', 'arm'];
const VIEW_PROPS = ['selected_track', 'selected_scene'];
const SCENE_PROPS = ['name', 'is_triggered', 'tempo'];
const DEVICE_PROPS = ['value'];

function now() {
  return new Date().toISOString();
}

function singleArg(args) {
  return Array.isArray(args) && args.length === 1 ? args[0] : args;
}

export class AbletonStateManager {
  constructor(osc, onUpdate) {
    this.osc = osc;
    this.onUpdate = onUpdate;
    this.cache = new Map();
    this.listening = new Set();
    this.songState = {};
    this.viewState = {};
    this.trackStates = new Map();
    this.sceneStates = new Map();
    this.clipPositions = new Map();
    this.deviceStates = new Map();

    this.osc.on('message', (msg) => this.handlePush(msg));
  }

  notify(uri) {
    try {
      if (this.onUpdate) this.onUpdate(uri);
    } catch {
      // ignore — клиент может быть не подписан
    }
  }

  getCached(uri) {
    return this.cache.get(uri) || null;
  }

  setCached(uri, data) {
    this.cache.set(uri, { uri, updated_at: now(), data });
    this.notify(uri);
  }

  fireAndForget(address, args = []) {
    try {
      this.osc.send(address, args);
    } catch {
      // Ableton offline — подписка повторится при следующем read
    }
  }

  ensureSongListening() {
    if (this.listening.has('song')) return;
    this.listening.add('song');
    this.fireAndForget('/live/song/start_listen/*');
    for (const p of SONG_PROPS) this.fireAndForget(`/live/song/start_listen/${p}`);
    // beat — шумный (каждый бит), подписываемся только явно через ensureBeatListening()
  }

  ensureBeatListening() {
    if (this.listening.has('song:beat')) return;
    this.listening.add('song:beat');
    this.fireAndForget('/live/song/start_listen/beat');
  }

  ensureViewListening() {
    if (this.listening.has('view')) return;
    this.listening.add('view');
    for (const p of VIEW_PROPS) this.fireAndForget(`/live/view/start_listen/${p}`);
  }

  ensureTrackListening(index) {
    const key = `track:${index}`;
    if (this.listening.has(key)) return;
    this.listening.add(key);
    this.fireAndForget('/live/track/start_listen/*', [index]);
    for (const p of TRACK_PROPS) this.fireAndForget(`/live/track/start_listen/${p}`, [index]);
  }

  ensureClipListening(track, clip) {
    const key = `clip:${track}:${clip}`;
    if (this.listening.has(key)) return;
    this.listening.add(key);
    this.fireAndForget('/live/clip/start_listen/playing_position', [track, clip]);
  }

  ensureDeviceListening(track, device) {
    const key = `device:${track}:${device}`;
    if (this.listening.has(key)) return;
    this.listening.add(key);
    this.fireAndForget('/live/device/start_listen/*', [track, device]);
    for (const p of DEVICE_PROPS) this.fireAndForget(`/live/device/start_listen/${p}`, [track, device]);
  }

  ensureSceneListening(index) {
    const key = `scene:${index}`;
    if (this.listening.has(key)) return;
    this.listening.add(key);
    this.fireAndForget('/live/scene/start_listen/*', [index]);
    for (const p of SCENE_PROPS) this.fireAndForget(`/live/scene/start_listen/${p}`, [index]);
  }

  // --- Push handling (unsolicited listener-сообщения на том же UDP-сокете) ---

  handlePush(msg) {
    if (!msg || !msg.address) return;
    const { address, args } = msg;

    let m = address.match(/^\/live\/song\/get\/(.+)$/);
    if (m) {
      const prop = m[1];
      if (prop === 'beat') return; // beat идёт только при явной подписке, в song/state не кладём
      this.songState[prop] = singleArg(args);
      this.setCached('ableton://song/state', { ...this.songState });
      return;
    }

    m = address.match(/^\/live\/track\/get\/(.+)$/);
    if (m) {
      const prop = m[1];
      const [idx, ...rest] = Array.isArray(args) ? args : [args];
      if (typeof idx !== 'number') return;
      const cur = this.trackStates.get(idx) || {};
      cur[prop] = rest.length <= 1 ? rest[0] : rest;
      this.trackStates.set(idx, cur);
      this.setCached(`ableton://track/${idx}/state`, { index: idx, ...cur });
      return;
    }

    m = address.match(/^\/live\/view\/get\/(.+)$/);
    if (m) {
      const prop = m[1];
      this.viewState[prop] = singleArg(args);
      this.setCached('ableton://view/state', { ...this.viewState });
      return;
    }

    m = address.match(/^\/live\/clip\/get\/(.+)$/);
    if (m) {
      const prop = m[1];
      const a = Array.isArray(args) ? args : [args];
      if (a.length >= 3) {
        const [trk, clip, ...rest] = a;
        const uri = `ableton://clip/${trk}/${clip}/position`;
        const entry = { track_index: trk, clip_index: clip, [prop]: rest.length === 1 ? rest[0] : rest, updated_at: now() };
        this.clipPositions.set(`${trk}:${clip}`, entry);
        this.setCached(uri, entry);
      }
      return;
    }

    m = address.match(/^\/live\/device\/get\/(.+)$/);
    if (m) {
      const prop = m[1];
      const a = Array.isArray(args) ? args : [args];
      const key = a.length >= 2 ? `${a[0]}:${a[1]}` : 'unknown';
      const entry = this.deviceStates.get(key) || {};
      entry[prop] = a.slice(2);
      this.deviceStates.set(key, entry);
      if (a.length >= 2) {
        this.setCached(`ableton://device/${a[0]}/${a[1]}/parameters`, { track_index: a[0], device_index: a[1], ...entry });
      }
      return;
    }

    m = address.match(/^\/live\/scene\/get\/(.+)$/);
    if (m) {
      const prop = m[1];
      const a = Array.isArray(args) ? args : [args];
      if (a.length >= 1 && typeof a[0] === 'number') {
        const [idx, ...rest] = a;
        const cur = this.sceneStates.get(idx) || {};
        cur[prop] = rest.length <= 1 ? rest[0] : rest;
        this.sceneStates.set(idx, cur);
        this.setCached(`ableton://scene/${idx}/state`, { index: idx, ...cur });
      }
      return;
    }
  }

  // --- Fetch (для readCallback): подписка + best-effort опрос, кэш при offline ---

  async safeRequest(address, args = []) {
    try {
      return await this.osc.request(address, args);
    } catch {
      return undefined;
    }
  }

  async fetchSongState() {
    this.ensureSongListening();
    const [playing, tempo, position, loop, metronome, recordMode] = await Promise.all([
      this.safeRequest('/live/song/get/is_playing').then((v) => v ?? this.safeRequest('/live/song/is_playing')),
      this.safeRequest('/live/song/get/tempo').then((v) => v ?? this.safeRequest('/live/song/tempo')),
      this.safeRequest('/live/song/get/current_song_time').then((v) => v ?? this.safeRequest('/live/song/current_song_time')),
      this.safeRequest('/live/song/get/loop'),
      this.safeRequest('/live/song/get/metronome'),
      this.safeRequest('/live/song/get/record_mode'),
    ]);
    const data = {
      ...(playing !== undefined ? { is_playing: playing } : {}),
      ...(tempo !== undefined ? { tempo } : {}),
      ...(position !== undefined ? { current_song_time: position } : {}),
      ...(loop !== undefined ? { loop } : {}),
      ...(metronome !== undefined ? { metronome } : {}),
      ...(recordMode !== undefined ? { record_mode: recordMode } : {}),
      ...this.songState,
    };
    if (Object.keys(data).length > 0) {
      this.songState = { ...this.songState, ...data };
      this.cache.set('ableton://song/state', { uri: 'ableton://song/state', updated_at: now(), data: this.songState });
    }
    return this.songState;
  }

  async fetchTrackState(index) {
    this.ensureTrackListening(index);
    const cached = this.trackStates.get(index) || {};
    const queries = {
      name: this.safeRequest('/live/track/get/name', [index]),
      volume: this.safeRequest('/live/track/get/volume', [index]),
      panning: this.safeRequest('/live/track/get/panning', [index]),
      mute: this.safeRequest('/live/track/get/mute', [index]),
      solo: this.safeRequest('/live/track/get/solo', [index]),
      arm: this.safeRequest('/live/track/get/arm', [index]),
    };
    const vals = {};
    for (const [k, p] of Object.entries(queries)) {
      const v = await p;
      if (v !== undefined) vals[k] = singleArg(v);
    }
    const data = { index, ...cached, ...vals };
    if (Object.keys(vals).length > 0) {
      this.trackStates.set(index, { ...cached, ...vals });
      this.cache.set(`ableton://track/${index}/state`, { uri: `ableton://track/${index}/state`, updated_at: now(), data });
    }
    return data;
  }

  async fetchViewState() {
    this.ensureViewListening();
    const [track, scene] = await Promise.all([
      this.safeRequest('/live/view/get/selected_track'),
      this.safeRequest('/live/view/get/selected_scene'),
    ]);
    const data = {
      ...(track !== undefined ? { selected_track: singleArg(track) } : {}),
      ...(scene !== undefined ? { selected_scene: singleArg(scene) } : {}),
      ...this.viewState,
    };
    if (Object.keys(data).length > 0) {
      this.viewState = { ...this.viewState, ...data };
      this.cache.set('ableton://view/state', { uri: 'ableton://view/state', updated_at: now(), data: this.viewState });
    }
    return this.viewState;
  }

  async fetchClipPosition(track, clip) {
    this.ensureClipListening(track, clip);
    const pos = await this.safeRequest('/live/clip/get/playing_position', [track, clip]);
    const cached = this.clipPositions.get(`${track}:${clip}`) || {};
    const data = {
      track_index: track,
      clip_index: clip,
      ...cached,
      ...(pos !== undefined ? { playing_position: singleArg(pos) } : {}),
    };
    return data;
  }

  async fetchDeviceParameters(track, device) {
    this.ensureDeviceListening(track, device);
    const params = await this.safeRequest('/live/tracks', [track, 'devices', device, 'parameters']);
    const cached = this.deviceStates.get(`${track}:${device}`) || {};
    const data = {
      track_index: track,
      device_index: device,
      ...cached,
      ...(params !== undefined ? { parameters: params } : {}),
    };
    return data;
  }

  async fetchSceneState(index) {
    this.ensureSceneListening(index);
    const cached = this.sceneStates.get(index) || {};
    const [name, isTriggered, tempo] = await Promise.all([
      this.safeRequest('/live/scene/get/name', [index]),
      this.safeRequest('/live/scene/get/is_triggered', [index]),
      this.safeRequest('/live/scene/get/tempo', [index]),
    ]);
    const data = {
      index,
      ...cached,
      ...(name !== undefined ? { name: singleArg(name) } : {}),
      ...(isTriggered !== undefined ? { is_triggered: singleArg(isTriggered) } : {}),
      ...(tempo !== undefined ? { tempo: singleArg(tempo) } : {}),
    };
    return data;
  }
}
