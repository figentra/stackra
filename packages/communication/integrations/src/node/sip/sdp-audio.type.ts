/**
 * Stackra file contract:
 * Purpose: `SdpAudio`, the audio stream an SDP offer or answer describes: where to send RTP and the payload types the
 *          far end takes, in its order of preference.
 * Boundary: a type only; `parseSdp` fills it from the first `m=audio` line.
 * Runtime: node
 * Governing contract: RFC 4566; RFC 3264; ADR 0376 (decision 7: the SIP driver).
 */

/** One audio stream. */
export interface SdpAudio {
  /** The connection address (`c=`), media level over session level. */
  readonly address: string;

  /** The RTP port; 0 when the stream is refused. */
  readonly port: number;

  /** The payload types on the `m=` line, in order. */
  readonly payloadTypes: readonly number[];
}
