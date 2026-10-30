/**
 * Stackra file contract:
 * Purpose: proves the native AvatarGroup draws up to `max` decorative avatars and a "+N" count, reads as one image
 *          named by the label, the names and the count, and fans out on press with a light haptic (at once under
 *          reduced motion), stacking again on a second press.
 * Boundary: React Native, Reanimated, the Avatar and haptics are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 25.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { AvatarGroup } from "#native/avatar-group/avatar-group";

const state = vi.hoisted(() => ({
  root: {} as Record<string, unknown>,
  avatars: [] as Record<string, unknown>[],
  played: [] as string[],
  sets: [] as unknown[],
  isReduced: false,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    Pressable: (props: Record<string, unknown>) => {
      state.root = props;
      return createElement("div", null, props["children"] as never);
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as never),
    },
    interpolate: () => 0,
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => state.isReduced,
    useSharedValue: () => ({ get: () => 0, set: (value: unknown) => state.sets.push(value) }),
    withSpring: (value: number) => ({ spring: value }),
  };
});
vi.mock("#native/avatar/avatar", () => ({
  Avatar: (props: Record<string, unknown>) => {
    state.avatars.push(props);
    return null;
  },
}));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));

const STAFF = ["Ada Lovelace", "ليلى أحمد", "Grace Hopper", "Omar Khaled", "Mona Saleh"].map(
  (name, index) => ({
    id: String(index),
    name,
  }),
);

describe("AvatarGroup (native)", () => {
  beforeEach(() => {
    state.avatars = [];
    state.played = [];
    state.sets = [];
    state.isReduced = false;
  });

  it("draws max decorative avatars and a +N count, named as one image", () => {
    render(<AvatarGroup items={STAFF} max={3} label="Staff on shift" size="sm" tone="accent" />);
    expect(state.avatars.map((props) => props["name"] ?? props["fallback"])).toEqual([
      "Ada Lovelace",
      "ليلى أحمد",
      "Grace Hopper",
      "+2",
    ]);
    expect(state.avatars.every((props) => props["label"] === undefined)).toBe(true);
    expect(state.avatars[0]?.["tone"]).toBe("accent");
    expect(state.root["accessibilityRole"]).toBe("image");
    expect(state.root["accessibilityLabel"]).toBe(
      "Staff on shift: Ada Lovelace, ليلى أحمد, Grace Hopper, and 2 more people",
    );
  });

  it("fans out on press with a light haptic and stacks on a second press", () => {
    render(<AvatarGroup items={STAFF} label="Assignees" />);
    act(() => (state.root["onPress"] as () => void)());
    expect(state.played).toEqual(["light"]);
    expect(state.sets.at(-1)).toEqual({ spring: 1 });
    act(() => (state.root["onPress"] as () => void)());
    expect(state.sets.at(-1)).toEqual({ spring: 0 });
  });

  it("moves at once under reduced motion", () => {
    state.isReduced = true;
    render(<AvatarGroup items={STAFF} label="Assignees" />);
    act(() => (state.root["onPress"] as () => void)());
    expect(state.sets.at(-1)).toBe(1);
  });
});
