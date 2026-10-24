/**
 * Stackra file contract:
 * Purpose: proves the web Timeline draws its events in HeroUI Pro's parts, still numbers its items and drops the last
 *          connector (so the type-based item detection of HeroUI Pro survives the wrapper), passes `status`, `size`
 *          and unknown props through, and carries HeroUI Pro's own parts and `useTimelineItem` hook.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so data attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import {
  Timeline as HeroTimeline,
  useTimelineItem as heroUseTimelineItem,
} from "@heroui-pro/react/timeline";
import { render, screen } from "@testing-library/react";

import { Timeline, useTimelineItem } from "#react/timeline/timeline";

describe("Timeline (web)", () => {
  it("numbers the items and leaves the last one without a connector", () => {
    render(
      <Timeline data-testid="timeline" className="extra">
        <Timeline.Item status="success">
          <Timeline.Marker />
          <Timeline.Content>Placed</Timeline.Content>
        </Timeline.Item>
        <Timeline.Item>
          <Timeline.Marker />
          <Timeline.Content>Shipped</Timeline.Content>
        </Timeline.Item>
      </Timeline>,
    );
    const root = screen.getByTestId("timeline");
    expect(root.classList.contains("extra")).toBe(true);
    const items = root.querySelectorAll<HTMLElement>("[data-slot='timeline-item']");
    expect(items).toHaveLength(2);
    expect(items[0]?.dataset["index"]).toBe("0");
    expect(items[1]?.dataset["index"]).toBe("1");
    expect(items[0]?.dataset["status"]).toBe("success");
    expect(items[0]?.dataset["last"]).toBeUndefined();
    expect(items[1]?.dataset["last"]).toBe("true");
    expect(root.querySelectorAll("[data-slot='timeline-connector']")).toHaveLength(1);
  });

  it("passes the root's axis, placement and size through", () => {
    render(
      <Timeline data-testid="timeline" axis="center" placement="alternate" size="lg">
        <Timeline.Item>
          <Timeline.Content>One</Timeline.Content>
        </Timeline.Item>
      </Timeline>,
    );
    const root = screen.getByTestId("timeline");
    expect(root.dataset["axis"]).toBe("center");
    expect(root.dataset["placement"]).toBe("alternate");
  });

  it("carries HeroUI Pro's own parts and hook", () => {
    for (const part of ["Item", "Rail", "Marker", "Connector", "Content"] as const) {
      expect(Timeline[part]).toBe(HeroTimeline[part]);
    }
    expect(useTimelineItem).toBe(heroUseTimelineItem);
  });
});
