/**
 * Stackra file contract:
 * Purpose: proves the native Thumbnail is hidden without `alt` and one named image with it, sizes itself, blurs the
 *          placeholder, fades the image in on load (at once under reduced motion) and falls back to an icon with no
 *          image or a broken one.
 * Boundary: React Native and Reanimated are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 12.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { Thumbnail } from "#native/thumbnail/thumbnail";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  images: [] as Record<string, unknown>[],
  animated: [] as Record<string, unknown>[],
  icons: [] as unknown[],
  sets: [] as unknown[],
  isReduced: false,
}));

vi.mock("heroui-native", () => ({ cn: (...parts: unknown[]) => parts.filter(Boolean).join(" ") }));
vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
    Image: (props: Record<string, unknown>) => {
      state.images.push(props);
      return null;
    },
    StyleSheet: { absoluteFill: { position: "absolute" } },
  };
});
vi.mock("react-native-reanimated", () => ({
  default: {
    Image: (props: Record<string, unknown>) => {
      state.animated.push(props);
      return null;
    },
  },
  useReducedMotion: () => state.isReduced,
  useSharedValue: () => ({ get: () => 0, set: (value: unknown) => state.sets.push(value) }),
  useAnimatedStyle: () => ({}),
  withTiming: (value: number) => ({ timing: value }),
}));
vi.mock("#native/slot-icon/slot-icon", () => ({
  SlotIcon: ({ icon }: { icon: unknown }) => {
    state.icons.push(icon);
    return null;
  },
}));

const last = <T,>(list: T[]) => list.at(-1) as T;

describe("Thumbnail (native)", () => {
  beforeEach(() => {
    state.views = [];
    state.images = [];
    state.animated = [];
    state.icons = [];
    state.sets = [];
    state.isReduced = false;
  });

  it("is hidden without alt and one named image with it, sized by size and ratio", () => {
    render(<Thumbnail src="file:///latte.jpg" />);
    expect(last(state.views)["accessible"]).toBe(false);
    render(<Thumbnail src="file:///latte.jpg" alt="Iced latte" size="sm" aspectRatio={2} />);
    const root = last(state.views);
    expect(root["accessibilityRole"]).toBe("image");
    expect(root["accessibilityLabel"]).toBe("Iced latte");
    expect((root["style"] as unknown[])[0]).toEqual({ width: 40, aspectRatio: 2 });
  });

  it("blurs the placeholder and fades the image in on load", () => {
    render(<Thumbnail src="file:///latte.jpg" placeholderSrc="file:///tiny.jpg" fit="contain" />);
    expect(last(state.images)["blurRadius"]).toBe(8);
    const image = last(state.animated);
    expect(image["resizeMode"]).toBe("contain");
    act(() => (image["onLoad"] as () => void)());
    expect(state.sets.at(-1)).toEqual({ timing: 1 });
  });

  it("shows the image at once under reduced motion", () => {
    state.isReduced = true;
    render(<Thumbnail src="file:///latte.jpg" />);
    act(() => (last(state.animated)["onLoad"] as () => void)());
    expect(state.sets.at(-1)).toBe(1);
  });

  it("falls back to the image icon, the broken one after an error, or the caller's", () => {
    render(<Thumbnail />);
    expect(state.icons.at(-1)).toBe("image");
    render(<Thumbnail src="file:///missing.jpg" />);
    act(() => (last(state.animated)["onError"] as () => void)());
    expect(state.icons.at(-1)).toBe("image-off");
    render(<Thumbnail fallback="file" />);
    expect(state.icons.at(-1)).toBe("file");
  });
});
