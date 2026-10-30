/**
 * Stackra file contract:
 * Purpose: proves the web SettingRow names its switch by the title and describes it by the description, reports a
 *          flip, opens its detail only while on, draws the caller's action in place of a switch, and refuses changes
 *          when disabled.
 * Boundary: jsdom with real HeroUI and Motion; the detail's opening is not timed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SettingRow } from "#react/setting-row/setting-row";

describe("SettingRow (web)", () => {
  it("names and describes its switch, reports a flip and opens the detail while on", async () => {
    const onChange = vi.fn();
    render(
      <SettingRow
        title="Print receipts"
        description="After every sale"
        onChange={onChange}
        detail={<p>Printer settings</p>}
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Print receipts" });
    expect(toggle.getAttribute("aria-describedby")).toContain("description");
    expect(screen.queryByText("Printer settings")).toBeNull();
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("Printer settings")).toBeTruthy();
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.queryByText("Printer settings")).toBeNull());
  });

  it("draws the action in place of a switch", () => {
    render(<SettingRow title="Taxes" action={<button type="button">Manage</button>} />);
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByRole("button", { name: "Manage" })).toBeTruthy();
  });

  it("disables its switch when disabled", () => {
    const onChange = vi.fn();
    render(<SettingRow title="Tips" defaultValue isDisabled onChange={onChange} />);
    const toggle = screen.getByRole("switch", { name: "Tips" });
    expect((toggle as HTMLInputElement).checked).toBe(true);
    expect((toggle as HTMLInputElement).disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});
