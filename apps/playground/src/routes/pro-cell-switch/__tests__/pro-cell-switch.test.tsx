/**
 * Stackra file contract:
 * Purpose: proves the CellSwitch page sits at /pro-cell-switch in the Pro group, titles the page and the document,
 *          draws named switches, reports the state of the controlled one, and disables the last two.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProCellSwitch } from "#src/routes/pro-cell-switch/pro-cell-switch";
import { ProCellSwitchRoute } from "#src/routes/pro-cell-switch/pro-cell-switch.route";

describe("ProCellSwitch", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-cell-switch in the Pro group, and titles the page and the document", () => {
    render(<ProCellSwitch />);
    expect(ProCellSwitchRoute.path).toBe("/pro-cell-switch");
    expect(ProCellSwitchRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProCellSwitchRoute.title })).toBeTruthy();
    expect(document.title).toBe("CellSwitch · Stackra Playground");
  });

  it("draws four switches, each named, and disables the last two", () => {
    render(<ProCellSwitch />);
    expect(screen.getAllByRole("switch")).toHaveLength(4);
    expect(screen.getByRole("switch", { name: "Sounds" })).toBeTruthy();
    expect((screen.getByRole("switch", { name: "Autoplay" }) as HTMLInputElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("switch", { name: "Haptics" }) as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("reports the state of the controlled switch", () => {
    render(<ProCellSwitch />);
    expect(screen.getByRole("status").textContent).toBe("Animations are on.");
    fireEvent.click(screen.getByRole("switch", { name: "Animations" }));
    expect(screen.getByRole("status").textContent).toBe("Animations are off.");
  });
});
