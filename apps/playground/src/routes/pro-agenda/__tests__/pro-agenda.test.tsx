/**
 * Stackra file contract:
 * Purpose: proves the Agenda page sits at /pro-agenda in the Pro category, titles the page and the document, draws the
 *          calendar's navigation buttons and the week view's time grid, switches to the month view, and reports no
 *          events created.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither. Creating, moving and resizing events are pointer gestures on a laid-out grid, checked in the
 *          browser.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProAgenda } from "#src/routes/pro-agenda/pro-agenda";
import { ProAgendaRoute } from "#src/routes/pro-agenda/pro-agenda.route";

describe("ProAgenda", () => {
  beforeEach(() => {
    stubBrowserApis();
    Element.prototype.getAnimations = () => [];
    Element.prototype.scrollTo = () => {};
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-agenda in the Pro category, and titles the page and the document", () => {
    render(<ProAgenda />);
    expect(ProAgendaRoute.path).toBe("/pro-agenda");
    expect(ProAgendaRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProAgendaRoute.title })).toBeTruthy();
    expect(document.title).toBe("Agenda · Stackra Playground");
  });

  it("draws the navigation buttons and the time grid of the week view", () => {
    render(<ProAgenda />);
    expect(screen.getByRole("button", { name: /today/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /previous/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next/i })).toBeTruthy();
    expect(document.querySelector('[data-slot="agenda-time-grid"]')).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("0 events created");
  });

  it("switches to the month view", () => {
    render(<ProAgenda />);
    fireEvent.click(screen.getByRole("radio", { name: /month/i }));
    expect(document.querySelector('[data-slot="agenda-month-grid"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="agenda-time-grid"]')).toBeNull();
  });
});
