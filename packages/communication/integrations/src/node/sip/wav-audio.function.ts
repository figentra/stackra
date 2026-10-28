/**
 * Stackra file contract:
 * Purpose: `wavAudio`, the samples of a WAV file a `play` step names, when the file is already in the call's codec:
 *          G.711 A-law (format 6) or mu-law (format 7), 8000 Hz, mono.
 * Boundary: a pure function. Any other file (MP3, linear PCM, another rate) is a `RangeError`: the driver does not
 *           transcode, so a tenant's hold music is uploaded in the trunk's codec.
 * Runtime: node
 * Governing contract: RFC 2361 (WAVE format tags); ADR 0376 (decision 7: the SIP driver).
 */
import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";

/** WAVE format tags of the phone-line encodings. */
const TAGS: Readonly<Partial<Record<AudioEncoding, number>>> = {
  [AudioEncoding.Alaw]: 6,
  [AudioEncoding.Mulaw]: 7,
};

/**
 * The `data` chunk of `wav`.
 *
 * @example
 * await device.play(once(wavAudio(bytes, AudioEncoding.Alaw)), format);
 * @throws RangeError when `wav` is not a mono 8000 Hz WAV in `encoding`.
 */
export function wavAudio(wav: Uint8Array, encoding: AudioEncoding): Uint8Array {
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const text = (at: number): string => String.fromCodePoint(...wav.subarray(at, at + 4));
  if (wav.byteLength < 12 || text(0) !== "RIFF" || text(8) !== "WAVE")
    throw new RangeError("the audio is not a WAV file");
  let at = 12;
  let fits = false;
  while (at + 8 <= wav.byteLength) {
    const id = text(at);
    const size = view.getUint32(at + 4, true);
    if (id === "fmt ") {
      fits =
        view.getUint16(at + 8, true) === TAGS[encoding] &&
        view.getUint16(at + 10, true) === 1 &&
        view.getUint32(at + 12, true) === 8000;
    } else if (id === "data") {
      if (!fits) throw new RangeError(`the WAV file is not mono 8000 Hz ${encoding}`);
      return wav.subarray(at + 8, Math.min(at + 8 + size, wav.byteLength));
    }
    at += 8 + size + (size % 2);
  }
  throw new RangeError("the WAV file has no data");
}
