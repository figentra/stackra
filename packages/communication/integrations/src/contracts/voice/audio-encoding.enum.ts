/**
 * Stackra file contract:
 * Purpose: `AudioEncoding`, the uncompressed sample encodings a speech stream carries: 16-bit linear PCM (device
 *          microphones, most speech APIs) and 8-bit G.711 mu-law and A-law (phone lines), each with its bytes per
 *          sample, so the length of a stream in seconds follows from its bytes.
 * Boundary: an `Enum.of` value plus the type of the same name; `Enum.meta(AudioEncoding, e).bytesPerSample` gives the
 *           sample width. Compressed codecs are left out on purpose: their seconds cannot be read from their bytes,
 *           and the `speech.seconds` meter counts bytes.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7: the Speech port); R3-SO-11 (speech.seconds); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The uncompressed sample encodings a speech stream carries, each with its bytes per sample.
 *
 * @example
 * const width = Enum.meta(AudioEncoding, format.encoding).bytesPerSample; // 2 for linear16
 */
export const AudioEncoding = Enum.of({
  /** 16-bit signed little-endian linear PCM. */
  Linear16: ["linear16", { bytesPerSample: 2 }],
  /** 8-bit G.711 mu-law (North American and Japanese phone lines). */
  Mulaw: ["mulaw", { bytesPerSample: 1 }],
  /** 8-bit G.711 A-law (most other phone lines, the Saudi carrier's trunk among them). */
  Alaw: ["alaw", { bytesPerSample: 1 }],
});

/** One of the codes above. */
export type AudioEncoding = Enum.Value<typeof AudioEncoding>;
