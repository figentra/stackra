/**
 * Stackra file contract:
 * Purpose: proves the web NumberPad types from its keys and from the physical keyboard (digits, comma as the decimal
 *          point, Backspace), keeps its keypad left to right, and completes a PIN at its length.
 * Boundary: renders the real component in jsdom.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); wave 3c mobile interactions.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { NumberPad } from "#react/number-pad/number-pad";

describe("NumberPad (web)", () => {
  it("types from the keys and the keyboard", () => {
    const onChange = vi.fn();
    render(<NumberPad label="Amount" hasDecimal onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    const pad = screen.getByRole("group", { name: "Amount" });
    fireEvent.keyDown(pad, { key: "," });
    fireEvent.keyDown(pad, { key: "5" });
    fireEvent.keyDown(pad, { key: "Backspace" });
    expect(onChange.mock.calls.map(([value]) => value)).toEqual(["4", "4.", "4.5", "4."]);
  });

  it("keeps the keypad left to right and completes a PIN", () => {
    const onComplete = vi.fn();
    render(<NumberPad label="PIN" isPin maxLength={3} onComplete={onComplete} />);
    expect(screen.getByRole("button", { name: "1" }).parentElement?.getAttribute("dir")).toBe(
      "ltr",
    );
    for (const digit of ["7", "2", "9", "1"]) {
      fireEvent.click(screen.getByRole("button", { name: digit }));
    }
    expect(onComplete).toHaveBeenCalledWith("729");
  });
});
