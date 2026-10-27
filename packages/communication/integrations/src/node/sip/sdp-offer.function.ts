/**
 * Stackra file contract:
 * Purpose: `sdpOffer`, the SDP the SIP trunk driver sends: an offer listing the trunk's codecs, or an answer naming the
 *          one chosen, for one send-and-receive G.711 audio stream at 20 ms packets.
 * Boundary: a pure function. The address is the public one the carrier reaches (the trunk's `publicAddress` option);
 *           DTMF (`telephone-event`) is not offered.
 * Runtime: node
 * Governing contract: RFC 4566; RFC 3264; RFC 3551; ADR 0376 (decision 7: the SIP driver).
 */
import type { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import { RTP_PAYLOAD_TYPES } from "#node/sip/rtp-payload-types.constant";

/**
 * The SDP body for `encodings` at `address`:`port`.
 *
 * @example
 * const body = sdpOffer("203.0.113.7", 40000, ["alaw", "mulaw"], 1);
 * @throws RangeError when an encoding has no RTP payload type (linear16).
 */
export function sdpOffer(
  address: string,
  port: number,
  encodings: readonly AudioEncoding[],
  session: number,
): string {
  const codecs = encodings.map((encoding) => {
    const codec = RTP_PAYLOAD_TYPES[encoding];
    if (codec === undefined) throw new RangeError(`${encoding} is not carried over RTP here`);
    return codec;
  });
  const family = address.includes(":") ? "IP6" : "IP4";
  return [
    "v=0",
    `o=- ${session} ${session} IN ${family} ${address}`,
    "s=-",
    `c=IN ${family} ${address}`,
    "t=0 0",
    `m=audio ${port} RTP/AVP ${codecs.map((codec) => codec.type).join(" ")}`,
    ...codecs.map((codec) => `a=rtpmap:${codec.type} ${codec.name}/8000`),
    "a=ptime:20",
    "a=sendrecv",
    "",
  ].join("\r\n");
}
