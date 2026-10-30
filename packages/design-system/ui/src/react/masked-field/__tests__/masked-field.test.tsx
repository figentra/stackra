/**
 * Stackra file contract:
 * Purpose: proves the web MaskedField writes typed digits into its pattern, reports the raw value, reads Arabic-Indic
 *          digits, submits the raw value under its name, and opens the numeric keyboard for a digits-only pattern.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { MaskedField } from "#react/masked-field/masked-field";

describe("MaskedField (web)", () => {
  it("writes the value into the pattern and reports the raw characters", () => {
    const onChange = vi.fn();
    const { container } = render(
      <MaskedField label="Mobile" mask="999 999 9999" name="mobile" onChange={onChange} />,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Mobile" });
    fireEvent.change(input, { target: { value: "٠٥٠١٢٣٤٥٦٧" } });
    expect(onChange).toHaveBeenLastCalledWith("0501234567");
    expect(input.value).toBe("050 123 4567");
    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(container.querySelector<HTMLInputElement>("input[name=mobile]")?.value).toBe(
      "0501234567",
    );
  });

  it("upper-cases letter slots of a controlled IBAN", () => {
    render(
      <MaskedField label="IBAN" mask="AA99 9999 9999" value="sa0380" onChange={() => undefined} />,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "IBAN" });
    expect(input.value).toBe("SA03 80");
    expect(input.getAttribute("inputmode")).toBe("text");
  });
});
