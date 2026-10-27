/**
 * Stackra file contract:
 * Purpose: `audioSeconds(bytes, format)`, how many seconds `bytes` of raw audio in `format` last.
 * Boundary: pure. Exact (fractional) seconds; rounding for a price is rate-card data.
 * Runtime: isomorphic
 * Governing contract: R3-SO-11 (speech.seconds); ADR 0376 (decision 7).
 */
import { Enum } from "@stackra/contracts";

import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import type { AudioFormat } from "#contracts/voice/audio-format.type";

/**
 * Seconds of audio.
 *
 * @throws RangeError for a sample rate or channel count that is not a positive integer.
 * @example
 * audioSeconds(32_000, { encoding: AudioEncoding.Linear16, sampleRate: 16_000, channels: 1 }); // 1
 */
export function audioSeconds(bytes: number, format: AudioFormat): number {
  if (!Number.isInteger(format.sampleRate) || format.sampleRate <= 0)
    throw new RangeError("audioSeconds: the sample rate must be a positive integer");
  if (!Number.isInteger(format.channels) || format.channels <= 0)
    throw new RangeError("audioSeconds: the channel count must be a positive integer");
  const width = Enum.meta(AudioEncoding, format.encoding).bytesPerSample;
  return bytes / (format.sampleRate * format.channels * width);
}
