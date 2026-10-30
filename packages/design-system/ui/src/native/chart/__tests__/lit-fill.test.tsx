/**
 * Stackra file contract:
 * Purpose: proves the native `LitFill` draws nothing in a flat brand (no lift) or without a colour, and otherwise a
 *          canvas filling its parent with a top-to-bottom gradient from the lit colour to the mark's own colour.
 * Boundary: Skia, React Native and the colour mixer are recording stand-ins; the gradient's props are checked, not the pixels.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0320; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { LitFill } from "#native/chart/lit-fill";

const state = vi.hoisted(() => ({
  marks: [] as { name: string; props: Record<string, unknown> }[],
}));

vi.mock("#native/chart/mix-of.function", () => ({
  mixOf: (color: string, other: string, share: number) => `mix(${color},${other},${share})`,
}));
vi.mock("react-native", () => ({ StyleSheet: { absoluteFill: { position: "absolute" } } }));
vi.mock("@shopify/react-native-skia", async () => {
  const { createElement } = await import("react");
  const mark =
    (name: string) =>
    (props: Record<string, unknown>): ReactNode => {
      state.marks.push({ name, props });
      return createElement("div", { "data-mark": name }, props["children"] as ReactNode);
    };
  return {
    Canvas: mark("Canvas"),
    Fill: mark("Fill"),
    LinearGradient: mark("LinearGradient"),
    vec: (x: number, y: number) => ({ x, y }),
  };
});

describe("LitFill (native)", () => {
  beforeEach(() => {
    state.marks = [];
  });

  it("draws nothing without lift or colour", () => {
    expect(render(<LitFill color="#336699" lift={0} height={40} />).container.innerHTML).toBe("");
    expect(render(<LitFill color="" lift={1} height={40} />).container.innerHTML).toBe("");
    expect(state.marks).toHaveLength(0);
  });

  it("fills its parent with a gradient lit from the top", () => {
    render(<LitFill color="#336699" lift={0.5} height={40} />);
    expect(state.marks.map((mark) => mark.name)).toEqual(["Canvas", "Fill", "LinearGradient"]);
    expect(state.marks[0]?.props["style"]).toEqual({ position: "absolute" });
    expect(state.marks[2]?.props).toMatchObject({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 40 },
      colors: ["mix(#336699,#ffffff,0.08)", "#336699"],
    });
  });
});
