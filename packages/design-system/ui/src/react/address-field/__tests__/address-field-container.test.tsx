/**
 * Stackra file contract:
 * Purpose: proves the web AddressField lays out by its own width: the fieldset is a size container, the grid's two
 *          columns and the lines' span are container variants (never the viewport's `sm:`), and the legend names the
 *          group; and that a typed part reaches `onChange` in the whole address.
 * Boundary: jsdom with real HeroUI; nothing is laid out, so the columns themselves are checked in the playground.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (AddressField container query).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { AddressField } from "#react/address-field/address-field";

describe("AddressField (web)", () => {
  it("answers to its own width, not the screen's", () => {
    const { container } = render(<AddressField label="Delivery address" className="max-w-sm" />);
    const fieldset = screen.getByRole("group", { name: "Delivery address" });
    expect(fieldset.className).toContain("@container");
    expect(fieldset.className).toContain("max-w-sm");
    const grid = container.querySelector('[data-slot="address-field-grid"]');
    expect(grid?.className).toContain("@md:grid-cols-2");
    expect(container.innerHTML).not.toMatch(/\bsm:/u);
    expect(container.querySelectorAll('[class*="@md:col-span-2"]')).toHaveLength(2);
  });

  it("reports the whole address when a part is typed", () => {
    const onChange = vi.fn();
    render(<AddressField label="Delivery address" onChange={onChange} />);
    const city = screen
      .getAllByRole("textbox")
      .find((box) => box.getAttribute("autocomplete") === "address-level2");
    fireEvent.change(city as HTMLElement, { target: { value: "Riyadh" } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: "Riyadh", country: "SA" }),
    );
  });
});
