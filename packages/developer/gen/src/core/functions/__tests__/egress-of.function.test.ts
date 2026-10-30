/**
 * Stackra file contract:
 * Purpose: unit tests of `egressOf`: a fixed https origin with no fields, a `{field}` host kept as data with its
 *          field, and every base URL the managed client refuses answered undefined.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 19); STA-768.
 */
import { describe, expect, it } from "@stackra/testing";

import { egressOf } from "#core/functions/egress-of.function";

describe(egressOf, () => {
  it("allows a fixed https origin", () => {
    expect(egressOf("https://API.Stripe.com/v1")).toEqual({
      origin: "https://api.stripe.com",
      fields: [],
    });
    expect(egressOf("https://api.example.com:8443")).toEqual({
      origin: "https://api.example.com:8443",
      fields: [],
    });
  });

  it("keeps a {field} host as data, with the fields it is filled from", () => {
    expect(egressOf("https://{region}.api.example.com/v2")).toEqual({
      origin: "https://{region}.api.example.com",
      fields: ["region"],
    });
    expect(egressOf("https://{host}")).toEqual({ origin: "https://{host}", fields: ["host"] });
    expect(egressOf("https://{dataCenter}.API.example.com")).toEqual({
      origin: "https://{dataCenter}.api.example.com",
      fields: ["dataCenter"],
    });
  });

  it("accepts a whole-URL placeholder", () => {
    expect(egressOf("{baseUrl}")).toEqual({ origin: "{baseUrl}", fields: ["baseUrl"] });
  });

  it("refuses what the managed client would refuse", () => {
    for (const bad of [
      "http://api.example.com",
      "https://api.example.com/{tenant}/v1",
      "https://{Region}.example.com",
      "https://{}.example.com",
      "https://user:pass@api.example.com",
      "https://api.example.com/v1?key=1",
      "https://api.example.com#x",
      "ftp://api.example.com",
      "{base_url}",
      "{a}{b}",
      "http://x",
    ])
      expect(egressOf(bad)).toBeUndefined();
  });
});
