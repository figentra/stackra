/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveHost`: a relative name lands under the zone, a name already in the zone and an
 *          absolute name (trailing `.`) stay as they are, and a relative name with no zone or a result that is not a
 *          lower-case DNS name of two labels or more resolves to `undefined`.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); owner decision D9 (host pattern).
 */
import { describe, expect, it } from "@stackra/testing";

import { resolveHost } from "#core/functions/resolve-host.function";

describe("resolveHost", () => {
  it("places a relative name under the zone", () => {
    expect(resolveHost("console.mezzora", "figentra.com")).toBe("console.mezzora.figentra.com");
  });

  it("keeps a name already in the zone, and the zone itself", () => {
    expect(resolveHost("console.figentra.com", "figentra.com")).toBe("console.figentra.com");
    expect(resolveHost("figentra.com", "figentra.com")).toBe("figentra.com");
  });

  it("strips the trailing dot of an absolute name, with or without a zone", () => {
    expect(resolveHost("mezzora.com.", undefined)).toBe("mezzora.com");
    expect(resolveHost("mezzora.com.", "figentra.com")).toBe("mezzora.com");
  });

  it("returns undefined for a relative name with no zone", () => {
    expect(resolveHost("console.mezzora", undefined)).toBeUndefined();
  });

  it("returns undefined when the result is not a lower-case DNS name of two labels", () => {
    expect(resolveHost("Console", "figentra.com")).toBeUndefined();
    expect(resolveHost("localhost.", undefined)).toBeUndefined();
    expect(resolveHost("bad_name", "figentra.com")).toBeUndefined();
  });
});
