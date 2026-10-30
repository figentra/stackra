/**
 * Stackra file contract:
 * Purpose: proves the native ProgressButton: without progress it is the plain house Button with no fill; with
 *          progress it says busy until full, reports its percentage (clamped to 0..100) as the accessibility value
 *          named by `progressLabel`, the label or the string child, fills a bar in the variant's colour (timed, or at
 *          once under reduced motion), and full width stretches it.
 * Boundary: React Native, heroui-native and Reanimated do not run in vitest, so they and the house Button are
 *           recording stand-ins that render plain DOM; what each is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2 and 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ProgressButton } from "#native/progress-button/progress-button";
import type { ProgressButtonProps } from "#native/progress-button/progress-button.props";

const state = vi.hoisted(() => ({
  reduced: false,
  sets: [] as unknown[],
  root: {} as Record<string, unknown>,
  button: {} as Record<string, unknown>,
  fill: undefined as Record<string, unknown> | undefined,
  ink: "",
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.root = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("react-native-reanimated", () => ({
  default: {
    View: (props: Record<string, unknown>) => {
      state.fill = props;
      return null;
    },
  },
  useSharedValue: (initial: number) => ({
    get: () => initial,
    set: (next: unknown) => state.sets.push(next),
  }),
  useAnimatedStyle: (worklet: () => unknown) => worklet(),
  useReducedMotion: () => state.reduced,
  withTiming: (to: number) => ({ timing: to }),
}));
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
  useThemeColor: (name: string) => {
    state.ink = name;
    return `color:${name}`;
  },
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown>) => {
    state.button = props;
    return null;
  },
}));

const draw = (props: Partial<ProgressButtonProps> = {}) =>
  render(<ProgressButton {...props}>Upload</ProgressButton>);

beforeEach(() => {
  state.reduced = false;
  state.sets.length = 0;
  state.root = {};
  state.button = {};
  state.fill = undefined;
  state.ink = "";
});

describe("ProgressButton (native)", () => {
  it("is a plain button named by its words without progress", () => {
    draw({ className: "x" });
    expect(state.button).toMatchObject({ variant: "primary", isLoading: false, label: "Upload" });
    expect(state.button).not.toHaveProperty("accessibilityValue");
    expect(state.button).not.toHaveProperty("isFullWidth");
    expect(state.fill).toBeUndefined();
    expect(state.root["className"]).toBe(
      "relative overflow-hidden rounded-[var(--radius-pill)] self-start x",
    );
    expect(state.ink).toBe("accent-foreground");
  });

  it("says busy and its percentage while running and fills the bar", () => {
    draw({ progress: 0.426, progressLabel: "Uploading", isFullWidth: true });
    expect(state.button).toMatchObject({
      isLoading: true,
      isFullWidth: true,
      accessibilityValue: { min: 0, max: 100, now: 43, text: "Uploading 43%" },
    });
    expect(state.sets).toEqual([{ timing: 0.426 }]);
    expect(state.fill?.["style"]).toContainEqual({ width: "42.6%" });
    expect(state.root["className"]).toContain("self-stretch");
  });

  it("clamps the progress and stops saying busy when full", () => {
    draw({ progress: 2, label: "Send" });
    expect(state.button).toMatchObject({
      isLoading: false,
      label: "Send",
      accessibilityValue: { now: 100, text: "Send 100%" },
    });
    draw({ progress: -1 });
    expect(state.button["accessibilityValue"]).toMatchObject({ now: 0 });
  });

  it("fills at once under reduced motion and takes the variant's colour", () => {
    state.reduced = true;
    draw({ progress: 0.5, variant: "danger" });
    expect(state.sets).toEqual([0.5]);
    expect(state.ink).toBe("danger-foreground");
    draw({ progress: 0.5, variant: "secondary" });
    expect(state.ink).toBe("accent");
  });

  it("has no name and only the percentage for a non-string child", () => {
    render(
      <ProgressButton progress={0.1}>
        <b>icon</b>
      </ProgressButton>,
    );
    expect(state.button).not.toHaveProperty("label");
    expect(state.button["accessibilityValue"]).toMatchObject({ text: "10%" });
  });
});
