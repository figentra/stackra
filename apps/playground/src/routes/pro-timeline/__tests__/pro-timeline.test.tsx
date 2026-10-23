/**
 * Stackra file contract:
 * Purpose: proves the Timeline page sits at /pro-timeline in the Pro group, titles the page and the document, draws
 *          a named ordered list of five events with their titles, says each state in words, and marks only the
 *          current event as current.
 * Boundary: jsdom with real HeroUI Pro; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProTimeline } from "#src/routes/pro-timeline/pro-timeline";
import { ProTimelineRoute } from "#src/routes/pro-timeline/pro-timeline.route";

describe("ProTimeline", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-timeline in the Pro group, and titles the page and the document", () => {
    render(<ProTimeline />);
    expect(ProTimelineRoute.path).toBe("/pro-timeline");
    expect(ProTimelineRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProTimelineRoute.title })).toBeTruthy();
    expect(document.title).toBe("Timeline · Stackra Playground");
  });

  it("draws a named list of five events with their titles", () => {
    render(<ProTimeline />);
    const list = screen.getByRole("list", { name: "Checkout redesign rollout" });
    expect(list.querySelectorAll(":scope > li")).toHaveLength(5);
    expect(screen.getByRole("heading", { level: 3, name: "Canary rollout started" })).toBeTruthy();
  });

  it("says each state in words, and marks only the current event as current", () => {
    render(<ProTimeline />);
    for (const state of ["Done", "In progress", "Paused", "Queued", "Ready"])
      expect(screen.getByText(state)).toBeTruthy();
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  });
});
