/**
 * Stackra file contract:
 * Purpose: proves the CheckboxButtonGroup page sits at /pro-checkbox-button-group in the Pro group, titles the page and
 *          the document, draws three named groups of cards, reports what is chosen in the controlled one, and disables
 *          the last.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProCheckboxButtonGroup } from "#src/routes/pro-checkbox-button-group/pro-checkbox-button-group";
import { ProCheckboxButtonGroupRoute } from "#src/routes/pro-checkbox-button-group/pro-checkbox-button-group.route";

describe("ProCheckboxButtonGroup", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-checkbox-button-group in the Pro group, and titles the page and the document", () => {
    render(<ProCheckboxButtonGroup />);
    expect(ProCheckboxButtonGroupRoute.path).toBe("/pro-checkbox-button-group");
    expect(ProCheckboxButtonGroupRoute.category).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProCheckboxButtonGroupRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("CheckboxButtonGroup · Stackra Playground");
  });

  it("draws three named groups of three cards, and disables the last", () => {
    render(<ProCheckboxButtonGroup />);
    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getAllByRole("checkbox")).toHaveLength(9);
    const disabled = screen.getByRole("group", { name: "Locked features" });
    expect(disabled.querySelectorAll("input:disabled")).toHaveLength(3);
  });

  it("reports what is chosen in the controlled group", () => {
    render(<ProCheckboxButtonGroup />);
    expect(screen.getByRole("status").textContent).toBe("Chosen: backups.");
    fireEvent.click(screen.getByRole("checkbox", { name: /Monitoring/ }));
    expect(screen.getByRole("status").textContent).toBe("Chosen: backups, monitoring.");
  });
});
