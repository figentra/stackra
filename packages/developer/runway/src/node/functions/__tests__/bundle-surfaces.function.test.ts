/**
 * Stackra file contract:
 * Purpose: unit tests of `bundleSurfaces`: the web surfaces that list packages, sorted; a surface without packages (a
 *          landing site, or an empty list) and `ops` ship no bundle; a root with no surfaces has none.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { parseRunway } from "#core/functions/parse-runway.function";
import { bundleSurfaces } from "#node/functions/bundle-surfaces.function";
import { PRODUCT_ROOT } from "#node/functions/__tests__/fixtures/product-root.fixture";

describe("bundleSurfaces", () => {
  it("lists the surfaces with packages, sorted, never ops", () => {
    const root = parseRunway("root", {
      ...PRODUCT_ROOT,
      surfaces: {
        till: { shell: "os/console@3", packages: ["@mezzora/till-ui"], host: "till.mezzora" },
        ...PRODUCT_ROOT.surfaces,
        kiosk: { shell: "os/console@3", packages: [], host: "kiosk.mezzora" },
      },
    });

    expect(bundleSurfaces(root)).toEqual(["console", "till"]);
  });

  it("returns none for a root without surfaces", () => {
    const root = parseRunway("root", { version: 3, project: "acme", environments: {} });

    expect(bundleSurfaces(root)).toEqual([]);
  });
});
