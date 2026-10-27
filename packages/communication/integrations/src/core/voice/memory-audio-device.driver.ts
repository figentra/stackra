/**
 * Stackra file contract:
 * Purpose: `MemoryAudioDeviceDriver`, the in-memory `AudioDevice`: its microphone yields the chunks it was given, its
 *          speaker keeps what was played, for local development and tests of a lane or kiosk flow.
 * Boundary: the driver named `memory`. No real audio; a device driver (platform microphone, peripherals bridge) is the
 *           production binding and lives with the device.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7: the device-audio driver); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { AudioDevice } from "#contracts/voice/audio-device.port";
import type { AudioFormat } from "#contracts/voice/audio-format.type";

/**
 * A device whose microphone replays given chunks.
 *
 * @example
 * const device = new MemoryAudioDeviceDriver([pcmChunk]);
 * await speech.sayOn(device, greeting, request, session);
 * device.played; // the synthesised chunks
 */
export class MemoryAudioDeviceDriver extends Driver(AudioDevice) {
  /** What the speaker played, in order. */
  readonly played: Uint8Array[] = [];

  /** What the microphone hears, chunk by chunk. */
  private readonly heard: readonly Uint8Array[];

  /**
   * @param heard - the chunks `capture` yields.
   */
  constructor(heard: readonly Uint8Array[] = []) {
    super();
    this.heard = heard;
  }

  /**
   * Yields the given chunks until they run out or `signal` aborts.
   *
   * @yields Each given chunk.
   */
  async *capture(_format: AudioFormat, signal?: AbortSignal): AsyncGenerator<Uint8Array> {
    for (const chunk of this.heard) {
      if (signal?.aborted === true) return;
      yield chunk;
    }
  }

  /** Keeps every chunk of `audio`. */
  async play(audio: AsyncIterable<Uint8Array>, _format: AudioFormat): Promise<void> {
    for await (const chunk of audio) this.played.push(chunk);
  }
}
