/**
 * Stackra file contract:
 * Purpose: proves the native PasswordField masks the input and reveals it with a toggle whose name swaps, hides the
 *          toggle on request, takes digits only up to the length on the number pad in PIN mode (Arabic digits read as
 *          Latin), shakes with an error haptic each time `isInvalid` turns true and plays a success haptic when
 *          `isAccepted` turns true.
 * Boundary: React Native does not render in vitest, so heroui-native, Reanimated, the IconButton, the Icon, the shake and
 *           the haptics are replaced by recording stand-ins; what reaches them is checked.
 * Runtime: node
 * Governing contract: gap inventory row 3; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { PasswordField } from "#native/password-field/password-field";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  shake: vi.fn(),
  play: vi.fn(),
}));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const wrap = (props: { children?: ReactNode }) => h("div", null, props.children);
  return {
    TextField: wrap,
    Label: wrap,
    Description: wrap,
    FieldError: wrap,
    InputGroup: Object.assign(wrap, {
      Suffix: wrap,
      Input: (props: Record<string, unknown>) => {
        state.props["input"] = props;
        return h("input", {
          "data-testid": "input",
          value: props["value"] as string,
          onChange: (event: { target: { value: string } }) =>
            (props["onChangeText"] as (text: string) => void)(event.target.value),
        });
      },
    }),
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement: h } = await import("react");
  const builder: Record<string, () => unknown> = {};
  for (const name of ["duration", "withInitialValues", "reduceMotion"])
    builder[name] = () => builder;
  return {
    default: { View: (props: { children?: ReactNode }) => h("div", null, props.children) },
    ZoomIn: builder,
    ReduceMotion: { System: "system" },
  };
});
vi.mock("#native/shake/use-shake", () => ({ useShake: () => ({ style: {}, shake: state.shake }) }));
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: state.play } }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement: h } = await import("react");
  return {
    IconButton: (props: { readonly label: string; readonly onPress?: () => void }) =>
      h("button", { "aria-label": props.label, onClick: props.onPress }),
  };
});

const WORDS = { revealLabel: "Show", concealLabel: "Hide" } as const;
const input = () => state.props["input"] ?? {};

describe("PasswordField (native)", () => {
  beforeEach(() => {
    state.props = {};
    state.shake.mockClear();
    state.play.mockClear();
  });

  it("masks the input and reveals it with a toggle whose name swaps", () => {
    render(<PasswordField label="Password" {...WORDS} />);
    expect(input()["secureTextEntry"]).toBe(true);
    expect(input()["accessibilityLabel"]).toBe("Password");
    act(() => screen.getByRole("button", { name: "Show" }).click());
    expect(input()["secureTextEntry"]).toBe(false);
    act(() => screen.getByRole("button", { name: "Hide" }).click());
    expect(input()["secureTextEntry"]).toBe(true);
  });

  it("hides the toggle on request", () => {
    render(<PasswordField label="Password" isRevealable={false} {...WORDS} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("takes digits only up to the length on the number pad in PIN mode", () => {
    const onChange = vi.fn();
    render(<PasswordField label="PIN" mode="pin" pinLength={4} onChange={onChange} {...WORDS} />);
    expect(input()["keyboardType"]).toBe("number-pad");
    expect(input()["maxLength"]).toBe(4);
    fireEvent.change(screen.getByTestId("input"), { target: { value: "١٢a٣٤٥" } });
    expect(onChange).toHaveBeenLastCalledWith("1234");
  });

  it("shakes with an error haptic each time isInvalid turns true, and plays success on isAccepted", () => {
    const { rerender } = render(<PasswordField label="PIN" mode="pin" {...WORDS} />);
    rerender(<PasswordField label="PIN" mode="pin" isInvalid {...WORDS} />);
    expect(state.shake).toHaveBeenCalledTimes(1);
    expect(state.play).toHaveBeenLastCalledWith("error");
    rerender(<PasswordField label="PIN" mode="pin" isInvalid {...WORDS} />);
    expect(state.shake).toHaveBeenCalledTimes(1);
    rerender(<PasswordField label="PIN" mode="pin" isInvalid={false} {...WORDS} />);
    rerender(<PasswordField label="PIN" mode="pin" isInvalid {...WORDS} />);
    expect(state.shake).toHaveBeenCalledTimes(2);
    rerender(<PasswordField label="PIN" mode="pin" isAccepted {...WORDS} />);
    expect(state.play).toHaveBeenLastCalledWith("success");
  });
});
