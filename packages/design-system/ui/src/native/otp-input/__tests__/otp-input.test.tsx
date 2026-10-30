/**
 * Stackra file contract:
 * Purpose: proves the native OtpInput: HeroUI Native's InputOTP with one slot per digit, kept left to right, named by
 *          a text label (or the catalogue) with the one-time-code autofill; typing and pasting keep only the digits,
 *          a change is reported and kept when uncontrolled, completion plays a success haptic; read-only locks it;
 *          the error shows only when invalid.
 * Boundary: React Native and heroui-native do not render in vitest, so they and the house Text and haptics are
 *           recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060; WCAG
 *          2.2 SC 1.3.5; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { OtpInput } from "#native/otp-input/otp-input";

const state = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  slots: [] as number[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    InputOTP: Object.assign(
      (props: Record<string, unknown>) => {
        state.props = props;
        return createElement("div", null, props["children"] as ReactNode);
      },
      {
        Group: (props: Record<string, unknown>) =>
          createElement("div", null, props["children"] as ReactNode),
        Slot: (props: { index: number }) => {
          state.slots.push(props.index);
          return null;
        },
      },
    ),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const call = (name: string, text: string) =>
  act(() => (state.props[name] as (t: string) => unknown)(text));

beforeEach(() => {
  state.props = {};
  state.slots.length = 0;
  state.played.length = 0;
});

describe("OtpInput (native)", () => {
  it("draws six slots named by the label with the one-time-code autofill", () => {
    render(<OtpInput label="Code" description="Sent by SMS" />);
    expect(state.slots).toEqual([0, 1, 2, 3, 4, 5]);
    expect(state.props).toMatchObject({
      maxLength: 6,
      value: "",
      inputMode: "numeric",
      isDisabled: false,
      isInvalid: false,
      textInputProps: {
        accessibilityLabel: "Code",
        textContentType: "oneTimeCode",
        autoComplete: "sms-otp",
      },
    });
    expect(screen.getByText("Code")).toBeTruthy();
    expect(screen.getByText("Sent by SMS")).toBeTruthy();
  });

  it("keeps only the digits of a change or paste and reports completion with a haptic", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<OtpInput length={4} onChange={onChange} onComplete={onComplete} />);
    expect(
      (state.props["textInputProps"] as { accessibilityLabel: string }).accessibilityLabel,
    ).toBe("ui::otp_input.label");
    expect((state.props["pasteTransformer"] as (t: string) => string)("12-34-56")).toBe("1234");
    call("onChange", "1a2");
    expect(onChange).toHaveBeenCalledWith("12");
    expect(state.props["value"]).toBe("12");
    call("onComplete", "9876");
    expect(onComplete).toHaveBeenCalledWith("9876");
    expect(state.played).toEqual(["success"]);
  });

  it("shows the owner's code and keeps it, locked while read-only, with the error when invalid", () => {
    const onChange = vi.fn();
    render(
      <OtpInput
        value="11"
        onChange={onChange}
        isReadOnly
        isInvalid
        errorMessage="Wrong"
        label={<b>R</b>}
      />,
    );
    expect(state.props).toMatchObject({ value: "11", isDisabled: true, isInvalid: true });
    call("onChange", "112");
    expect(onChange).toHaveBeenCalledWith("112");
    expect(state.props["value"]).toBe("11");
    expect(screen.getByText("Wrong")).toBeTruthy();
    call("onComplete", "1");
  });

  it("starts from defaultValue and hides the error while valid", () => {
    render(<OtpInput defaultValue="42" errorMessage="Wrong" isDisabled />);
    expect(state.props).toMatchObject({ value: "42", isDisabled: true });
    expect(screen.queryByText("Wrong")).toBeNull();
  });
});
