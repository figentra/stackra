/**
 * Stackra file contract:
 * Purpose: proves the native `TamoMenu` offers only Draft on an empty text, the improve, translate, tone and more sections otherwise (Translate to
 *          English on Arabic text), with contributed actions, and reports the chosen action.
 * Boundary: React Native does not render in vitest: react-native, reanimated, react-native-svg, uniwind and the house
 *           leaf components are replaced by recording stand-ins; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import type { MenuSection } from "#contracts/types/menu-section.type";
import { TamoMenu } from "#native/tamo-menu/tamo-menu";

/** The ids of every item the menu was given. */
function idsOf(): string[] {
  const sections = (seen.props["Menu"]?.["sections"] ?? []) as MenuSection[];
  return sections.flatMap((section) => section.items.map((item) => item.id));
}

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

describe("TamoMenu (native)", () => {
  it("offers only Draft on an empty text", () => {
    render(<TamoMenu onAction={vi.fn()} text="  " />);
    expect(idsOf()).toEqual(["draft"]);
  });

  it("offers the text actions, continue and contributed ones, and reports the choice", () => {
    const onAction = vi.fn();
    render(
      <TamoMenu
        onAction={onAction}
        text="Hello"
        hasContinue
        actions={[{ id: "seo_title", label: "SEO title" }]}
      />,
    );
    expect(idsOf()).toEqual([
      "rewrite",
      "shorten",
      "expand",
      "fix_grammar",
      "translate",
      "formal",
      "friendly",
      "continue",
      "seo_title",
    ]);
    (seen.props["Menu"]?.["onAction"] as ((id: string) => void) | undefined)?.("shorten");
    expect(onAction).toHaveBeenCalledWith("shorten");
  });

  it("translates Arabic text to English", () => {
    render(<TamoMenu onAction={vi.fn()} text="مرحبا" kinds={["translate"]} />);
    const [section] = (seen.props["Menu"]?.["sections"] ?? []) as MenuSection[];
    expect(section?.items[0]).toMatchObject({ id: "translate", label: "Translate to English" });
  });
});
