/**
 * Stackra file contract:
 * Purpose: proves the native ReactionButton: a toggle button named by its emoji (or label) and compact count in the
 *          locale; a press plays a selection haptic, flips it and reports the new state, and uncontrolled it moves the
 *          shown count with the toggle (counting the user's own reaction when `defaultSelected`); controlled, it shows
 *          the owner's count and state; disabled, it refuses.
 * Boundary: React Native does not render in vitest, so it and the house Text are recording stand-ins that render plain
 *           DOM; the catalogue is a stand-in that echoes its key and values.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { ReactionButton } from "#native/reaction-button/reaction-button";
import type { ReactionButtonProps } from "#native/reaction-button/reaction-button.props";

const state = vi.hoisted(() => ({
  button: {} as Record<string, unknown>,
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    Pressable: (props: Record<string, unknown>) => {
      state.button = props;
      return createElement(
        "button",
        {
          type: "button",
          onClick: props["disabled"] ? undefined : (props["onPress"] as () => void),
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("@stackra/i18n/react", () => ({ useNumerals: () => "latn" }));
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const draw = (props: Partial<ReactionButtonProps> = {}) =>
  render(
    <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
      <ReactionButton emoji="👍" count={4} {...props} />
    </DesignSystemContext>,
  );
const press = () => fireEvent.click(screen.getByRole("button"));

beforeEach(() => {
  state.button = {};
  state.played.length = 0;
});

describe("ReactionButton (native)", () => {
  it("is a toggle named by its emoji and count", () => {
    draw({ className: "r" });
    expect(state.button).toMatchObject({
      accessibilityRole: "togglebutton",
      accessibilityLabel: 'ui::reaction_button.label {"emoji":"👍","count":"4"}',
      accessibilityState: { checked: false, disabled: false },
    });
    expect(String(state.button["className"])).toContain("border-border");
    expect(String(state.button["className"])).toContain(" r");
  });

  it("flips on press with a haptic, reports it and moves its own count", () => {
    const onChange = vi.fn();
    draw({ onChange });
    press();
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(state.played).toEqual(["selection"]);
    expect(screen.getByText("5")).toBeTruthy();
    expect(String(state.button["className"])).toContain("bg-accent-soft");
    press();
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("counts the user's own reaction when it starts selected and writes large counts compactly", () => {
    draw({ count: 1500, defaultSelected: true, label: "Like" });
    expect(screen.getByText("1.5K")).toBeTruthy();
    expect(String(state.button["accessibilityLabel"])).toContain('"emoji":"Like"');
    press();
    expect(screen.getByText("1.5K")).toBeTruthy();
    expect(state.button["accessibilityState"]).toEqual({ checked: false, disabled: false });
  });

  it("shows the owner's count and state when controlled", () => {
    const onChange = vi.fn();
    draw({ isSelected: true, count: 7, onChange });
    press();
    expect(onChange).toHaveBeenCalledWith(false);
    expect(screen.getByText("7")).toBeTruthy();
    expect(state.button["accessibilityState"]).toEqual({ checked: true, disabled: false });
  });

  it("refuses while disabled", () => {
    const onChange = vi.fn();
    draw({ isDisabled: true, onChange });
    press();
    expect(onChange).not.toHaveBeenCalled();
    expect(state.button).toMatchObject({ disabled: true, accessibilityState: { disabled: true } });
    expect(String(state.button["className"])).toContain("opacity-50");
  });
});
