/**
 * Stackra file contract:
 * Purpose: proves the RadioButtonGroup page sits at /pro-radio-button-group in the Pro group, titles the page and the
 *          document, draws three named groups of three cards, reports the choice in the controlled one, and disables the
 *          last.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProRadioButtonGroup } from "#src/routes/pro-radio-button-group/pro-radio-button-group";
import { ProRadioButtonGroupRoute } from "#src/routes/pro-radio-button-group/pro-radio-button-group.route";

describe("ProRadioButtonGroup", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-radio-button-group in the Pro group, and titles the page and the document", () => {
    render(<ProRadioButtonGroup />);
    expect(ProRadioButtonGroupRoute.path).toBe("/pro-radio-button-group");
    expect(ProRadioButtonGroupRoute.category).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProRadioButtonGroupRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("RadioButtonGroup · Stackra Playground");
  });

  it("draws three named groups of three cards, and disables the last", () => {
    render(<ProRadioButtonGroup />);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(3);
    expect(screen.getAllByRole("radio")).toHaveLength(9);
    const disabled = screen.getByRole("radiogroup", { name: "Locked plan" });
    expect(disabled.querySelectorAll("input:disabled")).toHaveLength(3);
  });

  it("reports the choice in the controlled group", () => {
    render(<ProRadioButtonGroup />);
    expect(screen.getByRole("status").textContent).toBe("Plan: Pro.");
    fireEvent.click(screen.getByRole("radio", { name: /Enterprise/ }));
    expect(screen.getByRole("status").textContent).toBe("Plan: Enterprise.");
  });
});
