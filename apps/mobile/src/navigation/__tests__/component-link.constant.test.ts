/**
 * Stackra file contract:
 * Purpose: proves the `Component` deep link keeps the one new path, the previous release's path as an alias, and reads
 *          `?tab=` as a `DocTab` only.
 * Boundary: the path config alone; no navigator or native module loads.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2; ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { COMPONENT_LINK } from "../component-link.constant";

describe("COMPONENT_LINK", () => {
  it("maps the one path and keeps the old per-screen path as an alias", () => {
    expect(COMPONENT_LINK.path).toBe("c/:tier/:slug");
    expect(COMPONENT_LINK.alias).toContain("design-system/:tier/:slug");
  });

  it("reads a known tab and drops an unknown one", () => {
    expect(COMPONENT_LINK.parse?.tab?.("api")).toBe("api");
    expect(COMPONENT_LINK.parse?.tab?.("nope")).toBeUndefined();
  });
});
