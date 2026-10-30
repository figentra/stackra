/**
 * Stackra file contract:
 * Purpose: proves the native `WidgetFrame` chart card: the header says when it was updated and refreshes on press,
 *          the overflow menu keeps only the native entries (table, full screen), "View as table" swaps the body for
 *          its data in the locale, and the compare switch and sort menu report their choice.
 * Boundary: React Native and HeroUI Native do not render in vitest, so the parts are plain DOM stand-ins that record
 *           their props; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0307; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { WidgetFrame } from "#native/widget-frame/widget-frame";

const { seen, tag } = vi.hoisted(() => ({
  seen: { menus: [] as Record<string, unknown>[], switches: [] as Record<string, unknown>[] },
  /** A stand-in that renders its children in a tag. */
  tag: async (name: string) => {
    const { createElement } = await import("react");
    return (props: Record<string, unknown>) =>
      createElement(name, null, props["children"] as ReactNode);
  },
}));

vi.mock("react-native", async () => ({
  I18nManager: { isRTL: false },
  View: await tag("div"),
  ScrollView: await tag("div"),
}));
vi.mock("#native/text/text", async () => ({ Text: await tag("span") }));
vi.mock("#native/card/card", async () => ({ Card: await tag("section") }));
vi.mock("#native/skeleton/skeleton", async () => ({ Skeleton: await tag("i") }));
vi.mock("#native/spinner/spinner", async () => {
  const { createElement } = await import("react");
  return {
    Spinner: (props: { label: string }) => createElement("progress", { "aria-label": props.label }),
  };
});
vi.mock("#native/empty-state/empty-state", async () => {
  const { createElement } = await import("react");
  return { EmptyState: (props: { title: string }) => createElement("h4", null, props.title) };
});
vi.mock("#native/error-state/error-state", async () => {
  const { createElement } = await import("react");
  return { ErrorState: (props: { title: string }) => createElement("h4", null, props.title) };
});
vi.mock("#native/modal/modal", async () => ({
  // Drawn only while open, as the real dialog is.
  Modal: Object.assign(() => null, {
    Header: await tag("header"),
    Title: await tag("h2"),
    Body: await tag("div"),
    Close: await tag("b"),
  }),
}));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: { label: string; onPress?: () => void }) =>
      createElement("button", {
        type: "button",
        "aria-label": props.label,
        onClick: props.onPress,
      }),
  };
});
vi.mock("#native/switch/switch", () => ({
  Switch: (props: Record<string, unknown>) => {
    seen.switches.push(props);
    return null;
  },
}));
vi.mock("#native/menu/menu", async () => {
  const { createElement } = await import("react");
  return {
    Menu: (props: Record<string, unknown>) => {
      seen.menus.push(props);
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/action-menu/action-menu", () => ({
  ActionMenu: (props: Record<string, unknown>) => {
    seen.menus.push(props);
    return null;
  },
}));

const DATA = { head: ["Month", "Sales"], rows: [["Jan", 1200]] };
type Item = { id: string; label: string; onPress: () => void };
const items = (): Item[] =>
  (seen.menus.at(-1)?.["sections"] as { items: Item[] }[] | undefined)?.[0]?.items ?? [];

beforeEach(() => {
  seen.menus.length = 0;
  seen.switches.length = 0;
});

describe("WidgetFrame (native)", () => {
  it("says when it was updated, refreshes on press and shows a spinner while it works", () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <WidgetFrame title="Sales" updatedAt={Date.now() - 120_000} onRefresh={onRefresh}>
        body
      </WidgetFrame>,
    );
    expect(screen.getByText("Updated 2 min. ago")).toBeTruthy();
    screen.getByRole("button", { name: "Refresh" }).click();
    expect(onRefresh).toHaveBeenCalledOnce();
    rerender(
      <WidgetFrame title="Sales" onRefresh={onRefresh} isRefreshing>
        body
      </WidgetFrame>,
    );
    expect(screen.getByRole("progressbar", { name: "Refreshing" })).toBeTruthy();
  });

  it("keeps the native menu entries and views its data as a table", () => {
    render(
      <WidgetFrame title="Sales" data={DATA} menu={["csv", "png", "table", "fullscreen", "link"]}>
        <p>the chart</p>
      </WidgetFrame>,
    );
    expect(items().map((item) => item.id)).toEqual(["table", "fullscreen"]);
    act(() => items()[0]?.onPress());
    expect(screen.queryByText("the chart")).toBeNull();
    expect(screen.getByText("1,200")).toBeTruthy();
    expect(items()[0]?.label).toBe("View as chart");
  });

  it("reports the compare switch and the sort picked", () => {
    const onCompareChange = vi.fn();
    const onSortChange = vi.fn();
    render(
      <WidgetFrame
        title="Sales"
        isComparing={false}
        onCompareChange={onCompareChange}
        sort="value-desc"
        onSortChange={onSortChange}
      >
        body
      </WidgetFrame>,
    );
    expect(seen.switches[0]?.["label"]).toBe("Compare to previous period");
    (seen.switches[0]?.["onChange"] as ((on: boolean) => void) | undefined)?.(true);
    expect(onCompareChange).toHaveBeenCalledWith(true);
    (seen.menus[0]?.["onChange"] as ((value: string[]) => void) | undefined)?.([
      "value-desc",
      "label",
    ]);
    expect(onSortChange).toHaveBeenCalledWith("label");
  });
});
