export interface TransportState {
    isPlaying: boolean;
    position: number;
    bpm: number;
    timeSignatureNumerator: number;
    timeSignatureDenominator: number;
    isRecording: boolean;
}
export interface Track {
    index: number;
    name: string;
    type: 'midi' | 'audio' | 'return' | 'master';
    volume: number;
    pan: number;
    isMuted: boolean;
    isSolo: boolean;
    isArmed: boolean;
    clipsCount: number;
}
export interface Clip {
    trackIndex: number;
    sceneIndex: number;
    name: string;
    isAudio: boolean;
    isMidi: boolean;
    length: number;
    startTime: number;
    color: string;
    loopStart: number;
    loopEnd: number;
    loopEnabled: boolean;
}
export interface Note {
    pitch: number;
    startTime: number;
    duration: number;
    velocity: number;
}
export interface Device {
    name: string;
    type: string;
    isEnabled: boolean;
    parameters: DeviceParameter[];
}
export interface DeviceParameter {
    name: string;
    value: number;
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
//# sourceMappingURL=types.d.ts.map