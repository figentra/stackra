/**
 * Stackra file contract:
 * Purpose: unit tests of `frameAncestors`: `'none'` by default and on every unmatched path, a static list printed
 *          exactly, an exact key before the longest `/*` prefix, a `"request"` path taking the resolver's framers and
 *          falling back to `'none'` when nothing resolved, and refusal of resolved framers on a static path and of a
 *          wildcard from either source.
 * Boundary: test only; builds the configuration through @stackra/config's `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0334 rule 12.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { CspConfig } from "#config/csp.config";
import { frameAncestors } from "#core/functions/frame-ancestors.function";

/** Pay's checkout surface: the console previews it, merchants embed checkout sessions. */
const checkout = buildConfig(CspConfig, {
  values: {
    frameAncestors: {
      "/preview": ["https://console.pay.example", "self"],
      "/c/*": "request",
      "/c/static/*": ["https://docs.pay.example"],
    },
  },
});

describe("frameAncestors", () => {
  it("is 'none' by default, with or without a path", () => {
    expect(frameAncestors(buildConfig(CspConfig))).toEqual(["'none'"]);
    expect(frameAncestors(buildConfig(CspConfig), { path: "/preview" })).toEqual(["'none'"]);
    expect(frameAncestors(checkout)).toEqual(["'none'"]);
  });

  it("is 'none' on a path no key matches", () => {
    for (const path of ["/", "/preview/", "/previewx", "/c", "/constructor", "/__proto__"]) {
      expect(frameAncestors(checkout, { path })).toEqual(["'none'"]);
    }
  });

  it("prints a static list exactly", () => {
    expect(frameAncestors(checkout, { path: "/preview" })).toEqual([
      "https://console.pay.example",
      "'self'",
    ]);
  });

  it("takes the longest prefix", () => {
    expect(frameAncestors(checkout, { path: "/c/static/x.html" })).toEqual([
      "https://docs.pay.example",
    ]);
  });

  it("takes a resolver's framers on a request path, once each", () => {
    expect(
      frameAncestors(checkout, {
        path: "/c/cs_01",
        frameAncestors: ["https://shop.example", "https://shop.example", "http://localhost:3000"],
      }),
    ).toEqual(["https://shop.example", "http://localhost:3000"]);
  });

  it("falls back to 'none' when nothing resolved (an unknown session)", () => {
    expect(frameAncestors(checkout, { path: "/c/cs_unknown" })).toEqual(["'none'"]);
    expect(frameAncestors(checkout, { path: "/c/cs_unknown", frameAncestors: [] })).toEqual([
      "'none'",
    ]);
  });

  it("refuses resolved framers on a path that takes none", () => {
    expect(() =>
      frameAncestors(checkout, { path: "/preview", frameAncestors: ["https://shop.example"] }),
    ).toThrow(TypeError);
    expect(() => frameAncestors(checkout, { frameAncestors: ["https://shop.example"] })).toThrow(
      TypeError,
    );
  });

  it.each([
    ["*"],
    ["https://*"],
    ["https://*.shop.example"],
    ["https:"],
    ["shop.example"],
    ["https://shop.example/c"],
    ["https://shop.example/"],
    ["https://shop.example:443"],
    ["http://shop.example"],
    ["https://user@shop.example"],
    ["javascript:alert(1)"],
    ["'self'"],
    ["https://shop.example https://evil.example"],
    ["https://shop.example;script-src *"],
  ])("refuses the resolved framer %j", (framer) => {
    expect(() => frameAncestors(checkout, { path: "/c/cs_01", frameAncestors: [framer] })).toThrow(
      TypeError,
    );
  });

  it("refuses a wildcard in configuration at boot", () => {
    expect(() =>
      buildConfig(CspConfig, {
        values: { frameAncestors: { "/c/*": ["https://*.shop.example"] } },
      }),
    ).toThrow();
    expect(() =>
      buildConfig(CspConfig, { values: { frameAncestors: { "/c/*": ["*"] } } }),
    ).toThrow();
    expect(() =>
      buildConfig(CspConfig, { values: { frameAncestors: { "/c*": ["https://shop.example"] } } }),
    ).toThrow();
  });
});
