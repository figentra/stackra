/**
 * Stackra file contract:
 * Purpose: proves the native `TamoAskBox` sends the words, draws the proposal with Apply and Discard, applies only on Apply, and says when nothing
 *          was found.
 * Boundary: React Native does not render in vitest: react-native, reanimated, react-native-svg, uniwind and the house
 *           leaf components are replaced by recording stand-ins; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { TamoAskBox } from "#native/tamo-ask-box/tamo-ask-box";

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

describe("TamoAskBox (native)", () => {
  it("asks, shows the proposal and applies it on Apply", async () => {
    const onAsk = vi.fn(async (text: string) => `proposal for ${text}`);
    const onApply = vi.fn();
    render(
      <TamoAskBox
        onAsk={onAsk}
        onApply={onApply}
        renderProposal={(proposal) => <span>{proposal}</span>}
      />,
    );
    fireEvent.change(screen.getByTestId("input"), { target: { value: " paid orders " } });
    await act(async () => fireEvent.click(screen.getByTestId("tamo-button")));
    expect(onAsk).toHaveBeenCalledWith("paid orders", expect.any(AbortSignal));
    expect(screen.getByText("proposal for paid orders")).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Apply"));
    expect(onApply).toHaveBeenCalledWith("proposal for paid orders");
    expect(screen.queryByText("proposal for paid orders")).toBeNull();
  });

  it("says when there is nothing to propose, and uses a multi-line box for pasted text", async () => {
    render(
      <TamoAskBox
        isMultiline
        onAsk={async () => null}
        onApply={vi.fn()}
        renderProposal={() => null}
      />,
    );
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "x" } });
    await act(async () => fireEvent.click(screen.getByTestId("tamo-button")));
    expect(screen.getByText("Tamo found nothing to suggest. Try other words.")).toBeTruthy();
  });
});
