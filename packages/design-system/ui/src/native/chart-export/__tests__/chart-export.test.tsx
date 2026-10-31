/**
 * Stackra file contract:
 * Purpose: proves the native ChartExport: a share menu named "Share chart" whose image item shares the chart view's
 *          PNG snapshot and whose CSV item (only with `data`) shares `chartCsvOf(data)` through the system sheet.
 * Boundary: React Native, Skia and ActionMenu are recording stand-ins; the sheet itself is the platform's.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0307; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ChartExport } from "#native/chart-export/chart-export";

const state = vi.hoisted(() => ({
  menus: [] as Record<string, unknown>[],
  shared: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    Share: {
      share: async (content: Record<string, unknown>) => {
        state.shared.push(content);
        return { action: "sharedAction" };
      },
    },
    View: (props: Record<string, unknown>) => createElement("div", null, props["children"] as ReactNode),
  };
});

vi.mock("@shopify/react-native-skia", () => ({
  makeImageFromView: async () => ({ encodeToBase64: () => "AAAA" }),
}));

vi.mock("#native/action-menu/action-menu", () => ({
  ActionMenu: (props: Record<string, unknown>) => {
    state.menus.push(props);
    return null;
  },
}));

/** The items of the last menu drawn. */
const items = () => {
  const sections = state.menus.at(-1)?.["sections"] as
    | { items: { id: string; onPress: () => void }[] }[]
    | undefined;
  return sections?.[0]?.items ?? [];
};

beforeEach(() => {
  state.menus.length = 0;
  state.shared.length = 0;
});

describe("native ChartExport", () => {
  it("offers the image only without data, and shares the snapshot as a PNG", async () => {
    render(
      <ChartExport fileName="sales">
        <span>chart</span>
      </ChartExport>,
    );
    expect(state.menus.at(-1)?.["label"]).toBe("Share chart");
    expect(items().map((item) => item.id)).toEqual(["png"]);
    items()[0]?.onPress();
    await vi.waitFor(() => expect(state.shared).toHaveLength(1));
    expect(state.shared[0]).toEqual({ url: "data:image/png;base64,AAAA", title: "sales" });
  });

  it("shares the raw data as CSV", async () => {
    render(
      <ChartExport fileName="sales" formats={["csv"]} data={{ head: ["Month", "Sales"], rows: [["Jan", 1200]] }}>
        <span>chart</span>
      </ChartExport>,
    );
    expect(items().map((item) => item.id)).toEqual(["csv"]);
    items()[0]?.onPress();
    await vi.waitFor(() => expect(state.shared).toHaveLength(1));
    expect(state.shared[0]).toEqual({ message: "Month,Sales\r\nJan,1200\r\n", title: "sales.csv" });
  });
});
