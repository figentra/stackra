/**
 * Stackra file contract:
 * Purpose: proves the native ToggleButtonGroup keeps one button pressed in single mode, several in multiple mode,
 *          keeps the last one with `disallowEmptySelection`, reports the pressed ids, and that a lone ToggleButton
 *          toggles its own checked state.
 * Boundary: React Native does not run in vitest, so the Button and View are replaced by plain DOM stand-ins that
 *           expose `accessibilityState.checked` as `aria-pressed`.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); wave 3c mobile interactions.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ToggleButton } from "#native/toggle-button/toggle-button";
import { ToggleButtonGroup } from "#native/toggle-button-group/toggle-button-group";

vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return { View: ({ children }: { children?: ReactNode }) => createElement("div", null, children) };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: {
      children?: ReactNode;
      onPress?: () => void;
      accessibilityState?: { checked?: boolean };
    }) =>
      createElement(
        "button",
        {
          type: "button",
          "aria-pressed": props.accessibilityState?.checked === true,
          onClick: props.onPress,
        },
        props.children,
      ),
  };
});

const pressed = () =>
  screen
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.textContent);

describe("ToggleButtonGroup (native)", () => {
  it("keeps one pressed in single mode and reports it", () => {
    const onSelectionChange = vi.fn();
    render(
      <ToggleButtonGroup defaultSelectedKeys={["left"]} onSelectionChange={onSelectionChange}>
        <ToggleButton id="left">Left</ToggleButton>
        <ToggleButton id="right">Right</ToggleButton>
      </ToggleButtonGroup>,
    );
    fireEvent.click(screen.getByText("Right"));
    expect(pressed()).toEqual(["Right"]);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["right"]));
  });

  it("keeps several in multiple mode and the last one when empty is refused", () => {
    render(
      <ToggleButtonGroup selectionMode="multiple" disallowEmptySelection>
        <ToggleButton id="bold">Bold</ToggleButton>
        <ToggleButton id="italic">Italic</ToggleButton>
      </ToggleButtonGroup>,
    );
    fireEvent.click(screen.getByText("Bold"));
    fireEvent.click(screen.getByText("Italic"));
    expect(pressed()).toEqual(["Bold", "Italic"]);
    fireEvent.click(screen.getByText("Bold"));
    fireEvent.click(screen.getByText("Italic"));
    expect(pressed()).toEqual(["Italic"]);
  });

  it("lets a lone ToggleButton hold its own state", () => {
    const onChange = vi.fn();
    render(<ToggleButton onChange={onChange}>Mute</ToggleButton>);
    fireEvent.click(screen.getByText("Mute"));
    expect(pressed()).toEqual(["Mute"]);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
