/**
 * Stackra file contract:
 * Purpose: proves the web PasswordField masks the secret and reveals it with a toggle whose name swaps, hides the toggle
 *          on request, shows the caps-lock hint in a status region only while Caps Lock is on, takes digits only (Arabic
 *          ones read as Latin) up to the length in PIN mode with the numeric keypad, marks the field invalid, and
 *          refuses `type` and `suffix`.
 * Boundary: jsdom with real HeroUI, React Aria and motion; looks are not checked.
 * Runtime: browser
 * Governing contract: gap inventory row 3; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

import type { PasswordFieldContractProps } from "#contracts/types/password-field-contract-props.type";
import { PasswordField } from "#react/password-field/password-field";
import type { PasswordFieldProps } from "#react/password-field/password-field.props";

const LABELS = { revealLabel: "Show", concealLabel: "Hide", capsLockMessage: "Caps on" } as const;
const input = (name = "Password") => screen.getByLabelText(name) as HTMLInputElement;

describe("PasswordField (web)", () => {
  it("masks the secret and reveals it with a toggle whose name swaps", () => {
    render(<PasswordField label="Password" defaultValue="s3cret" {...LABELS} />);
    expect(input().type).toBe("password");
    act(() => screen.getByRole("button", { name: "Show" }).click());
    expect(input().type).toBe("text");
    expect(input().value).toBe("s3cret");
    act(() => screen.getByRole("button", { name: "Hide" }).click());
    expect(input().type).toBe("password");
  });

  it("hides the toggle on request", () => {
    render(<PasswordField label="Password" isRevealable={false} {...LABELS} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the caps-lock hint in a status region only while Caps Lock is on", () => {
    render(<PasswordField label="Password" {...LABELS} />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    fireEvent.keyDown(input(), { key: "A", modifierCapsLock: true });
    fireEvent.keyUp(input(), { key: "A", modifierCapsLock: true });
    expect(status.textContent).toBe("Caps on");
    fireEvent.keyUp(input(), { key: "a", modifierCapsLock: false });
    expect(status.textContent).toBe("");
  });

  it("takes digits only up to the length in PIN mode, Arabic ones included", () => {
    const onChange = vi.fn();
    render(<PasswordField label="PIN" mode="pin" pinLength={4} onChange={onChange} {...LABELS} />);
    const pin = input("PIN");
    expect(pin.inputMode).toBe("numeric");
    expect(pin.maxLength).toBe(4);
    fireEvent.change(pin, { target: { value: "1a2" } });
    expect(onChange).toHaveBeenLastCalledWith("12");
    fireEvent.change(pin, { target: { value: "١٢٣٤٥" } });
    expect(onChange).toHaveBeenLastCalledWith("1234");
    expect(pin.value).toBe("1234");
  });

  it("marks the field invalid and shows the error", () => {
    render(<PasswordField label="PIN" mode="pin" isInvalid errorMessage="Wrong PIN" {...LABELS} />);
    expect(input("PIN").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Wrong PIN")).toBeTruthy();
  });

  it("matches the shared contract and refuses type and suffix", () => {
    expectTypeOf<PasswordFieldProps>().toExtend<PasswordFieldContractProps>();
    // @ts-expect-error the field decides the input's type
    createElement(PasswordField, { type: "text" });
    // @ts-expect-error the field draws its own suffix
    createElement(PasswordField, { suffix: "x" });
  });
});
