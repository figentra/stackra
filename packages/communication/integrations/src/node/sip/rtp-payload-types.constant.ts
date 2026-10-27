/**
 * Stackra file contract:
 * Purpose: `RTP_PAYLOAD_TYPES`, the static RTP payload type of each phone-line `AudioEncoding` a SIP trunk carries:
 *          G.711 mu-law (PCMU) 0 and A-law (PCMA) 8, both 8000 Hz mono.
 * Boundary: protocol constants (RFC 3551 table 4), not business values; which of them a trunk offers, and in which
 *           order, is the trunk's `codecs` option.
 * Runtime: node
 * Governing contract: RFC 3551 (section 6); ADR 0376 (decision 7: the SIP driver).
 */
import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";

/** Phone-line encodings to RTP payload type, with their SDP names. */
export const RTP_PAYLOAD_TYPES: Readonly<
  Partial<Record<AudioEncoding, { readonly type: number; readonly name: string }>>
> = Object.freeze({
  [AudioEncoding.Mulaw]: { type: 0, name: "PCMU" },
  [AudioEncoding.Alaw]: { type: 8, name: "PCMA" },
});
