/**
 * Stackra file contract:
 * Purpose: proves the web AddressField and CountrySelect: a fieldset named by its legend with the address parts and
 *          their autocomplete tokens, each edit reported as the whole address, the country picked from a searchable
 *          list (limited by `countries`, preferred first), required line and city, a controlled value, and the
 *          disabled and read-only states.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { AddressField } from "#react/address-field/address-field";
import { CountrySelect } from "#react/country-select/country-select";

const press = (element: HTMLElement) => act(() => element.click());
const box = (name: RegExp) => screen.getByRole("textbox", { name }) as HTMLInputElement;

describe("AddressField (web)", () => {
  it("is a group named by its legend with autocomplete tokens and reports each edit", () => {
    const onChange = vi.fn();
    render(
      <AddressField
        label="Shipping"
        description="Where we deliver"
        onChange={onChange}
        isRequired
      />,
    );
    expect(screen.getByRole("group", { name: "Shipping" })).toBeTruthy();
    expect(screen.getByText("Where we deliver")).toBeTruthy();
    expect(box(/^Address/).getAttribute("autocomplete")).toBe("address-line1");
    expect(box(/Postal code/).getAttribute("autocomplete")).toBe("postal-code");
    expect(box(/^City/).required || box(/^City/).getAttribute("aria-required") === "true").toBe(
      true,
    );
    fireEvent.change(box(/^City/), { target: { value: "Riyadh" } });
    expect(onChange).toHaveBeenLastCalledWith({ line1: "", city: "Riyadh", country: "SA" });
    fireEvent.change(box(/Region/), { target: { value: "Central" } });
    expect(onChange).toHaveBeenLastCalledWith({
      line1: "",
      city: "Riyadh",
      region: "Central",
      country: "SA",
    });
  });

  it("picks the country from the list it is limited to", () => {
    const onChange = vi.fn();
    render(<AddressField countries={["AE", "SA", "EG"]} defaultCountry="AE" onChange={onChange} />);
    const country = screen.getByRole("combobox") as HTMLInputElement;
    expect(country.value).toContain("United Arab Emirates");
    act(() => country.focus());
    fireEvent.change(country, { target: { value: "Egy" } });
    press(screen.getByRole("option", { name: /Egypt/ }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ country: "EG" }));
  });

  it("follows a controlled value and refuses input while disabled or read-only", () => {
    const value = { line1: "1 King Rd", city: "Jeddah", country: "SA" };
    const onChange = vi.fn();
    const { rerender } = render(<AddressField value={value} onChange={onChange} isDisabled />);
    expect(box(/^Address/).value).toBe("1 King Rd");
    expect(box(/^Address/).disabled).toBe(true);
    rerender(<AddressField value={value} onChange={onChange} isReadOnly />);
    expect(box(/^City/).readOnly).toBe(true);
  });
});

describe("CountrySelect (web)", () => {
  it("is named in English by default and lists the preferred countries first", () => {
    render(<CountrySelect countries={["EG", "SA", "AE"]} preferred={["SA"]} />);
    const input = screen.getByRole("combobox", { name: /Country/ });
    act(() => input.focus());
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const keys = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.getAttribute("data-key"));
    expect(keys).toEqual(["SA", "EG", "AE"]);
  });
});
