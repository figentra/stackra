/**
 * Stackra file contract:
 * Purpose: unit tests of `wavAudio`: the data chunk of a mono 8000 Hz A-law WAV, and refusals of a file in another
 *          codec or not a WAV at all.
 * Boundary: test only; the WAV files are built in the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); RFC 2361.
 */
import { describe, expect, it } from "@stackra/testing";

import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import { wavAudio } from "#node/sip/wav-audio.function";

/** A WAV with format `tag`, `channels` and `rate` around `data`. */
function wav(tag: number, channels: number, rate: number, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(44 + data.byteLength);
  const view = new DataView(bytes.buffer);
  const ascii = (at: number, text: string): void =>
    bytes.set(
      Array.from(text, (char) => char.charCodeAt(0)),
      at,
    );
  ascii(0, "RIFF");
  view.setUint32(4, 36 + data.byteLength, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, tag, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  ascii(36, "data");
  view.setUint32(40, data.byteLength, true);
  bytes.set(data, 44);
  return bytes;
}

describe("wavAudio", () => {
  it("gives the samples of a WAV in the call's codec", () => {
    expect(wavAudio(wav(6, 1, 8000, Uint8Array.of(1, 2, 3)), AudioEncoding.Alaw)).toEqual(
      Uint8Array.of(1, 2, 3),
    );
  });

  it("refuses another codec, rate or channel count, and a non-WAV", () => {
    const data = Uint8Array.of(1);
    expect(() => wavAudio(wav(6, 1, 8000, data), AudioEncoding.Mulaw)).toThrow(RangeError);
    expect(() => wavAudio(wav(6, 1, 16000, data), AudioEncoding.Alaw)).toThrow(RangeError);
    expect(() => wavAudio(wav(6, 2, 8000, data), AudioEncoding.Alaw)).toThrow(RangeError);
    expect(() => wavAudio(Uint8Array.of(1, 2, 3), AudioEncoding.Alaw)).toThrow(RangeError);
  });
});
