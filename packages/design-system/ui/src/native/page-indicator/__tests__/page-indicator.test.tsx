/**
 * Stackra file contract:
 * Purpose: proves the native PageIndicator is one image named "Page 2 of 5" when display only, and with `onChange`
 *          a row of buttons, the current one selected, each going to its page.
 * Boundary: React Native and Reanimated are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { PageIndicator } from "#native/page-indicator/page-indicator";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: ({ children, accessibilityRole, accessibilityLabel }: Record<string, unknown>) =>
      createElement(
        "div",
        {
          role: accessibilityRole === "image" ? "img" : undefined,
          "aria-label": accessibilityLabel,
        },
        children as never,
      ),
    Pressable: ({
      children,
      onPress,
      accessibilityLabel,
      accessibilityState,
    }: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          onClick: onPress,
          "aria-label": accessibilityLabel,
          "aria-pressed": (accessibilityState as { selected?: boolean } | undefined)?.selected,
        },
        children as never,
      ),
  };
});
vi.mock("react-native-reanimated", () => ({
  default: { View: () => null },
  useReducedMotion: () => true,
  useSharedValue: (value: number) => ({ get: () => value, set: () => undefined }),
  useAnimatedStyle: () => ({}),
  withTiming: (value: number) => value,
}));

describe("PageIndicator (native)", () => {
  it("is one image when display only", () => {
    render(<PageIndicator count={5} index={1} />);
    expect(screen.getByRole("img", { name: "Page 2 of 5" })).toBeTruthy();
  });

  it("is a row of buttons with onChange", () => {
    const onChange = vi.fn();
    render(<PageIndicator count={3} index={0} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Page 1 of 3" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Page 2 of 3" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
