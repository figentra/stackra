/**
 * Stackra file contract:
 * Purpose: proves the native network graph, tree diagram, word cloud and chord diagram: each is one image named by its
 *          label whose value reads every link, node, word or flow in the locale (Arabic-Indic digits when asked), and
 *          hands Skia one mark per node, link, group or flow; the tree runs from the right in Arabic.
 * Boundary: React Native, Skia and Uniwind do not run in vitest, so they are replaced by recording stand-ins that render
 *           plain DOM; what the charts hand them is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060; WCAG 2.2 SC 1.1.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { ChordDiagram } from "#native/chord-diagram/chord-diagram";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { NetworkGraph } from "#native/network-graph/network-graph";
import { TreeDiagram } from "#native/tree-diagram/tree-diagram";
import { WordCloud } from "#native/word-cloud/word-cloud";

const state = vi.hoisted(() => ({
  images: [] as Record<string, unknown>[],
  marks: [] as { kind: string; props: Record<string, unknown> }[],
  texts: [] as string[],
}));

/** A Skia stand-in that records what it is handed. */
const recorder = vi.hoisted(() => (kind: string) => (props: Record<string, unknown>) => {
  state.marks.push({ kind, props });
  return null;
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "image") state.images.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      state.texts.push(String(props["children"]));
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/chart/use-canvas-size", () => ({
  useCanvasSize: () => ({ width: 300, onLayout: () => undefined }),
}));

vi.mock("uniwind", () => ({ useCSSVariable: (names: string[]) => names.map(() => "#336699") }));

vi.mock("@shopify/react-native-skia", async () => {
  const { createElement } = await import("react");
  return {
    Skia: { Color: () => [0.2, 0.4, 0.6, 1] },
    vec: (x: number, y: number) => ({ x, y }),
    Canvas: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Path: recorder("path"),
    Circle: recorder("circle"),
    Line: recorder("line"),
  };
});

/** Renders in a provider of the given locale and direction. */
const inLocale = (locale: string, direction: "ltr" | "rtl", node: ReactNode) =>
  render(
    <DesignSystemContext value={{ locale, direction } as DesignSystemState}>{node}</DesignSystemContext>,
  );

/** How many marks of `kind` were handed to Skia. */
const count = (kind: string) => state.marks.filter((mark) => mark.kind === kind).length;

beforeEach(() => {
  state.images.length = 0;
  state.marks.length = 0;
  state.texts.length = 0;
});

const NODES = [
  { key: "a", label: "Sara" },
  { key: "b", label: "Omar" },
  { key: "c", label: "Lina" },
];

describe("native NetworkGraph", () => {
  it("speaks every link and draws a circle per node and a line per link", () => {
    inLocale(
      "en",
      "ltr",
      <NetworkGraph label="Team" nodes={NODES} links={[{ source: "a", target: "b", value: 1200 }]} />,
    );
    expect(state.images[0]).toMatchObject({
      accessibilityLabel: "Team",
      accessibilityValue: { text: "Sara – Omar 1,200" },
    });
    expect([count("circle"), count("line")]).toEqual([3, 1]);
  });
});

describe("native TreeDiagram", () => {
  it("speaks each node with its path and runs from the right in Arabic", () => {
    inLocale(
      "ar-u-nu-arab",
      "rtl",
      <TreeDiagram
        label="الفريق"
        items={[{ key: "r", label: "المدير", children: [{ key: "a", label: "سارة", value: 12 }] }]}
      />,
    );
    const spoken = state.images[0]?.["accessibilityValue"] as { text: string } | undefined;
    expect(spoken?.text).toBe("المدير ١٢، المدير › سارة ١٢");
    const root = state.marks.find((mark) => mark.kind === "circle");
    expect(root?.props["cx"]).toBe(292);
    expect(count("path")).toBe(1);
  });
});

describe("native WordCloud", () => {
  it("speaks the words heaviest first and sets each as platform text", () => {
    inLocale(
      "en",
      "ltr",
      <WordCloud
        label="Mentions"
        words={[
          { text: "late", value: 4 },
          { text: "fresh", value: 9 },
        ]}
      />,
    );
    expect(state.images[0]?.["accessibilityValue"]).toEqual({ text: "fresh 9, late 4" });
    expect(state.texts).toEqual(["fresh", "late"]);
  });
});

describe("native ChordDiagram", () => {
  it("speaks every flow and draws a ribbon per flow and an arc per group", () => {
    inLocale(
      "en",
      "ltr",
      <ChordDiagram
        label="Moves"
        nodes={NODES}
        links={[
          { source: "a", target: "b", value: 5 },
          { source: "c", target: "a", value: 2 },
        ]}
      />,
    );
    expect(state.images[0]?.["accessibilityValue"]).toEqual({ text: "Sara → Omar 5, Lina → Sara 2" });
    expect(count("path")).toBe(5);
    expect(state.texts).toEqual(["Sara", "Omar", "Lina"]);
  });
});
