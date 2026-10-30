/**
 * Stackra file contract:
 * Purpose: proves the native QuantityStepper steps within its bounds, refuses minus at the minimum, and turns minus into
 *          a remove button there when `onRemove` is given.
 * Boundary: React Native and Reanimated do not run in vitest, so View, Text, Animated and IconButton are replaced by
 *           plain DOM stand-ins.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); wave 3c mobile interactions.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { QuantityStepper } from "#native/quantity-stepper/quantity-stepper";

vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return { View: ({ children }: { children?: ReactNode }) => createElement("div", null, children) };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const chain = { duration: () => chain, reduceMotion: () => chain };
  return {
    default: {
      View: ({ children }: { children?: ReactNode }) => createElement("div", null, children),
    },
    ZoomIn: chain,
    ReduceMotion: { System: "system" },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: ({ children }: { children?: ReactNode }) => createElement("output", null, children),
  };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: { label: string; onPress?: () => void; isDisabled?: boolean }) =>
      createElement("button", {
        type: "button",
        "aria-label": props.label,
        disabled: props.isDisabled,
        onClick: props.onPress,
      }),
  };
});

const count = () => screen.getByRole("status").textContent;

describe("QuantityStepper (native)", () => {
  it("steps within its bounds", () => {
    const onChange = vi.fn();
    render(<QuantityStepper label="Qty" defaultValue={1} maxValue={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(count()).toBe("2");
    expect(screen.getByRole("button", { name: "Increase" })).toHaveProperty("disabled", true);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("refuses minus at the minimum without onRemove", () => {
    render(<QuantityStepper label="Qty" />);
    expect(screen.getByRole("button", { name: "Decrease" })).toHaveProperty("disabled", true);
  });

  it("removes at the minimum with onRemove", () => {
    const onRemove = vi.fn();
    render(<QuantityStepper label="Qty" minValue={1} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
