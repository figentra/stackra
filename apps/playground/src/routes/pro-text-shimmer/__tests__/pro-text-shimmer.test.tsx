/**
 * Stackra file contract:
 * Purpose: proves the TextShimmer page sits at /pro-text-shimmer in the Pro category, titles the page and the document, and draws each label as real text.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProTextShimmer } from "#src/routes/pro-text-shimmer/pro-text-shimmer";
import { ProTextShimmerRoute } from "#src/routes/pro-text-shimmer/pro-text-shimmer.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProTextShimmer", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-text-shimmer in the Pro category, and titles the page and the document", () => {
    render(<ProTextShimmer />);
    expect(routePath(ProTextShimmerRoute)).toBe("/pro-text-shimmer");
    expect(ProTextShimmerRoute.category).toBe("AI");
    expect(screen.getByRole("heading", { level: 1, name: ProTextShimmerRoute.title })).toBeTruthy();
    expect(document.title).toBe("TextShimmer · Stackra Playground");
  });

  it("draws each label as text", () => {
    render(<ProTextShimmer />);
    for (const label of ["Thinking...", "Generating response...", "Searching the documents..."])
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Labels", "Muted"]);
  });
});
