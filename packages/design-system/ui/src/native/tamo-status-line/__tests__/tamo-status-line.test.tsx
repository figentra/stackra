/**
 * Stackra file contract:
 * Purpose: proves the native `TamoStatusLine` draws nothing while idle, the working words with Stop while working, and the error with Try again.
 * Boundary: React Native does not render in vitest: react-native, reanimated, react-native-svg, uniwind and the house
 *           leaf components are replaced by recording stand-ins; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoStatusLine } from "#native/tamo-status-line/tamo-status-line";

const seen = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  reduced: false,
  sets: [] as unknown[],
}));

/** A recording stand-in: keeps its last props and renders a DOM element with its children. */
const stand = vi.hoisted(() => (name: string, tag = "div") => async () => {
  const { createElement } = await import("react");
  return (props: Record<string, unknown>) => {
    seen.props[name] = props;
    if (typeof props["testID"] === "string") seen.props[props["testID"]] = props;
    const press = props["onPress"] as (() => void) | undefined;
    return createElement(
      press ? "button" : tag,
      {
        "data-testid": (props["testID"] as string | undefined) ?? name,
        ...(press ? { onClick: () => press() } : {}),
      },
      props["children"] as never,
    );
  };
});

vi.mock("react-native", async () => ({
  View: await stand("View")(),
  Pressable: await stand("Pressable")(),
  StyleSheet: { absoluteFill: {} },
}));
vi.mock("react-native-reanimated", async () => ({
  default: { View: await stand("Animated.View")() },
  cancelAnimation: () => undefined,
  Easing: { linear: "linear", cubic: "cubic", inOut: (easing: unknown) => easing },
  useAnimatedStyle: (worklet: () => unknown) => worklet(),
  useReducedMotion: () => seen.reduced,
  useSharedValue: (initial: number) => ({
    get: () => initial,
    set: (next: unknown) => seen.sets.push(next),
  }),
  withRepeat: (animation: unknown) => animation,
  withTiming: (to: number) => ({ to }),
}));
vi.mock("react-native-svg", async () => ({
  default: await stand("Svg")(),
  Path: await stand("Path")(),
}));
vi.mock("uniwind", () => ({ useCSSVariable: (names: string[]) => names.map(() => "#00a8a4") }));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));
vi.mock("#native/text/text", async () => ({ Text: await stand("Text", "span")() }));
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          onClick: () => (props["onPress"] as (() => void) | undefined)?.(),
          disabled: props["isDisabled"] === true,
        },
        props["children"] as never,
      ),
  };
});
vi.mock("#native/shimmer/shimmer", async () => ({ Shimmer: await stand("Shimmer", "span")() }));
vi.mock("#native/scroll-area/svg-gradient", async () => ({
  SvgGradient: await stand("SvgGradient")(),
}));
vi.mock("#native/menu/menu", async () => ({ Menu: await stand("Menu")() }));
vi.mock("#native/chat-message/chat-message", async () => ({
  ChatMessage: await stand("ChatMessage")(),
}));
vi.mock("#native/prompt-input/prompt-input", async () => ({
  PromptInput: await stand("PromptInput")(),
}));
vi.mock("#native/drawer/drawer", async () => ({
  Drawer: Object.assign(await stand("Drawer")(), {
    Header: await stand("Drawer.Header")(),
    Title: await stand("Drawer.Title")(),
    Description: await stand("Drawer.Description")(),
    Body: await stand("Drawer.Body")(),
    Footer: await stand("Drawer.Footer")(),
  }),
}));
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const field = (tag: string) => (props: Record<string, unknown>) => {
    seen.props[tag] = props;
    return createElement(tag, {
      "data-testid": tag,
      value: props["value"] as string,
      onChange: (event: { target: { value: string } }) =>
        (props["onChangeText"] as (text: string) => void)(event.target.value),
    });
  };
  return {
    TextField: await stand("HeroTextField")(),
    Label: await stand("HeroLabel", "span")(),
    Input: field("input"),
    TextArea: field("textarea"),
  };
});

beforeEach(() => {
  seen.props = {};
  seen.reduced = false;
  seen.sets = [];
});

describe("TamoStatusLine (native)", () => {
  it("is an empty live region while idle", () => {
    render(<TamoStatusLine status="idle" />);
    expect(screen.getByTestId("tamo-status").textContent).toBe("");
    expect(seen.props["View"]?.["accessibilityLiveRegion"]).toBe("polite");
  });

  it("stops while working and retries after an error", () => {
    const onStop = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(
      <TamoStatusLine status="working" onStop={onStop} onRetry={onRetry} />,
    );
    expect(screen.getByText("Tamo is working…")).toBeTruthy();
    fireEvent.click(screen.getByText("Stop"));
    expect(onStop).toHaveBeenCalledOnce();
    rerender(
      <TamoStatusLine status="error" onStop={onStop} onRetry={onRetry} errorMessage="Offline" />,
    );
    expect(screen.getByText("Offline")).toBeTruthy();
    fireEvent.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
