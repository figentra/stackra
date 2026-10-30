/**
 * Stackra file contract:
 * Purpose: proves the web NativeSelect ties its label to the browser select, reports the key and marks the invalid state.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { NativeSelect } from "#react/native-select/native-select";

describe("NativeSelect (web)", () => {
  it("reports the chosen key", () => {
    const onChange = vi.fn();
    render(
      <NativeSelect
        label="Branch"
        items={[
          { id: "ruh", label: "Riyadh" },
          { id: "jed", label: "Jeddah" },
        ]}
        isInvalid
        errorMessage="Pick a branch"
        onChange={onChange}
      />,
    );
    const select = screen.getByRole("combobox", { name: "Branch" });
    expect(select.getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(select, { target: { value: "jed" } });
    expect(onChange).toHaveBeenCalledWith("jed");
  });
});
