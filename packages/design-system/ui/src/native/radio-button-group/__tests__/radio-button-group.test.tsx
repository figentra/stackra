/**
 * Stackra file contract:
 * Purpose: proves the native RadioButtonGroup and CheckboxButtonGroup hand each card its radio or checkbox role, its
 *          checked state, and report the picked keys; a refused card ignores presses.
 * Boundary: React Native and the house children do not run in vitest, so they are replaced by recording stand-ins
 *           that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { CheckboxButtonGroup } from "#native/checkbox-button-group/checkbox-button-group";
import { RadioButtonGroup } from "#native/radio-button-group/radio-button-group";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) =>
    createElement(
      "div",
      {
        role: props["accessibilityRole"],
        "aria-label": props["accessibilityLabel"],
        "aria-checked": (props["accessibilityState"] as { checked?: boolean } | undefined)?.checked,
        onClick: props["disabled"] ? undefined : (props["onPress"] as () => void),
      },
      props["children"] as never,
    );
  return { View: box, Pressable: box };
});
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => createElement("span", {}, props["children"] as never),
  };
});

const ITEMS = [
  { id: "pickup", label: "Pickup" },
  { id: "delivery", label: "Delivery" },
  { id: "dine", label: "Dine in", isDisabled: true },
];

describe("card choice groups (native)", () => {
  it("picks one radio card and refuses a disabled one", () => {
    const onChange = vi.fn();
    render(
      <RadioButtonGroup
        label="Order type"
        items={ITEMS}
        defaultValue="pickup"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("radio", { name: "Pickup" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Delivery" }));
    expect(onChange).toHaveBeenCalledWith("delivery");
    fireEvent.click(screen.getByRole("radio", { name: "Dine in" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("toggles checkbox cards", () => {
    const onChange = vi.fn();
    render(<CheckboxButtonGroup items={ITEMS} defaultValue={["pickup"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Pickup" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
