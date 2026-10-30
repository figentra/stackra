/**
 * Stackra file contract:
 * Purpose: proves the native SystemBanner draws its message on the Alert in the accent tone by default, slides in and
 *          out with the system's reduce-motion setting, names its dismiss button from the catalogue unless given, and
 *          on dismiss disappears and then reports it; with `isDismissible` off it has no button.
 * Boundary: React Native, Reanimated and the Alert and CloseButton do not run in vitest, so they are stand-ins.
 * Runtime: node
 * Governing contract: gap inventory row 27 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { SystemBanner } from "#native/system-banner/system-banner";

const state = vi.hoisted(() => ({
  alert: {} as Record<string, unknown>,
  animated: {} as Record<string, unknown>,
}));

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const builder: Record<string, () => unknown> = {};
  for (const name of ["duration", "withInitialValues", "reduceMotion"])
    builder[name] = () => builder;
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.animated = props;
        return createElement("div", null, props["children"] as never);
      },
    },
    FadeInDown: builder,
    FadeOutUp: builder,
    ReduceMotion: { System: "system" },
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as never),
  };
});

vi.mock("#native/alert/alert", async () => {
  const { createElement } = await import("react");
  return {
    Alert: (props: Record<string, unknown>) => {
      state.alert = props;
      return createElement("p", null, props["title"] as never);
    },
  };
});

vi.mock("#native/close-button/close-button", async () => {
  const { createElement } = await import("react");
  return {
    CloseButton: ({ label, onPress }: { label: string; onPress: () => void }) =>
      createElement("button", { type: "button", "aria-label": label, onClick: onPress }),
  };
});

describe("SystemBanner (native)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("draws the message on an accent Alert that slides in and out, with a named dismiss", () => {
    render(<SystemBanner title="Card payments are delayed" />);
    expect(state.alert).toMatchObject({ tone: "accent", title: "Card payments are delayed" });
    expect(state.animated["entering"]).toBeDefined();
    expect(state.animated["exiting"]).toBeDefined();
    expect(screen.getByRole("button", { name: "Dismiss message" })).toBeTruthy();
  });

  it("disappears on dismiss and reports it once the exit is over", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <SystemBanner
        tone="warning"
        title="Trial ends soon"
        dismissLabel="Hide"
        onDismiss={onDismiss}
      />,
    );
    act(() => screen.getByRole("button", { name: "Hide" }).click());
    expect(screen.queryByText("Trial ends soon")).toBeNull();
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(250));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has no dismiss button when it is not dismissible", () => {
    render(<SystemBanner isDismissible={false} title="VAT filing due" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
