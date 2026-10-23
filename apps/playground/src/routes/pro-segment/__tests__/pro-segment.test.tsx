/**
 * Stackra file contract:
 * Purpose: proves the Segment page sits at /pro-segment in the Pro group, titles the page and the document, draws the
 *          two named controls with their choices, and moves the selection, and the line that reports it, when a
 *          segment is pressed.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProSegment } from "#src/routes/pro-segment/pro-segment";
import { ProSegmentRoute } from "#src/routes/pro-segment/pro-segment.route";

describe("ProSegment", () => {
  beforeEach(() => {
    stubBrowserApis();
    // jsdom has no Web Animations; the selection indicator asks each element for its animations.
    Element.prototype.getAnimations = () => [];
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-segment in the Pro group, and titles the page and the document", () => {
    render(<ProSegment />);
    expect(ProSegmentRoute.path).toBe("/pro-segment");
    expect(ProSegmentRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProSegmentRoute.title })).toBeTruthy();
    expect(document.title).toBe("Segment · Stackra Playground");
  });

  it("draws two named controls with their choices", () => {
    render(<ProSegment />);
    expect(screen.getByRole("radiogroup", { name: "Dashboard views" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Chart range" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(screen.getByRole("radio", { name: "Dashboard", checked: true })).toBeTruthy();
  });

  it("moves the selection, and reports it, when a segment is pressed", () => {
    render(<ProSegment />);
    fireEvent.click(screen.getByRole("radio", { name: "Reports" }));
    expect(screen.getByRole("radio", { name: "Reports", checked: true })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Selected: Reports");
  });
});
