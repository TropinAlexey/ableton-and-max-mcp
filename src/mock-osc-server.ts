/**
 * Mock OSC Server для тестирования без Ableton Live
 * Имитирует ответы Ableton Live на OSC запросы
 */

import osc from 'osc';

const UDPPort = osc.UDPPort;

const DEBUG = process.env.DEBUG === 'true';

interface MockState {
  isPlaying: boolean;
  tempo: number;
  position: number;
  isRecording: boolean;
  tracks: Map<
    number,
    {
      name: string;
      volume: number;
      pan: number;
      muted: boolean;
      solo: boolean;
      armed: boolean;
    }
  >;
}

export class MockOSCServer {
  private port: InstanceType<typeof UDPPort>;
  private state: MockState;
  private clientAddress: string = '127.0.0.1';
  private clientPort: number = 11001;

  constructor(listenPort: number = 11001) {
    this.state = {
      isPlaying: false,
      tempo: 120,
      position: 0,
      isRecording: false,
      tracks: new Map(),
    };

    // Initialize 4 default tracks
    for (let i = 0; i < 4; i++) {
      this.state.tracks.set(i, {
        name: `Track ${i + 1}`,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        armed: false,
      });
    }

    this.port = new UDPPort({
      localAddress: '127.0.0.1',
      localPort: listenPort,
      remoteAddress: '127.0.0.1',
      remotePort: 11000,
      broadcast: false,
      metadata: false,
    });

    this.port.on('message', (...args: unknown[]) => {
      const oscMsg = args[0] as any;
      this.handleMessage(oscMsg);
    });

    this.port.on('error', (...args: unknown[]) => {
      const error = args[0] as Error;
      console.error('[Mock OSC] Error:', error.message);
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.port.open();
      console.error('[Mock OSC] Server started on port 11001');
      setTimeout(() => resolve(), 100);
    });
  }

  stop(): void {
    if ((this.port as any).socket) {
      this.port.close();
      console.error('[Mock OSC] Server stopped');
    }
  }

  private handleMessage(oscMsg: any): void {
    const address = oscMsg.address as string;
    const args = oscMsg.args || [];

    if (DEBUG) console.error(`[Mock OSC] Received: ${address}`, args);

    let response: unknown = null;

    // Parse and handle different OSC addresses
    if (address === '/live/song/get') {
      response = this.handleSongGet(args[0]);
    } else if (address === '/live/song/set') {
      response = this.handleSongSet(args[0], args[1]);
    } else if (address.startsWith('/live/track/')) {
      response = this.handleTrackMessage(address, args);
    }

    // Send response back to client
    if (response !== null) {
      const responseMsg = {
        address: `${address}/response`,
        args: [{ type: typeof response === 'number' ? 'f' : 's', value: response }],
      };
      (this.port as any).send(responseMsg);

      if (DEBUG) console.error(`[Mock OSC] Sent response:`, response);
    }
  }

  private handleSongGet(property: string): unknown {
    if (DEBUG) console.error(`[Mock OSC] Song.get("${property}")`);

    switch (property) {
      case 'is_playing':
        return this.state.isPlaying ? 1 : 0;
      case 'tempo':
        return this.state.tempo;
      case 'current_song_time':
        return this.state.position;
      case 'is_recording':
        return this.state.isRecording ? 1 : 0;
      default:
        return 0;
    }
  }

  private handleSongSet(property: string, value: unknown): unknown {
    if (DEBUG) console.error(`[Mock OSC] Song.set("${property}", ${value})`);

    switch (property) {
      case 'is_playing':
        this.state.isPlaying = value === 1;
        console.error(`[Mock OSC] ▶️  Playback: ${this.state.isPlaying ? 'PLAYING' : 'STOPPED'}`);
        return 1;

      case 'tempo':
        this.state.tempo = value as number;
        console.error(`[Mock OSC] 🎵 Tempo: ${this.state.tempo} BPM`);
        return 1;

      case 'current_song_time':
        this.state.position = value as number;
        if (DEBUG) console.error(`[Mock OSC] Position: ${this.state.position} bars`);
        return 1;

      case 'record_mode':
        this.state.isRecording = value === 1;
        console.error(`[Mock OSC] 🔴 Recording: ${this.state.isRecording ? 'ON' : 'OFF'}`);
        return 1;

      default:
        return 0;
    }
  }

  private handleTrackMessage(address: string, args: unknown[]): unknown {
    const match = address.match(/\/live\/track\/(\d+)/);
    if (!match) return null;

    const trackIndex = parseInt(match[1]);
    const track = this.state.tracks.get(trackIndex);
    if (!track) return null;

    // Parse track command
    const subPath = address.substring(match[0].length);

    if (subPath === '/set' && args.length >= 2) {
      const [property, value] = args;
      return this.handleTrackSet(trackIndex, track, property as string, value);
    }

    return null;
  }

  private handleTrackSet(trackIndex: number, track: any, property: string, value: unknown): unknown {
    if (DEBUG) console.error(`[Mock OSC] Track[${trackIndex}].set("${property}", ${value})`);

    switch (property) {
      case 'name':
        track.name = value as string;
        console.error(`[Mock OSC] Track ${trackIndex} renamed: "${track.name}"`);
        return 1;

      case 'mixer_device/volume/value':
        track.volume = value as number;
        console.error(
          `[Mock OSC] Track ${trackIndex} volume: ${Math.round((track.volume as number) * 100)}%`
        );
        return 1;

      case 'mixer_device/panning/value':
        track.pan = value as number;
        const panLabel =
          (track.pan as number) < -0.1
            ? 'Left'
            : (track.pan as number) > 0.1
              ? 'Right'
              : 'Center';
        console.error(`[Mock OSC] Track ${trackIndex} pan: ${panLabel}`);
        return 1;

      case 'mute':
        track.muted = value === 1;
        console.error(`[Mock OSC] Track ${trackIndex} ${track.muted ? '🔇 MUTED' : '🔊 UNMUTED'}`);
        return 1;

      case 'solo':
        track.solo = value === 1;
        console.error(`[Mock OSC] Track ${trackIndex} ${track.solo ? '🎧 SOLO' : 'solo OFF'}`);
        return 1;

      case 'arm':
        track.armed = value === 1;
        console.error(`[Mock OSC] Track ${trackIndex} ${track.armed ? '⚠️ ARMED' : 'armed OFF'}`);
        return 1;

      default:
        return 0;
    }
  }

  getState(): MockState {
    return this.state;
  }
}
