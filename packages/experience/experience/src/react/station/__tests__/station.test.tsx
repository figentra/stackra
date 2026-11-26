/**
 * Stackra file contract:
 * Purpose: proves the Station is a blueprint region with the dock's anchor id, named by its `h3`, with its line,
 *          its window and its status; that the rail and the junction are hidden decoration on blueprint roles on the
 *          inline start, so Arabic mirrors them; that only the window's own controls take focus; and that nothing in
 *          it waits on motion.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is a stand-in, and the locale and the
 *           motion level come from `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Station } from "#react/station/station";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const STATION = (
  <Station
    id="expose"
    title="Expose"
    body="Gen writes the route; nobody hand-writes it."
    status="gen: 1 endpoint"
  >
    <button type="button">PUT /orders/:orderId/cancel</button>
  </Station>
);

describe("Station", () => {
  afterEach(cleanup);

  it("is a region with the dock's anchor, named by its h3, with its line, window and status", () => {
    const { container } = render(STATION);
    const region = screen.getByRole("region", { name: "Expose" });
    expect(region.id).toBe("expose");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Expose");
    expect(screen.getByText("Gen writes the route; nobody hand-writes it.")).toBeTruthy();
    expect(container.querySelector('[data-slot="station"]')?.getAttribute("data-status")).toBe(
      "gen: 1 endpoint",
    );
  });

  it("lets only the window's own controls take focus", () => {
    const { container } = render(STATION);
    const button = screen.getByRole("button", { name: "PUT /orders/:orderId/cancel" });
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(container.querySelectorAll("a, button, [tabindex]")).toHaveLength(1);
  });

  it("draws the rail and the junction as hidden decoration on the inline start, in Arabic too", () => {
    const { container } = render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        {STATION}
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    const rail = container.querySelector('[data-slot="station-rail"]');
    const junction = container.querySelector('[data-slot="station-junction"]');
    expect(rail?.getAttribute("aria-hidden")).toBe("true");
    expect(junction?.getAttribute("aria-hidden")).toBe("true");
    expect(rail?.className).toContain("start-4");
    expect(rail?.className).toContain("bg-[var(--blueprint-pipe)]");
    expect(junction?.className).toContain("size-[var(--blueprint-junction-size)]");
    expect(junction?.className).toContain("rtl:translate-x-1/2");
  });

  it("draws everything at once below the full motion level", () => {
    render(
      <DesignSystemProvider motion="none" hasShortcutCheatSheet={false}>
        {STATION}
      </DesignSystemProvider>,
    );
    expect(screen.getByRole("heading", { name: "Expose" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "PUT /orders/:orderId/cancel" })).toBeTruthy();
  });
});
