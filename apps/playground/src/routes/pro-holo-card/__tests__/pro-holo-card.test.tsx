/**
 * Stackra file contract:
 * Purpose: proves the HoloCard page sits at /pro-holo-card in the Pro category, titles the page and the document, draws
 *          two cards that carry the holder's name as text, and gives only the interactive one a glare layer.
 * Boundary: jsdom with real HeroUI Pro; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither. The
 *          tilt follows the pointer on a laid-out card, so it is checked in the browser.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProHoloCard } from "#src/routes/pro-holo-card/pro-holo-card";
import { ProHoloCardRoute } from "#src/routes/pro-holo-card/pro-holo-card.route";

describe("ProHoloCard", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-holo-card in the Pro category, and titles the page and the document", () => {
    render(<ProHoloCard />);
    expect(ProHoloCardRoute.path).toBe("/pro-holo-card");
    expect(ProHoloCardRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: ProHoloCardRoute.title })).toBeTruthy();
    expect(document.title).toBe("HoloCard · Stackra Playground");
  });

  it("draws two cards that carry the holder's name as text", () => {
    render(<ProHoloCard />);
    expect(screen.getAllByText("Marcus Wong")).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="holo-card-surface"]')).toHaveLength(2);
  });

  it("gives only the interactive card a glare layer", () => {
    render(<ProHoloCard />);
    expect(document.querySelectorAll('[data-slot="holo-card-shine"]')).toHaveLength(1);
  });
});
