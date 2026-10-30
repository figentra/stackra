/**
 * Stackra file contract:
 * Purpose: proves the web QuantityStepper: a group named by its label that counts up and down by `step` within its
 *          bounds, announces the count, turns the minus into a remove button at the minimum when `onRemove` is given,
 *          takes custom button names, follows a controlled value and refuses input while disabled.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { QuantityStepper } from "#react/quantity-stepper/quantity-stepper";

const press = (element: HTMLElement) => act(() => element.click());
const button = (name: string) => screen.getByRole("button", { name });
const isOff = (element: HTMLElement) =>
  element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";

describe("QuantityStepper (web)", () => {
  it("counts up and down within its bounds and announces the count", () => {
    const onChange = vi.fn();
    render(<QuantityStepper label="Cups" defaultValue={1} maxValue={2} onChange={onChange} />);
    const output = screen
      .getByRole("group", { name: "Cups" })
      .querySelector("output") as HTMLElement;
    expect(output.getAttribute("aria-live")).toBe("polite");
    press(button("Increase"));
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(output.textContent).toBe("2");
    expect(isOff(button("Increase"))).toBe(true);
    press(button("Decrease"));
    press(button("Decrease"));
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(isOff(button("Decrease"))).toBe(true);
  });

  it("turns the minus into remove at the minimum when onRemove is given", () => {
    const onRemove = vi.fn();
    const { rerender } = render(<QuantityStepper label="Cups" onRemove={onRemove} />);
    press(button("Remove"));
    expect(onRemove).toHaveBeenCalledOnce();
    rerender(
      <QuantityStepper label="Cups" onRemove={onRemove} removeLabel="Drop the line" size="lg" />,
    );
    expect(button("Drop the line")).toBeTruthy();
  });

  it("steps by step with no maximum and takes custom names", () => {
    const onChange = vi.fn();
    render(
      <QuantityStepper
        label="Cups"
        value={4}
        step={2}
        minValue={2}
        onChange={onChange}
        incrementLabel="More"
        decrementLabel="Less"
      />,
    );
    press(button("More"));
    expect(onChange).toHaveBeenLastCalledWith(6);
    press(button("Less"));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("refuses input while disabled", () => {
    const onChange = vi.fn();
    render(<QuantityStepper label="Cups" defaultValue={3} isDisabled onChange={onChange} />);
    expect(isOff(button("Increase"))).toBe(true);
    expect(isOff(button("Decrease"))).toBe(true);
  });
});
