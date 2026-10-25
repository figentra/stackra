/**
 * Stackra file contract:
 * Purpose: unit tests of `otlpHeaders`: `k=v` pairs, lowercased names, percent-decoded values, skipped malformed pairs
 *          and nothing for an unset secret.
 * Boundary: test only; the header values are made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { otlpHeaders } from "#core/functions/otlp-headers.function";

describe("otlpHeaders", () => {
  it("parses the exporter's header form", () => {
    expect(otlpHeaders("Authorization=Bearer%20token-a, x-team = ops")).toEqual({
      authorization: "Bearer token-a",
      "x-team": "ops",
    });
  });

  it("skips malformed pairs and an unset secret", () => {
    expect(otlpHeaders("novalue,=empty,ok=1")).toEqual({ ok: "1" });
    expect(otlpHeaders(undefined)).toEqual({});
  });

  it("keeps a value that is not valid percent-encoding", () => {
    expect(otlpHeaders("k=100%")).toEqual({ k: "100%" });
  });
});
