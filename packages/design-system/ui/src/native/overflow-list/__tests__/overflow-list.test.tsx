/**
 * Stackra file contract:
 * Purpose: proves the native OverflowList is a list named by its label, shows `maxVisible` chips, and folds the rest
 *          into one "+N more" button, hinted with the folded names, that expands the row and folds it again.
 * Boundary: jsdom with React Native, Reanimated and the house parts replaced by stand-ins that record their props.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 24.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { OverflowList } from "#native/overflow-list/overflow-list";

const received = vi.hoisted(() => ({ button: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        {
          role: props["accessibilityRole"] as string | undefined,
          "aria-label": props["accessibilityLabel"] as string | undefined,
        },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const chain: object = new Proxy(() => chain, { get: () => chain, apply: () => chain });
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as ReactNode),
    },
    FadeIn: chain,
    LinearTransition: chain,
    useReducedMotion: () => false,
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));

vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      received.button = props;
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});

const TAGS = ["Vegan", "Spicy", "Halal", "New"].map((label) => ({ id: label, label }));

describe("OverflowList (native)", () => {
  it("folds the rest into +N more, hinted with their names, which expands and folds again", () => {
    render(<OverflowList items={TAGS} maxVisible={2} label="Dish tags" />);
    expect(screen.getByRole("list", { name: "Dish tags" })).toBeTruthy();
    expect(screen.queryByText("Halal")).toBeNull();
    expect(received.button["accessibilityHint"]).toBe("Halal and New");
    expect(received.button["accessibilityState"]).toEqual({ expanded: false });
    act(() => screen.getByRole("button", { name: "+2 more" }).click());
    expect(screen.getByText("Halal")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Show less" }).click());
    expect(screen.queryByText("Halal")).toBeNull();
  });

  it("joins the hint with commas where the engine has no Intl.ListFormat (Hermes)", () => {
    vi.stubGlobal("Intl", { ...Intl, ListFormat: undefined });
    try {
      render(<OverflowList items={TAGS} maxVisible={2} label="Dish tags" />);
      expect(received.button["accessibilityHint"]).toBe("Halal, New");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("draws no button when nothing is folded", () => {
    render(<OverflowList items={TAGS.slice(0, 3)} label="Dish tags" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
