/**
 * Stackra file contract:
 * Purpose: proves `useGridErrorText()`: each kind of cell error reads as its catalogue words, the least and greatest
 *          limits are written with the locale's digits and grouping, and an app's own message is shown as given.
 * Boundary: the hook alone through `renderHook`, with the default English catalogue, in jsdom.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d); WCAG 2.2 SC 3.3.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";

import { useGridErrorText } from "#react/data-grid/use-grid-error-text";

describe("useGridErrorText (web)", () => {
  it("words each kind of error", () => {
    const { result } = renderHook(() => useGridErrorText("en-US"));
    const text = result.current;
    expect(text({ kind: "required" })).toBe("Required");
    expect(text({ kind: "type" })).toBe("Not a valid value");
    expect(text({ kind: "min", limit: 1500 })).toBe("At least 1,500");
    expect(text({ kind: "max", limit: 99.5 })).toBe("At most 99.5");
    expect(text({ kind: "custom", message: "SKU already used" })).toBe("SKU already used");
  });

  it("writes the limits with the locale's digits", () => {
    const { result } = renderHook(() => useGridErrorText("ar-EG"));
    expect(result.current({ kind: "min", limit: 12 })).toBe("At least ١٢");
    expect(result.current({ kind: "max", limit: 3 })).toBe("At most ٣");
  });
});
