/**
 * Stackra file contract:
 * Purpose: `AudioDevice`, the port of a local microphone and speaker (a drive-through lane, a till, a kiosk): capture raw
 *          audio for speech recognition and play synthesised audio back.
 * Boundary: an abstract class that is its own token, key `integrations.AudioDevice`. A device driver binds it on the
 *           device (the platform's microphone, a peripherals bridge); `MemoryAudioDeviceDriver` is the in-memory one.
 *           It knows nothing of speech providers; `SpeechService#listenOn` and `#sayOn` join the two. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7: the device-audio driver); R3-SO-10 (kiosk audio through the Speech port);
 *                     RES-240 (drive-through ordering); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { AudioFormat } from "#contracts/voice/audio-format.type";

/**
 * A microphone and a speaker.
 *
 * @example
 * export class LaneMicrophoneDriver extends Driver(AudioDevice) { … }
 */
export abstract class AudioDevice extends Port {
  /** Type-only port key. */
  declare readonly "~key": "integrations.AudioDevice";

  /** The microphone's audio in `format`, chunk by chunk, until `signal` aborts or the device stops. */
  abstract capture(format: AudioFormat, signal?: AbortSignal): AsyncIterable<Uint8Array>;

  /** Plays `audio` (raw, in `format`) on the speaker; resolves when the last chunk has played. */
  abstract play(audio: AsyncIterable<Uint8Array>, format: AudioFormat): Promise<void>;
}
