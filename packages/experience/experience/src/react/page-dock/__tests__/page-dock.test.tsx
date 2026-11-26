/**
 * Stackra file contract:
 * Purpose: proves the PageDock is a named navigation linking each section by its id, marks the first section
 *          current with its status line before anything scrolls, reaches its links in order from the keyboard, and
 *          reads the same in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui `SectionDock`; jsdom has no IntersectionObserver, so the dock stays
 *           on its first section, and the locale comes from `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { PageDock } from "#react/page-dock/page-dock";

/** jsdom has no matchMedia; the provider reads the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const ITEMS = [
  { id: "write", label: "Write", status: "gen: 1 action" },
  { id: "expose", label: "Expose", status: "gen: 1 endpoint" },
];

describe("PageDock", () => {
  afterEach(cleanup);

  it("is a named navigation of the sections, the first current with its status", () => {
    render(<PageDock label="Stations" items={ITEMS} />);
    const dock = screen.getByRole("navigation", { name: "Stations" });
    const links = within(dock).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#write", "#expose"]);
    expect(links[0]?.getAttribute("aria-current")).toBe("location");
    // The status line is plain text (no live region: scrolling announces nothing; aria-current is the signal).
    expect(dock.querySelector('[data-slot="section-dock-status"]')?.textContent).toBe(
      "gen: 1 action",
    );
  });

  it("reaches the links in order from the keyboard", () => {
    render(<PageDock label="Stations" items={ITEMS} />);
    const [first, second] = screen.getAllByRole("link");
    first?.focus();
    expect(document.activeElement).toBe(first);
    expect(
      (first as HTMLElement).compareDocumentPosition(second as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("reads the same in Arabic", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <PageDock label="المحطات" items={[{ id: "write", label: "اكتب" }]} />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("link", { name: "اكتب" }).getAttribute("href")).toBe("#write");
  });
});
