/**
 * Stackra file contract:
 * Purpose: proves the web RadioButtonGroup and CheckboxButtonGroup draw real radios and checkboxes named by their cards and report the picked keys.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { CheckboxButtonGroup } from "#react/checkbox-button-group/checkbox-button-group";
import { RadioButtonGroup } from "#react/radio-button-group/radio-button-group";

const ITEMS = [
  { id: "pickup", label: "Pickup", description: "Ready in 20 minutes" },
  { id: "delivery", label: "Delivery" },
  { id: "dine", label: "Dine in", isDisabled: true },
];

describe("card choice groups (web)", () => {
  it("picks one radio card", () => {
    const onChange = vi.fn();
    render(<RadioButtonGroup label="Order type" items={ITEMS} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /Delivery/ }));
    expect(onChange).toHaveBeenCalledWith("delivery");
    expect((screen.getByRole("radio", { name: /Dine in/ }) as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("picks several checkbox cards", () => {
    const onChange = vi.fn();
    render(
      <CheckboxButtonGroup
        label="Extras"
        items={ITEMS}
        defaultValue={["pickup"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /Delivery/ }));
    expect(onChange).toHaveBeenCalledWith(["pickup", "delivery"]);
  });
});
