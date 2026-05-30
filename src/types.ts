// Ableton Live Object Model types for MCP

export interface TransportState {
  isPlaying: boolean;
  position: number; // in bars
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  isRecording: boolean;
}

export interface Track {
  index: number;
  name: string;
  type: 'midi' | 'audio' | 'return' | 'master';
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 to 1.0
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean; // for recording
  clipsCount: number;
}

export interface Clip {
  trackIndex: number;
  sceneIndex: number;
  name: string;
  isAudio: boolean;
  isMidi: boolean;
  length: number; // in bars
  startTime: number; // in bars
  color: string;
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
}

export interface Note {
  pitch: number; // 0-127 MIDI note
  startTime: number; // in beats
  duration: number; // in beats
  velocity: number; // 0-127
}

export interface Device {
  name: string;
  type: string; // 'Instrument', 'AudioEffect', 'MidiEffect'
  isEnabled: boolean;
  parameters: DeviceParameter[];
}

export interface DeviceParameter {
  name: string;
  value: number; // 0.0 to 1.0
  min: number;
  max: number;
}

export interface Scene {
  index: number;
  name: string;
  color: string;
}

export interface OSCMessage {
  address: string;
  args: (string | number | Buffer)[];
}

export interface OSCResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
