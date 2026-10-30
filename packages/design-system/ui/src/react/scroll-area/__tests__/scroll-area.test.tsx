/**
 * Stackra file contract:
 * Purpose: proves the web ScrollArea is a named, focusable region bounded by `maxSize`.
 * Boundary: jsdom with the real HeroUI ScrollShadow.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { ScrollArea } from "#react/scroll-area/scroll-area";

// jsdom has no ResizeObserver; ScrollShadow watches its size with one.
globalThis.ResizeObserver ??= class {
  observe() {}

  unobserve() {}

  disconnect() {}
} as unknown as typeof ResizeObserver;

describe("ScrollArea (web)", () => {
  it("is a named, focusable region bounded by maxSize", () => {
    render(
      <ScrollArea label="Terms" maxSize={240}>
        <p>Long terms</p>
      </ScrollArea>,
    );
    const region = screen.getByRole("region", { name: "Terms" });
    expect(region.tabIndex).toBe(0);
    expect(region.style.maxHeight).toBe("240px");
  });
});
