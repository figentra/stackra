/**
 * Stackra file contract:
 * Purpose: proves the TimelineHero is a region named by its `h1` with the primary link, beside a window titled by
 *          the route's reference holding the origin and destination over an ordered list named by the route's label,
 *          one item per event in order with its time, status and actor, the last alone marked current; that the
 *          drawing is decorative unless it has `alt` and is left out when absent; and that it keeps its order in
 *          Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is a stand-in, and the locale comes from
 *           `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0504; WCAG 2.2 1.3.1 and 1.4.1; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { TimelineHero } from "#react/timeline-hero/timeline-hero";
import type { TimelineHeroProps } from "#react/timeline-hero/timeline-hero.props";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const ART = { src: "/art/parcel", width: 505, height: 588 };

const PROPS: TimelineHeroProps = {
  title: "Every carrier. One status.",
  lede: "Follow each parcel to the door.",
  primary: { label: "Start free", href: "/start" },
  route: {
    label: "Parcel from Riyadh to Jeddah",
    origin: "Riyadh",
    destination: "Jeddah",
    reference: "7000001234",
    events: [
      { time: "Mon 09:12", status: "Collected", actor: "SMSA Express, Riyadh" },
      { time: "Tue 11:31", status: "Attempt 1 failed", actor: "Nobody answered" },
      { time: "Wed 10:02", status: "Delivered" },
    ],
  },
  art: ART,
};

describe("TimelineHero", () => {
  afterEach(cleanup);

  it("is a region named by its h1, with the primary link", () => {
    render(<TimelineHero {...PROPS} />);
    const region = screen.getByRole("region", { name: PROPS.title });
    expect(within(region).getByRole("heading", { level: 1 }).textContent).toBe(PROPS.title);
    expect(screen.getByRole("link", { name: "Start free" }).getAttribute("href")).toBe("/start");
  });

  it("lists the events in order under the route's label, the last alone current", () => {
    render(<TimelineHero {...PROPS} />);
    expect(screen.getByText("7000001234")).toBeTruthy();
    // the origin and destination are one line, the arrow between them an unspoken icon
    expect(screen.getByText("RiyadhJeddah")).toBeTruthy();
    const list = screen.getByRole("list", { name: PROPS.route.label });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Mon 09:12CollectedSMSA Express, Riyadh",
      "Tue 11:31Attempt 1 failedNobody answered",
      "Wed 10:02Delivered",
    ]);
    expect(items.map((item) => item.getAttribute("aria-current"))).toEqual([null, null, "step"]);
  });

  it("draws the art decorative without alt, named with it, and nothing without art", () => {
    const { container, rerender } = render(<TimelineHero {...PROPS} />);
    expect(container.querySelector('[data-slot="hero-art"]')).toBeTruthy();
    expect(screen.queryByRole("img", { name: "A parcel" })).toBeNull();
    rerender(<TimelineHero {...PROPS} art={{ ...ART, alt: "A parcel" }} />);
    expect(screen.getByRole("img", { name: "A parcel" })).toBeTruthy();
    rerender(<TimelineHero {...PROPS} art={undefined} />);
    expect(container.querySelector('[data-slot="hero-art"]')).toBeNull();
  });

  it("keeps the events' order in Arabic", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <TimelineHero {...PROPS} />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    const items = within(screen.getByRole("list", { name: PROPS.route.label })).getAllByRole(
      "listitem",
    );
    expect(items[0]?.textContent).toContain("Collected");
  });
});
