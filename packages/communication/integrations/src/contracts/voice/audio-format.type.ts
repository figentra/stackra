/**
 * Stackra file contract:
 * Purpose: `AudioFormat`, the shape of the raw audio in a speech stream: its encoding, sample rate and channel count.
 * Boundary: a type only. The caller states the format of what it sends to recognition and of what it wants back from
 *           synthesis; a provider that cannot take it refuses.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7: the Speech port).
 */
import type { AudioEncoding } from "#contracts/voice/audio-encoding.enum";

/** Raw audio's shape. */
export interface AudioFormat {
  /** The sample encoding. */
  readonly encoding: AudioEncoding;

  /** Samples per second per channel (8000 on a phone line, 16000 from a device microphone). */
  readonly sampleRate: number;

  /** Interleaved channels; 1 for speech. */
  readonly channels: number;
}
