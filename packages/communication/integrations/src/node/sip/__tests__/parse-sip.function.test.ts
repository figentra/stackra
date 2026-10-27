/**
 * Stackra file contract:
 * Purpose: unit tests of `parseSip` and `formatSip` on a recorded INVITE in the shape of RFC 3665 section 3.1 (compact
 *          and folded headers, a two-entry Via list, Record-Route) and a 200 OK: start lines, header expansion, the
 *          body cut at Content-Length, malformed input refused, and a format-then-parse round trip.
 * Boundary: test only; the fixtures are written from the RFC examples, not captured from a carrier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); RFC 3261 (section 7); RFC 3665.
 */
import { describe, expect, it } from "@stackra/testing";

import { formatSip } from "#node/sip/format-sip.function";
import { parseSip } from "#node/sip/parse-sip.function";
import { sipHeaders } from "#node/sip/sip-headers.function";

const SDP =
  "v=0\r\no=- 1 1 IN IP4 192.0.2.101\r\ns=-\r\nc=IN IP4 192.0.2.101\r\nt=0 0\r\nm=audio 49172 RTP/AVP 0\r\n";

const INVITE = [
  "INVITE sip:+966112345678@carrier.test SIP/2.0",
  "v: SIP/2.0/UDP 192.0.2.10:5060;branch=z9hG4bK2d4790, SIP/2.0/UDP 192.0.2.101:5060;branch=z9hG4bK74bf9",
  "Max-Forwards: 69",
  "Record-Route: <sip:sbc.carrier.test;lr>",
  "f: <sip:+966501234567@carrier.test>;tag=9fxced76sl",
  "t: <sip:+966112345678@carrier.test>",
  "i: 3848276298220188511@192.0.2.101",
  "CSeq: 1 INVITE",
  "m: <sip:+966501234567@192.0.2.101:5060>",
  "Subject: a folded",
  "  header",
  "c: application/sdp",
  `l: ${SDP.length}`,
  "",
  `${SDP}trailing bytes past the length`,
].join("\r\n");

describe("parseSip", () => {
  it("reads a request with compact, folded and listed headers", () => {
    const invite = parseSip(INVITE);
    expect(invite.method).toBe("INVITE");
    expect(invite.uri).toBe("sip:+966112345678@carrier.test");
    expect(sipHeaders(invite, "via")).toHaveLength(2);
    expect(sipHeaders(invite, "Call-ID")).toEqual(["3848276298220188511@192.0.2.101"]);
    expect(sipHeaders(invite, "Subject")).toEqual(["a folded header"]);
    expect(sipHeaders(invite, "From")[0]).toContain(";tag=9fxced76sl");
    expect(invite.body).toBe(SDP);
  });

  it("reads a response", () => {
    const ok = parseSip("SIP/2.0 200 OK\r\nCSeq: 1 INVITE\r\nContent-Length: 0\r\n\r\n");
    expect(ok).toMatchObject({ status: 200, reason: "OK", body: "" });
    expect(ok.method).toBeUndefined();
  });

  it("refuses what is not a SIP message", () => {
    expect(() => parseSip("hello")).toThrow(RangeError);
    expect(() => parseSip("GET / HTTP/1.1\r\nHost: x\r\n\r\n")).toThrow(RangeError);
    expect(() => parseSip("BYE sip:a@b SIP/2.0\r\nno colon\r\n\r\n")).toThrow(RangeError);
  });

  it("round-trips through formatSip with the body's byte length", () => {
    const invite = parseSip(INVITE);
    const text = formatSip(invite);
    expect(text).toContain(`Content-Length: ${SDP.length}\r\n\r\n${SDP}`);
    const again = parseSip(text);
    const withoutLength = (headers: typeof invite.headers) =>
      headers.filter(([name]) => name !== "Content-Length");
    expect(withoutLength(again.headers)).toEqual(withoutLength(invite.headers));
    expect(again.body).toBe(invite.body);
  });
});
