/**
 * Stackra file contract:
 * Purpose: proves the web SignatureField names its drawing box by its label, reports a typed name and null for an empty
 *          one, reports a drawn path after a stroke, clears to null, and refuses drawing while disabled.
 * Boundary: jsdom; the box has no size there, so a stroke's points are at the origin.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { SignatureField } from "#react/signature-field/signature-field";

const props = { label: "Signature", clearLabel: "Clear", typedLabel: "Or type your full name" };

describe("SignatureField (web)", () => {
  it("names the drawing box and reports a typed name", () => {
    const onChange = vi.fn();
    render(<SignatureField {...props} onChange={onChange} />);
    expect(screen.getByRole("img", { name: "Signature" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Or type your full name" }), {
      target: { value: "Sara Ali" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ kind: "typed", text: "Sara Ali" });
    fireEvent.change(screen.getByRole("textbox", { name: "Or type your full name" }), {
      target: { value: "  " },
    });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("reports a drawn path after a stroke, and clears", () => {
    const onChange = vi.fn();
    render(<SignatureField {...props} onChange={onChange} width={200} height={100} />);
    const box = screen.getByRole("img", { name: "Signature" });
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(box, { clientX: 5, clientY: 5, pointerId: 1 });
    fireEvent.pointerUp(box, { pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "drawn",
      path: "M0 0L0 0",
      viewBox: "0 0 200 100",
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("refuses drawing while disabled", () => {
    const onChange = vi.fn();
    render(<SignatureField {...props} onChange={onChange} isDisabled />);
    const box = screen.getByRole("img", { name: "Signature" });
    fireEvent.pointerDown(box, { pointerId: 1 });
    fireEvent.pointerUp(box, { pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
  });
});
