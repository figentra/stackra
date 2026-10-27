/**
 * Stackra file contract:
 * Purpose: unit tests of `applyVersionHeaders`: the resolved `Deprecation` and `Sunset` land on the response headers,
 *          `Stackra-Version` joins `Vary` once (kept beside existing values, never added twice or beside `*`), and the
 *          newest version gets only `Vary`.
 * Boundary: test only; uses the platform `Headers`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decision 4); RFC 9110 section 12.5.5.
 */
import { describe, expect, it } from "@stackra/testing";

import { applyVersionHeaders } from "#core/functions/apply-version-headers.function";

const deprecated = {
  version: "2026-10-01",
  headers: { Deprecation: "@1803859200", Sunset: "Wed, 01 Mar 2028 00:00:00 GMT" },
};

describe("applyVersionHeaders", () => {
  it("writes Deprecation, Sunset and Vary for an older version", () => {
    const headers = new Headers();
    applyVersionHeaders(headers, deprecated);
    expect(headers.get("Deprecation")).toBe("@1803859200");
    expect(headers.get("Sunset")).toBe("Wed, 01 Mar 2028 00:00:00 GMT");
    expect(headers.get("Vary")).toBe("Stackra-Version");
  });

  it("writes only Vary for the newest version", () => {
    const headers = new Headers();
    applyVersionHeaders(headers, { version: "2027-09-01", headers: {} });
    expect([...headers.keys()]).toEqual(["vary"]);
  });

  it("keeps an existing Vary and never repeats the version header", () => {
    const headers = new Headers({ Vary: "Accept-Encoding" });
    applyVersionHeaders(headers, deprecated);
    applyVersionHeaders(headers, deprecated);
    expect(headers.get("Vary")).toBe("Accept-Encoding, Stackra-Version");
    const star = new Headers({ Vary: "*" });
    applyVersionHeaders(star, deprecated);
    expect(star.get("Vary")).toBe("*");
  });
});
