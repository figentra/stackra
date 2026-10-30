/**
 * Stackra file contract:
 * Purpose: proves the native ToggleButton is one `togglebutton` whose checked state comes from `isSelected`, its own
 *          state (`defaultSelected`) or, inside a ToggleButtonGroup, the group's set; a press flips it and reports the
 *          new state, the group's size and disabled state reach it, and an icon-only button is square.
 * Boundary: the house Button is a recording stand-in that renders a plain DOM button; what it is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ToggleButton } from "#native/toggle-button/toggle-button";
import { ToggleButtonGroupContext } from "#native/toggle-button-group/toggle-button-group-context";

const state = vi.hoisted(() => ({ button: {} as Record<string, unknown> }));

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      state.button = props;
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
}));

describe("ToggleButton (native)", () => {
  it("is an unpressed togglebutton that flips itself and reports each change", () => {
    const onChange = vi.fn();
    render(<ToggleButton onChange={onChange}>Bold</ToggleButton>);
    expect(state.button).toMatchObject({
      accessibilityRole: "togglebutton",
      accessibilityState: { checked: false },
      variant: "tertiary",
      isDisabled: false,
    });
    expect(state.button).not.toHaveProperty("className");
    expect(state.button).not.toHaveProperty("size");
    fireEvent.click(screen.getByText("Bold"));
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(state.button).toMatchObject({
      accessibilityState: { checked: true },
      variant: "secondary",
    });
  });

  it("is controlled by isSelected and keeps a ghost variant when unpressed", () => {
    const onChange = vi.fn();
    render(
      <ToggleButton isSelected={false} variant="ghost" isIconOnly size="sm" onChange={onChange}>
        B
      </ToggleButton>,
    );
    expect(state.button).toMatchObject({
      variant: "ghost",
      size: "sm",
      className: "aspect-square px-0",
    });
    fireEvent.click(screen.getByText("B"));
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it("starts pressed from defaultSelected", () => {
    render(<ToggleButton defaultSelected>B</ToggleButton>);
    expect(state.button["accessibilityState"]).toEqual({ checked: true });
  });

  it("reads and toggles the group's set, taking its size and disabled state", () => {
    const toggle = vi.fn();
    const onChange = vi.fn();
    render(
      <ToggleButtonGroupContext
        value={{ selected: new Set(["b"]), toggle, size: "lg", isDisabled: true }}
      >
        <ToggleButton id="b" onChange={onChange}>
          B
        </ToggleButton>
      </ToggleButtonGroupContext>,
    );
    expect(state.button).toMatchObject({
      accessibilityState: { checked: true },
      size: "lg",
      isDisabled: true,
    });
    fireEvent.click(screen.getByText("B"));
    expect(toggle).toHaveBeenCalledWith("b");
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});
