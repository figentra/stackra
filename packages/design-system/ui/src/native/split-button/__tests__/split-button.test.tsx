/**
 * Stackra file contract:
 * Purpose: proves the native SplitButton hands the primary Button its label, handler and states, puts an IconButton
 *          caret named by `menuLabel` inside a Menu of the sections opening at the end, refuses the caret while loading, and turns the caret with the open state.
 * Boundary: React Native and Reanimated do not run in vitest, so the Button, IconButton, Menu, Icon and Reanimated are
 *           replaced by recording stand-ins that render plain DOM; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { MenuSection } from "#contracts/types/menu-section.type";
import { SplitButton } from "#native/split-button/split-button";

const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return { View: ({ children }: { children?: ReactNode }) => createElement("div", null, children) };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: ({ children }: { children?: ReactNode }) => createElement("span", null, children),
    },
    useReducedMotion: () => true,
    useSharedValue: (value: number) => {
      const shared = {
        value,
        set(next: number) {
          shared.value = next;
        },
      };
      received.props["turn"] = shared as never;
      return shared;
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withTiming: (value: number) => value,
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      received.props["button"] = props;
      return createElement("button", { type: "button" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      received.props["caret"] = props;
      return createElement("button", { type: "button" });
    },
  };
});

vi.mock("#native/icon/icon", () => ({ Icon: () => null }));

vi.mock("#native/menu/menu", async () => {
  const { createElement } = await import("react");
  return {
    Menu: (props: Record<string, unknown>) => {
      received.props["menu"] = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});

const SECTIONS: readonly MenuSection[] = [
  {
    id: "save",
    title: "Save",
    isTitleHidden: true,
    items: [{ id: "save-new", label: "Save and new" }],
  },
];

const propsOf = (name: string) => received.props[name] ?? {};

describe("SplitButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands the halves their label, handler, variant ", () => {
    const onPress = vi.fn();
    render(
      <SplitButton menuLabel="More save options" sections={SECTIONS} onPress={onPress} size="sm">
        Save
      </SplitButton>,
    );
    expect(propsOf("button")).toMatchObject({
      children: "Save",
      onPress,
      variant: "primary",
      size: "sm",
    });
    expect(propsOf("caret")).toMatchObject({
      label: "More save options",
      variant: "primary",
      size: "sm",
      isDisabled: false,
    });
    expect(propsOf("menu")).toMatchObject({
      sections: SECTIONS,
      placement: "bottom",
      align: "end",
    });
  });

  it("refuses the caret while loading", () => {
    render(
      <SplitButton menuLabel="More" sections={SECTIONS} isLoading>
        Save
      </SplitButton>,
    );
    expect(propsOf("caret")).toMatchObject({ isDisabled: true });
    expect(propsOf("button")).toMatchObject({ isLoading: true });
  });

  it("turns the caret while the menu is open and reports the change", () => {
    const onOpenChange = vi.fn();
    render(
      <SplitButton menuLabel="More" sections={SECTIONS} onOpenChange={onOpenChange}>
        Save
      </SplitButton>,
    );
    act(() => (propsOf("menu")["onOpenChange"] as (open: boolean) => void)(true));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect((received.props["turn"] as unknown as { value: number }).value).toBe(180);
  });
});
