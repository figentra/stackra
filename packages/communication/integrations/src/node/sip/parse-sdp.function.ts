/**
 * Stackra file contract:
 * Purpose: `parseSdp`, the reader of the far end's SDP offer or answer: the first audio stream's address, port and
 *          payload types.
 * Boundary: a pure function. IPv4 and IPv6 connection lines are read alike; anything but the first `m=audio` is
 *           ignored. A body without an audio stream or address is a `RangeError`.
 * Runtime: node
 * Governing contract: RFC 4566 (sections 5.7 and 5.14); RFC 3264; ADR 0376 (decision 7: the SIP driver).
 */
import type { SdpAudio } from "#node/sip/sdp-audio.type";

/**
 * The audio stream of `sdp`.
 *
 * @example
 * const far = parseSdp(response.body); // { address: "192.0.2.4", port: 3456, payloadTypes: [8, 0] }
 * @throws RangeError when the body has no audio stream or no connection address.
 */
export function parseSdp(sdp: string): SdpAudio {
  let session: string | undefined;
  let media: string | undefined;
  let audio: { port: number; payloadTypes: number[] } | undefined;
  let inAudio = false;
  for (const line of sdp.split(/\r?\n/)) {
    if (line.startsWith("m=")) {
      inAudio = audio === undefined && line.startsWith("m=audio ");
      if (inAudio) {
        const [, port = "0", , ...types] = line.slice(2).split(" ");
        audio = { port: Number(port), payloadTypes: types.map(Number) };
      } else if (audio !== undefined) break;
    } else if (line.startsWith("c=")) {
      const address = line.split(" ")[2];
      if (inAudio) media = address;
      else if (audio === undefined) session = address;
    }
  }
  const address = media ?? session;
  if (audio === undefined) throw new RangeError("the SDP has no audio stream");
  if (address === undefined) throw new RangeError("the SDP has no connection address");
  return { address, ...audio };
}
