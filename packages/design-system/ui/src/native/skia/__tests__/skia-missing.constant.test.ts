/**
 * Stackra file contract:
 * Purpose: unit tests of `SKIA_MISSING` and `loadSkia` (STA-1791): any name destructures from the stand-in, its
 *          components draw nothing and its functions return nothing at any depth, it is no thenable and no React element
 *          type, and `loadSkia` loads once.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0302 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { loadSkia } from "#native/skia/load-skia.function";
import { SKIA_MISSING } from "#native/skia/skia-missing.constant";

describe("SKIA_MISSING", () => {
  const skia = SKIA_MISSING as Record<string, (...args: unknown[]) => unknown> & {
    Skia: { Path: { Make: () => unknown } };
  };

  it("lets a module destructure any name and draws nothing", () => {
    const { Canvas, Path, vec } = skia;
    expect(typeof Canvas).toBe("function");
    expect(Canvas?.({ children: null })).toBeNull();
    expect(Path?.({})).toBeNull();
    expect(vec?.(1, 2)).toBeNull();
    expect(skia.Skia.Path.Make()).toBeNull();
  });

  it("claims to be no thenable and no React element type", () => {
    expect(skia["then"]).toBeUndefined();
    expect(skia["$$typeof"]).toBeUndefined();
    expect(skia["prototype"]).toBeUndefined();
  });
});

describe("loadSkia", () => {
  it("loads once and keeps what it loaded", () => {
    expect(loadSkia()).toBe(loadSkia());
  });
});
