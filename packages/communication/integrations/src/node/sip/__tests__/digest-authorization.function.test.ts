/**
 * Stackra file contract:
 * Purpose: unit tests of `digestAuthorization` against the published examples: RFC 2617 section 3.5 (MD5, qop auth)
 *          and RFC 7616 section 3.9.1 (SHA-256, qop auth), the RFC 2069 form without qop, and the refusals.
 * Boundary: test only; the vectors are the RFCs' own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); RFC 2617; RFC 7616; RFC 3261 (section 22.4).
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { digestAuthorization } from "#node/sip/digest-authorization.function";

const md5 = (text: string): string => createHash("md5").update(text).digest("hex");

describe("digestAuthorization", () => {
  it("answers the RFC 2617 example", () => {
    const value = digestAuthorization(
      'Digest realm="testrealm@host.com", qop="auth,auth-int", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"',
      {
        method: "GET",
        uri: "/dir/index.html",
        username: "Mufasa",
        password: "Circle Of Life",
        cnonce: "0a4f113b",
      },
    );
    expect(value).toContain('response="6629fae49393a05397450978507c4ef1"');
    expect(value).toContain("qop=auth, nc=00000001");
    expect(value).toContain('opaque="5ccc069c403ebaf9f0171e9517f40e41"');
  });

  it("answers the RFC 7616 SHA-256 example", () => {
    const value = digestAuthorization(
      'Digest realm="http-auth@example.org", qop="auth, auth-int", algorithm=SHA-256, nonce="7ypf/xlj9XXwfDPEoM4URrv/xwf94BcCAzFZH4GiTo0v", opaque="FQhe/qaU925kfnzjCev0ciny7QMkPqMAFRtzCUYo5tdS"',
      {
        method: "GET",
        uri: "/dir/index.html",
        username: "Mufasa",
        password: "Circle of Life",
        cnonce: "f2/wE4q74E6zIJEtWaHKaf5wv/H5QzzpXusqGemxURZJ",
      },
    );
    expect(value).toContain(
      'response="753927fa0e85d155564e2e272a28d1802ca10daf4496794697cf8db5856cb6c1"',
    );
    expect(value).toContain("algorithm=SHA-256");
  });

  it("answers a challenge without qop the RFC 2069 way", () => {
    const value = digestAuthorization('Digest realm="carrier.test", nonce="n1"', {
      method: "INVITE",
      uri: "sip:+966501234567@carrier.test",
      username: "trunk",
      password: "secret",
      cnonce: "c1",
    });
    const expected = md5(
      `${md5("trunk:carrier.test:secret")}:n1:${md5("INVITE:sip:+966501234567@carrier.test")}`,
    );
    expect(value).toContain(`response="${expected}"`);
    expect(value).not.toContain("qop=");
  });

  it("refuses what it does not serve", () => {
    const request = { method: "INVITE", uri: "sip:a@b", username: "u", password: "p", cnonce: "c" };
    expect(() => digestAuthorization('Basic realm="x"', request)).toThrow(RangeError);
    expect(() => digestAuthorization('Digest realm="x"', request)).toThrow(RangeError);
    expect(() =>
      digestAuthorization('Digest realm="x", nonce="n", algorithm=MD5-sess', request),
    ).toThrow(RangeError);
    expect(() =>
      digestAuthorization('Digest realm="x", nonce="n", qop="auth-int"', request),
    ).toThrow(RangeError);
  });
});
