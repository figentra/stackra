/**
 * Stackra file contract:
 * Purpose: proves the web OtpInput keeps Arabic-Indic digits as Latin digits and reports completion once every box is filled.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { OtpInput } from "#react/otp-input/otp-input";

describe("OtpInput (web)", () => {
  it("keeps Latin digits and completes", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<OtpInput label="Code" length={4} onChange={onChange} onComplete={onComplete} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Code" }), { target: { value: "١٢٣٤" } });
    expect(onChange).toHaveBeenLastCalledWith("1234");
    expect(onComplete).toHaveBeenCalledWith("1234");
  });
});
