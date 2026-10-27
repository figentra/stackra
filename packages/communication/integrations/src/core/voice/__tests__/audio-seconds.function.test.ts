/**
 * Stackra file contract:
 * Purpose: unit tests of `audioSeconds`: seconds from bytes per encoding, rate and channels; a bad rate or channel
 *          count refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; R3-SO-11.
 */
import { describe, expect, it } from "@stackra/testing";

import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import { audioSeconds } from "#core/voice/audio-seconds.function";

describe("audioSeconds", () => {
  it("divides bytes by the byte rate", () => {
    expect(
      audioSeconds(32_000, { encoding: AudioEncoding.Linear16, sampleRate: 16_000, channels: 1 }),
    ).toBe(1);
    expect(
      audioSeconds(4000, { encoding: AudioEncoding.Alaw, sampleRate: 8000, channels: 1 }),
    ).toBe(0.5);
    expect(
      audioSeconds(64_000, { encoding: AudioEncoding.Linear16, sampleRate: 16_000, channels: 2 }),
    ).toBe(1);
    expect(audioSeconds(0, { encoding: AudioEncoding.Mulaw, sampleRate: 8000, channels: 1 })).toBe(
      0,
    );
  });

  it("refuses a bad sample rate or channel count", () => {
    expect(() =>
      audioSeconds(1, { encoding: AudioEncoding.Mulaw, sampleRate: 0, channels: 1 }),
    ).toThrow(RangeError);
    expect(() =>
      audioSeconds(1, { encoding: AudioEncoding.Mulaw, sampleRate: 8000, channels: 1.5 }),
    ).toThrow(RangeError);
  });
});
