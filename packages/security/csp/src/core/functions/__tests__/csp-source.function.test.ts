/**
 * Stackra file contract:
 * Purpose: unit tests of `cspSource`: a URL with an authority becomes its scheme and host (port kept, path, query and
 *          trailing slash dropped, a custom scheme such as `app://` included); any other valid source is kept as
 *          written; an invalid source or an unparsable URL is refused with a TypeError naming it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237.
 */
import { describe, expect, it } from "@stackra/testing";

import { cspSource } from "#core/functions/csp-source.function";

describe("cspSource", () => {
  it.each([
    ["https://api.acme.example/v1", "https://api.acme.example"],
    ["https://api.acme.example/", "https://api.acme.example"],
    ["https://api.acme.example:8443/v1?x=1", "https://api.acme.example:8443"],
    ["wss://rt.acme.example/socket", "wss://rt.acme.example"],
    ["app://bundle/index.html", "app://bundle"],
  ])("reduces the URL %j to %j", (source, expected) => {
    expect(cspSource(source)).toBe(expected);
  });

  it.each([["https:"], ["data:"], ["cdn.acme.example"], ["*.acme.example"]])(
    "keeps %j as written",
    (source) => {
      expect(cspSource(source)).toBe(source);
    },
  );

  it.each([["'self'"], ["*"], ["a;b"], ["a b"], [""]])("refuses %j", (source) => {
    expect(() => cspSource(source)).toThrow(TypeError);
  });

  it("names the refused source", () => {
    expect(() => cspSource("'unsafe-inline'")).toThrow(/'unsafe-inline'/);
  });

  it("refuses a URL that does not parse", () => {
    expect(() => cspSource("https://[bad")).toThrow(/not a valid URL source/);
  });
});
