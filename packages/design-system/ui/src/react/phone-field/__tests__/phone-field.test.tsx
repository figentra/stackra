/**
 * Stackra file contract:
 * Purpose: proves the web PhoneField is one field whose country button shows only the flag and dial code, opens a
 *          searchable list that matches English and Arabic names, ISO codes and dial codes, and keeps the E.164 value
 *          in a hidden input; and that the country search itself matches as promised.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0022.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { phoneCountriesOf } from "#core/functions/phone-countries-of.function";
import { phoneCountryMatches } from "#core/functions/phone-country-matches.function";
import { PhoneField } from "#react/phone-field/phone-field";

describe("phoneCountryMatches", () => {
  const [sa] = phoneCountriesOf("en", ["SA"]);
  it.each(["saudi", "السعودية", "sa", "966", "+966", "٩٦٦"])(
    "finds Saudi Arabia by %s",
    (query) => {
      expect(sa && phoneCountryMatches(sa, query)).toBe(true);
    },
  );
  it("misses a country by another's name", () => {
    expect(sa && phoneCountryMatches(sa, "france")).toBe(false);
  });
});

describe("PhoneField (web)", () => {
  it("shows only the flag and dial code on the closed button and keeps E.164", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PhoneField label="Mobile" name="phone" defaultCountry="SA" onChange={onChange} />,
    );
    const country = screen.getByRole("button", { name: /Saudi Arabia/ });
    // The flag is drawn by CSS (axe label-content-name-mismatch), so the text is the dial code and the flag an attribute.
    expect(country.textContent).toBe("+966");
    expect(country.querySelector("[data-flag]")?.getAttribute("data-flag")).toBe("🇸🇦");
    fireEvent.change(screen.getByLabelText("Mobile"), { target: { value: "0501234567" } });
    expect(onChange).toHaveBeenLastCalledWith({
      country: "SA",
      national: "501234567",
      e164: "+966501234567",
    });
    const hidden = container.querySelector('input[type="hidden"][name="phone"]');
    expect(hidden?.getAttribute("value")).toBe("+966501234567");
  });

  it("searches the list and picks a country", async () => {
    const onChange = vi.fn();
    render(
      <PhoneField
        label="Mobile"
        defaultCountry="SA"
        countries={["SA", "AE", "EG", "FR"]}
        defaultValue={{ country: "SA", national: "501234567", e164: "+966501234567" }}
        onChange={onChange}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Saudi Arabia/ }));
    });
    const list = await screen.findByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(4);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "+20" } });
    const [egypt, ...others] = within(list).getAllByRole("option");
    expect(others).toHaveLength(0);
    expect(egypt?.textContent).toContain("Egypt");
    if (egypt) fireEvent.click(egypt);
    expect(onChange).toHaveBeenLastCalledWith({
      country: "EG",
      national: "501234567",
      e164: "+20501234567",
    });
    expect(screen.getByRole("button", { name: /Egypt/ }).textContent).toBe("+20");
  });
});
