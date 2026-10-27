/**
 * Stackra file contract:
 * Purpose: proves the status-badge page titles the document, shows one badge per tone in each size with its state text, a table of records with a status column, no live region, and a live badge that moves to the next state.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-036 sta-350:P-030
import { Enum, Tone } from "@stackra/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";
import { Size } from "@stackra/ui/contracts";

import { StatusBadge } from "#src/routes/status-badge/status-badge";
import { StatusBadgeRoute } from "#src/routes/status-badge/status-badge.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <StatusBadge />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("StatusBadge page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /status-badge under Status", () => {
    renderPage();
    expect(routePath(StatusBadgeRoute)).toBe("/status-badge");
    expect(StatusBadgeRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: "Status badge" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Status badge · Stackra Playground");
  });

  it("shows one badge per tone in each size", () => {
    renderPage();
    const tones = section("Tones and sizes");
    expect(
      document.querySelectorAll('#status-badge-tones ~ div [data-slot="status-badge-dot"]'),
    ).toHaveLength(Enum.values(Tone).length * Size.length);
    for (const state of ["Draft", "Scheduled", "Active", "Pending", "Failed"]) {
      expect(tones.getAllByText(state)).toHaveLength(Size.length);
    }
  });

  it("shows the records with their status in a table", () => {
    renderPage();
    const table = section("In a table").getByRole("table", { name: "Orders" });
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(within(table).getByRole("row", { name: /Order 1042/ }).textContent).toContain("Failed");
  });

  it("is never a live region", () => {
    renderPage();
    expect(document.querySelector('[role="status"], [aria-live]')).toBeNull();
  });

  it("moves the live badge to the next state", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Draft")).toBeTruthy();
    act(() => live.getByRole("button", { name: "Next state" }).click());
    expect(live.getByText("Scheduled")).toBeTruthy();
    expect(live.queryByText("Draft")).toBeNull();
  });
});
