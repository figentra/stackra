/**
 * Stackra file contract:
 * Purpose: unit tests of `sdpOffer` and `parseSdp`: the offer lists the trunk's G.711 codecs in order at the public
 *          address, linear16 is refused, and parsing reads the first audio stream with media-level over session-level
 *          addresses, from a recorded answer in the shape of RFC 3264 section 10.1.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); RFC 4566; RFC 3264.
 */
import { describe, expect, it } from "@stackra/testing";

import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import { parseSdp } from "#node/sip/parse-sdp.function";
import { sdpOffer } from "#node/sip/sdp-offer.function";

describe("sdpOffer", () => {
  it("offers the codecs in order", () => {
    const offer = sdpOffer("203.0.113.7", 40_000, [AudioEncoding.Alaw, AudioEncoding.Mulaw], 7);
    expect(offer).toContain("c=IN IP4 203.0.113.7\r\n");
    expect(offer).toContain("m=audio 40000 RTP/AVP 8 0\r\n");
    expect(offer).toContain("a=rtpmap:8 PCMA/8000\r\na=rtpmap:0 PCMU/8000\r\n");
    expect(parseSdp(offer)).toEqual({ address: "203.0.113.7", port: 40_000, payloadTypes: [8, 0] });
  });

  it("refuses an encoding RTP does not carry here", () => {
    expect(() => sdpOffer("203.0.113.7", 1, [AudioEncoding.Linear16], 1)).toThrow(RangeError);
  });
});

describe("parseSdp", () => {
  it("reads the first audio stream, media address over session address", () => {
    const answer = [
      "v=0",
      "o=bob 2808844564 2808844564 IN IP4 host.biloxi.example.com",
      "s=",
      "c=IN IP4 192.0.2.1",
      "t=0 0",
      "m=video 0 RTP/AVP 31",
      "m=audio 49172 RTP/AVP 0 8 101",
      "c=IN IP4 192.0.2.4",
      "a=rtpmap:0 PCMU/8000",
      "m=audio 50000 RTP/AVP 8",
      "",
    ].join("\r\n");
    expect(parseSdp(answer)).toEqual({
      address: "192.0.2.4",
      port: 49_172,
      payloadTypes: [0, 8, 101],
    });
  });

  it("refuses a body with no audio or no address", () => {
    expect(() => parseSdp("v=0\r\nc=IN IP4 192.0.2.1\r\nm=video 1 RTP/AVP 31\r\n")).toThrow(
      RangeError,
    );
    expect(() => parseSdp("v=0\r\nm=audio 1 RTP/AVP 0\r\n")).toThrow(RangeError);
  });
});
