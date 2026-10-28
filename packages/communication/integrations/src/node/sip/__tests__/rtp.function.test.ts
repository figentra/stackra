/**
 * Stackra file contract:
 * Purpose: unit tests of `rtpPacket` and `rtpPayload`: the RFC 3550 header layout, wrap-around, a round trip, and
 *          reading past contributing sources, a header extension and padding; non-RTP is dropped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); RFC 3550 (section 5.1).
 */
import { describe, expect, it } from "@stackra/testing";

import { rtpPacket } from "#node/sip/rtp-packet.function";
import { rtpPayload } from "#node/sip/rtp-payload.function";

describe("rtpPacket", () => {
  it("writes the header and payload", () => {
    const packet = rtpPacket(
      {
        payloadType: 8,
        sequence: 0x1_0001,
        timestamp: 2 ** 32 + 160,
        ssrc: 0xdeadbeef,
        marker: true,
      },
      Uint8Array.of(1, 2, 3),
    );
    expect([...packet]).toEqual([
      0x80, 0x88, 0x00, 0x01, 0x00, 0x00, 0x00, 0xa0, 0xde, 0xad, 0xbe, 0xef, 1, 2, 3,
    ]);
    expect(rtpPayload(packet)).toEqual({ payloadType: 8, payload: Uint8Array.of(1, 2, 3) });
  });
});

describe("rtpPayload", () => {
  it("skips contributing sources, the extension and padding", () => {
    const packet = Uint8Array.of(
      0xb1,
      0x00,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1, // V2, padding, extension, CC 1, PT 0
      9,
      9,
      9,
      9, // one CSRC
      0xbe,
      0xde,
      0,
      1,
      7,
      7,
      7,
      7, // extension of one word
      42,
      43, // payload
      0,
      2, // two bytes of padding
    );
    expect(rtpPayload(packet)).toEqual({ payloadType: 0, payload: Uint8Array.of(42, 43) });
  });

  it("drops what is not RTP version 2", () => {
    expect(rtpPayload(new Uint8Array(4))).toBeUndefined();
    expect(rtpPayload(new Uint8Array(12))).toBeUndefined();
  });
});
