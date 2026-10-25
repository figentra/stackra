/**
 * Stackra file contract:
 * Purpose: unit tests of `panels`: frozen panel refs, and the refusals of a bad key, a relative path and an unknown area.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0164 (decision 3); ADR 0082.
 */
import { ApiArea } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { panels } from "#core/functions/panels.function";

describe("panels", () => {
  it("returns frozen panel refs", () => {
    const Panels = panels({
      Admin: { key: "admin", path: "/", area: ApiArea.Admin },
      CustomerPortal: { key: "customer_portal", path: "/portal", area: ApiArea.App },
    } as const);
    expect(Panels.CustomerPortal).toEqual({ key: "customer_portal", path: "/portal", area: "app" });
    expect(Object.isFrozen(Panels.Admin)).toBe(true);
  });

  it("refuses a bad key, path or area", () => {
    expect(() => panels({ A: { key: "Admin", path: "/", area: ApiArea.Admin } })).toThrow(
      RangeError,
    );
    expect(() => panels({ A: { key: "a", path: "portal", area: ApiArea.Admin } })).toThrow(
      RangeError,
    );
    expect(() => panels({ A: { key: "a", path: "/", area: "nowhere" as ApiArea } })).toThrow(
      RangeError,
    );
  });
});
