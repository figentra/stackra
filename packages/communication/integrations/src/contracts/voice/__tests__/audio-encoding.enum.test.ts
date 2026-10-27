/**
 * Stackra file contract:
 * Purpose: unit tests of `AudioEncoding`: its codes, in order, and the bytes per sample of each.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0376 (decision 7).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";

describe("AudioEncoding", () => {
  it("lists the uncompressed encodings with their sample width", () => {
    expect(Enum.values(AudioEncoding)).toEqual(["linear16", "mulaw", "alaw"]);
    expect(Enum.meta(AudioEncoding, AudioEncoding.Linear16).bytesPerSample).toBe(2);
    expect(Enum.meta(AudioEncoding, AudioEncoding.Mulaw).bytesPerSample).toBe(1);
    expect(Enum.meta(AudioEncoding, AudioEncoding.Alaw).bytesPerSample).toBe(1);
  });
});
