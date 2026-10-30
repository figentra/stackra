/**
 * Stackra file contract:
 * Purpose: proves the native NumberPad types digits, offers the decimal key only when asked, deletes, and in PIN mode
 *          stops at the code's length and reports it complete.
 * Boundary: React Native and the haptics do not run in vitest, so View, Text, Icon and PressFeedback are replaced by
 *           plain DOM stand-ins; the keys are found by their accessible names.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); wave 3c mobile interactions.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { NumberPad } from "#native/number-pad/number-pad";

vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return { View: ({ children }: { children?: ReactNode }) => createElement("div", null, children) };
});
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: ({ children }: { children?: ReactNode }) => createElement("span", null, children),
  };
});
vi.mock("#native/press-feedback/press-feedback", async () => {
  const { createElement } = await import("react");
  return {
    PressFeedback: (props: { label?: string; onPress?: () => void }) =>
      createElement("button", {
        type: "button",
        "aria-label": props.label,
        onClick: props.onPress,
      }),
  };
});

const press = (...names: string[]) => {
  for (const name of names) fireEvent.click(screen.getByRole("button", { name }));
};

describe("NumberPad (native)", () => {
  it("types an amount with one decimal point and deletes", () => {
    const onChange = vi.fn();
    render(<NumberPad label="Amount" hasDecimal onChange={onChange} />);
    press("1", "Decimal point", "5", "Decimal point", "Delete");
    expect(onChange).toHaveBeenLastCalledWith("1.");
  });

  it("has no decimal key unless asked", () => {
    render(<NumberPad label="Quantity" />);
    expect(screen.queryByRole("button", { name: "Decimal point" })).toBeNull();
  });

  it("stops a PIN at its length and reports it complete", () => {
    const onComplete = vi.fn();
    const onChange = vi.fn();
    render(<NumberPad label="PIN" isPin onChange={onChange} onComplete={onComplete} />);
    press("1", "2", "3", "4", "5");
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith("1234");
    expect(onChange).toHaveBeenCalledTimes(4);
  });
});
