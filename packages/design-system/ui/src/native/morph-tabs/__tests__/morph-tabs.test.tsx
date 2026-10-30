/**
 * Stackra file contract:
 * Purpose: proves the native MorphTabs: a labelled tablist of icon tabs where the chosen one grows into a pill with
 *          its words; a press on another tab chooses it with a selection haptic and reports it, a press on the
 *          current one does nothing; disabled tabs and a disabled list refuse; it can be controlled and starts from
 *          the default or the first tab.
 * Boundary: React Native, heroui-native, lucide and Reanimated do not run in vitest, so they and the house Text and
 *           SlotIcon are recording stand-ins that render plain DOM; what each is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { MorphTabs } from "#native/morph-tabs/morph-tabs";
import type { MorphTabsProps } from "#native/morph-tabs/morph-tabs.props";

const state = vi.hoisted(() => ({
  root: {} as Record<string, unknown>,
  tabs: {} as Record<string, Record<string, unknown>>,
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.root = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.tabs[props["accessibilityLabel"] as string] = props;
      return createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          onClick: props["disabled"] ? undefined : (props["onPress"] as () => void),
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const chain = { duration: () => ({ reduceMotion: () => "motion" }) };
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as ReactNode),
    },
    FadeIn: chain,
    LinearTransition: chain,
    ReduceMotion: { System: "system" },
  };
});
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
  useThemeColor: (names: string[]) => names,
}));
vi.mock("lucide-react-native", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) =>
      createElement(Fragment, null, props["children"] as ReactNode),
  };
});
vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const ITEMS = [
  { id: "home", label: "Home", icon: "house" as const },
  { id: "search", label: "Search", icon: "search" as const },
  { id: "off", label: "Off", icon: "x" as const, isDisabled: true },
];
const draw = (props: Partial<MorphTabsProps> = {}) =>
  render(<MorphTabs label="Sections" items={ITEMS} {...props} />);
const selectedOf = (name: string) =>
  (state.tabs[name]?.["accessibilityState"] as { selected: boolean } | undefined)?.selected;

beforeEach(() => {
  state.root = {};
  state.tabs = {};
  state.played.length = 0;
});

describe("MorphTabs (native)", () => {
  it("is a labelled tablist whose first tab is chosen and shows its words", () => {
    draw({ className: "bar" });
    expect(state.root).toMatchObject({
      accessibilityRole: "tablist",
      accessibilityLabel: "Sections",
    });
    expect(state.root["className"]).toBe("flex-row items-center gap-1 bar");
    expect(selectedOf("Home")).toBe(true);
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.queryByText("Search")).toBeNull();
    expect(String(state.tabs["Home"]?.["className"])).toContain("bg-accent-soft");
    expect(state.tabs["Off"]).toMatchObject({ disabled: true });
  });

  it("chooses another tab with a haptic and ignores the current one", () => {
    const onSelectionChange = vi.fn();
    draw({ onSelectionChange });
    fireEvent.click(screen.getByLabelText("Home"));
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Search"));
    expect(onSelectionChange).toHaveBeenCalledWith("search");
    expect(state.played).toEqual(["selection"]);
    expect(screen.getByText("Search")).toBeTruthy();
  });

  it("is controlled, starts from the default and refuses every tab while disabled", () => {
    const onSelectionChange = vi.fn();
    draw({ selectedKey: "search", onSelectionChange });
    fireEvent.click(screen.getByLabelText("Home"));
    expect(onSelectionChange).toHaveBeenCalledWith("home");
    expect(selectedOf("Search")).toBe(true);
    draw({ defaultSelectedKey: "search", isDisabled: true });
    expect(state.root["className"]).toContain("opacity-50");
    expect(state.tabs["Home"]).toMatchObject({
      disabled: true,
      accessibilityState: { selected: false, disabled: true },
    });
  });
});
