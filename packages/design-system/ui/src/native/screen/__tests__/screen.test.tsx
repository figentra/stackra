/**
 * Stackra file contract:
 * Purpose: proves the native Screen paints the theme background on a `main`-role root that carries `label` as its
 *          accessibility label only when given, pads the root by the safe-area inset of exactly the `edges` it is given
 *          (all by default, none for `[]`), draws a `ScrollView` by default that keeps taps working over the keyboard
 *          and takes the keyboard work on iOS, draws a `KeyboardAvoidingView` that pads on iOS and not on Android for a
 *          fixed screen, draws a plain `View` when it neither scrolls nor avoids the keyboard, merges the caller's
 *          classes and style, passes unknown props to the root, and refuses `accessibilityLabel` at the type level.
 * Boundary: React Native does not render in vitest: react-native and the safe-area context are replaced by recording
 *           stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 5 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-174
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import { Screen } from "#native/screen/screen";
import type { ScreenProps } from "#native/screen/screen.props";

vi.mock("react-native", () => {
  /** A stand-in that records the props the screen sets as data attributes. */
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- the factory is hoisted above the imports, so the helper lives inside it
  const stand =
    (kind: string) =>
    ({ children, testID, ...props }: Record<string, unknown> & { children?: ReactNode }) => (
      <div data-testid={String(testID ?? kind)} data-kind={kind} data-props={JSON.stringify(props)}>
        {children}
      </div>
    );
  return {
    View: stand("View"),
    ScrollView: stand("ScrollView"),
    KeyboardAvoidingView: stand("KeyboardAvoidingView"),
    Platform: { OS: "ios" },
  };
});
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 10, right: 20 }),
}));

/** The mocked platform, whose `OS` a case may switch. */
const platform = Platform as { OS: string };

/** The props a stand-in recorded, parsed. */
const propsOf = (testId: string): Record<string, unknown> =>
  JSON.parse(screen.getByTestId(testId).getAttribute("data-props") ?? "{}");

/** The root's style array flattened into one object. */
const insetOf = (testId: string): Record<string, number> =>
  Object.assign({}, ...(propsOf(testId).style as object[]).filter(Boolean));

describe("Screen (native)", () => {
  beforeEach(() => {
    platform.OS = "ios";
  });

  it("paints the theme background on a main-role root", () => {
    render(<Screen testID="root">Orders</Screen>);
    const root = propsOf("root");
    expect(root.role).toBe("main");
    expect(String(root.className)).toContain("bg-background");
    expect(String(root.className)).toContain("flex-1");
  });

  it("puts `label` on the root as the accessibility label only when given", () => {
    const { rerender } = render(<Screen testID="root" />);
    expect(propsOf("root").accessibilityLabel).toBeUndefined();
    rerender(<Screen testID="root" label="Orders screen" />);
    expect(propsOf("root").accessibilityLabel).toBe("Orders screen");
  });

  it("pads the root by every safe-area inset by default", () => {
    render(<Screen testID="root" />);
    expect(insetOf("root")).toEqual({
      paddingTop: 44,
      paddingBottom: 34,
      paddingLeft: 10,
      paddingRight: 20,
    });
  });

  it.each([
    { edges: ["top"] as const, expected: [44, 0, 0, 0] },
    { edges: ["bottom"] as const, expected: [0, 34, 0, 0] },
    { edges: ["sides"] as const, expected: [0, 0, 10, 20] },
    { edges: [] as const, expected: [0, 0, 0, 0] },
  ])("pads by $edges only", ({ edges, expected }) => {
    render(<Screen testID="root" edges={edges} />);
    const inset = insetOf("root");
    expect([inset.paddingTop, inset.paddingBottom, inset.paddingLeft, inset.paddingRight]).toEqual(
      expected,
    );
  });

  it("scrolls by default, keeps taps working over the keyboard and takes the iOS keyboard inset", () => {
    render(<Screen>Orders</Screen>);
    const scroll = propsOf("ScrollView");
    expect(scroll.keyboardShouldPersistTaps).toBe("handled");
    expect(scroll.contentInsetAdjustmentBehavior).toBe("automatic");
    expect(scroll.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(screen.queryByTestId("KeyboardAvoidingView")).toBeNull();
  });

  it("leaves the keyboard inset to the app when isKeyboardAvoiding is false", () => {
    render(<Screen isKeyboardAvoiding={false}>Orders</Screen>);
    expect(propsOf("ScrollView").automaticallyAdjustKeyboardInsets).toBe(false);
  });

  it("draws a KeyboardAvoidingView that pads on iOS for a fixed screen", () => {
    render(<Screen isScrollable={false}>Orders</Screen>);
    expect(screen.queryByTestId("ScrollView")).toBeNull();
    expect(propsOf("KeyboardAvoidingView").behavior).toBe("padding");
  });

  it("gives the KeyboardAvoidingView no behaviour on Android, where the window resizes itself", () => {
    platform.OS = "android";
    render(<Screen isScrollable={false}>Orders</Screen>);
    expect(propsOf("KeyboardAvoidingView").behavior).toBeUndefined();
  });

  it("draws a plain View when it neither scrolls nor avoids the keyboard", () => {
    render(
      <Screen isScrollable={false} isKeyboardAvoiding={false}>
        Orders
      </Screen>,
    );
    expect(screen.queryByTestId("ScrollView")).toBeNull();
    expect(screen.queryByTestId("KeyboardAvoidingView")).toBeNull();
    expect(screen.getByText("Orders").closest("[data-kind='View']")).toBeTruthy();
  });

  it("merges the caller's classes and style and passes unknown props to the root", () => {
    render(
      <Screen
        testID="root"
        className="extra"
        style={{ opacity: 0.5 }}
        accessibilityHint="Orders"
      />,
    );
    const root = propsOf("root");
    expect(String(root.className)).toContain("extra");
    expect(String(root.className)).toContain("bg-background");
    expect(root.accessibilityHint).toBe("Orders");
    expect(insetOf("root").opacity).toBe(0.5);
  });

  it("refuses the raw `accessibilityLabel` at the type level", () => {
    // @ts-expect-error: `label` is the screen's name, not `accessibilityLabel`
    const refused: ScreenProps = { accessibilityLabel: "Orders" };
    expect(refused).toBeTruthy();
  });
});
