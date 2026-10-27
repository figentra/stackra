/**
 * Stackra file contract:
 * Purpose: unit tests of `importMapResolves`: exact keys, `/`-ending prefix keys, and the specifiers a browser import
 *          map never sees (relative, absolute, `#`, virtual and scheme) never resolved.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { importMapResolves } from "#core/functions/import-map-resolves.function";

const MAP = { imports: { react: "/s/react.js", "react/": "/s/react/", "@stackra/ui": "/s/ui.js" } };

describe("importMapResolves", () => {
  it("resolves an exact key and a path under a prefix key", () => {
    expect(importMapResolves(MAP, "react")).toBe(true);
    expect(importMapResolves(MAP, "react/jsx-runtime")).toBe(true);
    expect(importMapResolves(MAP, "@stackra/ui")).toBe(true);
  });

  it("leaves an unmapped path of a mapped package unresolved", () => {
    expect(importMapResolves(MAP, "@stackra/ui/native")).toBe(false);
    expect(importMapResolves(MAP, "react-dom")).toBe(false);
  });

  it("never resolves what a browser import map does not see", () => {
    for (const specifier of ["./a", "/a", "#stackra/i18n", "\0virtual", "node:fs", "virtual:x"])
      expect(importMapResolves({ imports: { [specifier]: "/x.js" } }, specifier)).toBe(false);
  });
});
