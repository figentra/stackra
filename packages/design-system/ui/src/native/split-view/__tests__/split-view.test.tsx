/**
 * Stackra file contract:
 * Purpose: proves the native SplitView: on a phone it shows one labelled pane at a time (the primary, or the secondary
 *          when `isSecondaryShown`) fading in; wider, it lays both labelled panes side by side with the primary at
 *          `primaryWidth` behind a hairline separator.
 * Boundary: React Native, heroui-native and Reanimated do not run in vitest, so they are recording stand-ins that
 *           render plain DOM; the breakpoint hook is a stand-in set per test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 1.4.10; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { SplitView } from "#native/split-view/split-view";
import type { SplitViewProps } from "#native/split-view/split-view.props";

const state = vi.hoisted(() => ({
  sizeClass: "phone",
  views: [] as Record<string, unknown>[],
  panes: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    StyleSheet: { hairlineWidth: 0.5 },
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.panes.push(props);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    FadeIn: { duration: () => ({ reduceMotion: () => "fade" }) },
    ReduceMotion: { System: "system" },
  };
});
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
  useThemeColor: (name: string) => `color:${name}`,
}));
vi.mock("#native/use-breakpoint/use-breakpoint", () => ({
  useBreakpoint: () => ({ sizeClass: state.sizeClass }),
}));

const draw = (props: Partial<SplitViewProps> = {}) =>
  render(
    <SplitView
      primary={<span>List</span>}
      secondary={<span>Detail</span>}
      primaryLabel="Mail"
      secondaryLabel="Message"
      {...props}
    />,
  );

beforeEach(() => {
  state.sizeClass = "phone";
  state.views.length = 0;
  state.panes.length = 0;
});

describe("SplitView (native)", () => {
  it("shows the primary pane alone on a phone, fading in", () => {
    draw({ className: "app" });
    expect(screen.getByText("List")).toBeTruthy();
    expect(screen.queryByText("Detail")).toBeNull();
    expect(state.panes[0]).toMatchObject({ accessibilityLabel: "Mail", entering: "fade" });
    expect(state.views[0]?.["className"]).toBe("flex-1 app");
  });

  it("shows the secondary pane alone on a phone when asked", () => {
    draw({ isSecondaryShown: true });
    expect(screen.getByText("Detail")).toBeTruthy();
    expect(screen.queryByText("List")).toBeNull();
    expect(state.panes[0]?.["accessibilityLabel"]).toBe("Message");
  });

  it("lays both panes side by side when they fit", () => {
    state.sizeClass = "tablet";
    draw({ primaryWidth: 280 });
    expect(screen.getByText("List")).toBeTruthy();
    expect(screen.getByText("Detail")).toBeTruthy();
    expect(state.views[0]?.["className"]).toBe("flex-1 flex-row");
    expect(state.views.find((view) => view["accessibilityLabel"] === "Mail")).toMatchObject({
      style: { width: 280, borderEndWidth: 0.5, borderColor: "color:separator" },
    });
    expect(state.views.find((view) => view["accessibilityLabel"] === "Message")).toBeTruthy();
    expect(state.panes).toEqual([]);
  });
});
