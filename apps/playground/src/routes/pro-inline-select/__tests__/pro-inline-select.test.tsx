/**
 * Stackra file contract:
 * Purpose: proves the InlineSelect page sits at /pro-inline-select in the Pro group, titles the page and the document,
 *          draws two named selects with their values, reports the item chosen in the controlled one, and disables the
 *          other.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProInlineSelect } from "#src/routes/pro-inline-select/pro-inline-select";
import { ProInlineSelectRoute } from "#src/routes/pro-inline-select/pro-inline-select.route";

describe("ProInlineSelect", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-inline-select in the Pro group, and titles the page and the document", () => {
    render(<ProInlineSelect />);
    expect(ProInlineSelectRoute.path).toBe("/pro-inline-select");
    expect(ProInlineSelectRoute.category).toBe("Selection");
    expect(
      screen.getByRole("heading", { level: 1, name: ProInlineSelectRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("InlineSelect · Stackra Playground");
  });

  it("draws two named selects with their values, and disables the second", () => {
    render(<ProInlineSelect />);
    expect(screen.getByRole("button", { name: /Period/ }).textContent).toContain("the last 7 days");
    expect(screen.getByRole("button", { name: /Sort order/ }).textContent).toContain(
      "the last 30 days",
    );
    expect((screen.getByRole("button", { name: /Sort order/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("reports the item chosen in the controlled select", () => {
    render(<ProInlineSelect />);
    expect(screen.getByRole("status").textContent).toBe("Period: the last 7 days.");
  });
});
