/**
 * Stackra file contract:
 * Purpose: proves the native `TamoDraftReview` shows the text before and Tamo's draft, accepts the draft or its edit, discards, and shows the working and
 *          error states.
 * Boundary: React Native does not render in vitest: react-native, reanimated, react-native-svg, uniwind and the house
 *           leaf components are replaced by recording stand-ins; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoDraftReview } from "#native/tamo-draft-review/tamo-draft-review";

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

describe("TamoDraftReview (native)", () => {
  it("accepts the draft, or the edit of it", () => {
    const onAccept = vi.fn();
    render(
      <TamoDraftReview before="hi there" after="Hello." onAccept={onAccept} onDiscard={vi.fn()} />,
    );
    expect(screen.getByText("hi there")).toBeTruthy();
    fireEvent.click(screen.getByText("Accept"));
    expect(onAccept).toHaveBeenLastCalledWith("Hello.");
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Hello, Sara." } });
    fireEvent.click(screen.getByText("Accept"));
    expect(onAccept).toHaveBeenLastCalledWith("Hello, Sara.");
  });

  it("discards, and leaves out an empty before", () => {
    const onDiscard = vi.fn();
    render(<TamoDraftReview before="" after="Draft" onAccept={vi.fn()} onDiscard={onDiscard} />);
    expect(screen.queryByText("Before")).toBeNull();
    fireEvent.click(screen.getByText("Discard"));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("shows Stop while working and Try again on error", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <TamoDraftReview
        before="a"
        after=""
        status="working"
        onAccept={vi.fn()}
        onDiscard={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(screen.getByText("Stop")).toBeTruthy();
    rerender(
      <TamoDraftReview
        before="a"
        after=""
        status="error"
        onAccept={vi.fn()}
        onDiscard={vi.fn()}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
