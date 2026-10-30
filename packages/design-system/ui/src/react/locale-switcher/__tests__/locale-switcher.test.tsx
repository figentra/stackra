/**
 * Stackra file contract:
 * Purpose: proves the web LocaleSwitcher: a select named in English by default or by its label, each locale shown by
 *          its own name, and a pick reported as the locale tag.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and text are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import { LocaleSwitcher } from "#react/locale-switcher/locale-switcher";

const press = (element: HTMLElement) => act(() => element.click());

describe("LocaleSwitcher (web)", () => {
  it("lists each locale by its own name and reports the pick", () => {
    const onChange = vi.fn();
    render(<LocaleSwitcher locales={["en", "ar"]} value="en" onChange={onChange} />);
    press(screen.getByRole("button", { name: /Language/ }));
    press(within(screen.getByRole("listbox")).getByRole("option", { name: /العربية/ }));
    expect(onChange).toHaveBeenLastCalledWith("ar");
  });

  it("is named by its label and takes a class", () => {
    const { container } = render(
      <LocaleSwitcher locales={["en"]} value="en" label="Site language" className="x-locale" />,
    );
    expect(screen.getByRole("button", { name: /Site language/ })).toBeTruthy();
    expect(container.querySelector(".x-locale")).not.toBeNull();
  });
});
