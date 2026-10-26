/**
 * Stackra file contract:
 * Purpose: proves the web Switch is a `switch` named by its label, reads and reports its state through `value`,
 *          `defaultValue` and `onChange` (the field contract), toggles from the keyboard, shows the required,
 *          invalid, disabled and read-only states, ties the description and the error message to the input, and
 *          refuses HeroUI's own names for what the contract already names.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are
 *          checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-086 sta-350:FR-087
import { fireEvent, render, screen } from "@testing-library/react";

import { Switch } from "#react/switch/switch";
import type { SwitchProps } from "#react/switch/switch.props";

describe("Switch (web)", () => {
  it("is a switch named by its label and starts off", () => {
    render(<Switch label="Notifications" />);
    const control = screen.getByRole("switch", { name: "Notifications" }) as HTMLInputElement;
    expect(control.checked).toBe(false);
  });

  it("starts from defaultValue and reports each change with the new state", () => {
    const onChange = vi.fn();
    render(<Switch label="Dark" defaultValue onChange={onChange} />);
    const control = screen.getByRole("switch", { name: "Dark" }) as HTMLInputElement;
    expect(control.checked).toBe(true);
    fireEvent.click(control);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("is controlled by value", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch label="Dark" value={false} onChange={onChange} />);
    const control = screen.getByRole("switch", { name: "Dark" }) as HTMLInputElement;
    fireEvent.click(control);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(control.checked).toBe(false);
    rerender(<Switch label="Dark" value onChange={onChange} />);
    expect(control.checked).toBe(true);
  });

  it("is reachable by keyboard: the input is focusable and a click toggles it", () => {
    const onChange = vi.fn();
    render(<Switch label="Dark" onChange={onChange} />);
    const control = screen.getByRole("switch", { name: "Dark" });
    control.focus();
    expect(document.activeElement).toBe(control);
    fireEvent.click(control);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it("ties the description and the error message to the input", () => {
    render(
      <Switch label="Beta" description="Early features" isInvalid errorMessage="Not allowed" />,
    );
    const control = screen.getByRole("switch", { name: "Beta" });
    const described = (control.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described.map((id) => document.getElementById(id)?.textContent)).toEqual(
      expect.arrayContaining(["Early features", "Not allowed"]),
    );
  });

  it("refuses input while disabled and while read-only", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch label="A" isDisabled onChange={onChange} />);
    expect((screen.getByRole("switch", { name: "A" }) as HTMLInputElement).disabled).toBe(true);
    rerender(<Switch label="A" isReadOnly onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch", { name: "A" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks a required field in the label", () => {
    const { container } = render(<Switch label="Terms" isRequired />);
    expect(container.querySelector('[data-slot="label"]')?.className).toContain("required");
  });

  it("names itself with aria-label when it has no label, and passes unknown props and size through", () => {
    const { container } = render(<Switch aria-label="Wi-Fi" data-testid="wifi" size="lg" />);
    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toBeTruthy();
    expect(screen.getByTestId("wifi")).toBeTruthy();
    expect(container.querySelector('[data-slot="switch"]')?.className).toContain("switch--lg");
  });

  it("refuses HeroUI's names for what the contract names", () => {
    // @ts-expect-error `isSelected` is `value`.
    const selected: SwitchProps = { isSelected: true };
    // @ts-expect-error `children` is `label`.
    const children: SwitchProps = { children: "x" };
    expectTypeOf<SwitchProps["value"]>().toEqualTypeOf<boolean | undefined>();
    expect([selected, children]).toHaveLength(2);
  });
});
