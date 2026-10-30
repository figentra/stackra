/**
 * Stackra file contract:
 * Purpose: proves the native ScrollArea: a labelled scroll view inside HeroUI Native's ScrollShadow, vertical by
 *          default with a 40-point fade, horizontal when asked, capped in its own direction by `maxSize`, with the
 *          SVG gradient drawing the fades: its stops spread evenly (or at the given locations) from top to bottom by
 *          default, or between the given points, under one gradient id.
 * Boundary: React Native, heroui-native and react-native-svg do not run in vitest, so they are recording stand-ins
 *           that render plain DOM; the gradient is rendered directly as ScrollShadow would.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.4.10; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ScrollArea } from "#native/scroll-area/scroll-area";
import { SvgGradient } from "#native/scroll-area/svg-gradient";

const state = vi.hoisted(() => ({
  shadow: {} as Record<string, unknown>,
  scroll: {} as Record<string, unknown>,
  gradient: {} as Record<string, unknown>,
  stops: [] as Record<string, unknown>[],
  rect: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    ScrollView: (props: Record<string, unknown>) => {
      state.scroll = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    ScrollShadow: (props: Record<string, unknown>) => {
      state.shadow = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("react-native-svg", async () => {
  const { createElement } = await import("react");
  const pass = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  return {
    default: pass,
    Defs: pass,
    LinearGradient: (props: Record<string, unknown>) => {
      state.gradient = props;
      return pass(props);
    },
    Stop: (props: Record<string, unknown>) => {
      state.stops.push(props);
      return null;
    },
    Rect: (props: Record<string, unknown>) => {
      state.rect = props;
      return null;
    },
  };
});

beforeEach(() => {
  state.shadow = {};
  state.scroll = {};
  state.gradient = {};
  state.stops.length = 0;
  state.rect = {};
});

describe("ScrollArea (native)", () => {
  it("is a labelled vertical scroll view with a 40-point SVG fade", () => {
    render(
      <ScrollArea label="Notes">
        <span>Body</span>
      </ScrollArea>,
    );
    expect(state.shadow).toMatchObject({
      LinearGradientComponent: SvgGradient,
      orientation: "vertical",
      size: 40,
      style: undefined,
    });
    expect(state.shadow).not.toHaveProperty("className");
    expect(state.scroll).toMatchObject({ accessibilityLabel: "Notes", horizontal: false });
  });

  it("caps its height, or its width when horizontal", () => {
    render(
      <ScrollArea label="Notes" maxSize={200} fadeSize={12} className="box">
        x
      </ScrollArea>,
    );
    expect(state.shadow).toMatchObject({ style: { maxHeight: 200 }, size: 12, className: "box" });
    render(
      <ScrollArea label="Tags" orientation="horizontal" maxSize={300}>
        x
      </ScrollArea>,
    );
    expect(state.shadow["style"]).toEqual({ maxWidth: 300 });
    expect(state.scroll["horizontal"]).toBe(true);
  });
});

describe("SvgGradient (native)", () => {
  it("spreads its stops evenly from top to bottom under one id", () => {
    render(<SvgGradient colors={["#000", "#888", "#fff"]} style={{ height: 40 }} />);
    expect(state.gradient).toMatchObject({ x1: 0, y1: 0, x2: 0, y2: 1 });
    expect(state.stops.map((stop) => [stop["offset"], stop["stopColor"]])).toEqual([
      [0, "#000"],
      [0.5, "#888"],
      [1, "#fff"],
    ]);
    expect(state.rect["fill"]).toBe(`url(#${String(state.gradient["id"])})`);
  });

  it("takes the given locations and points, and a single colour sits at the start", () => {
    render(
      <SvgGradient
        colors={["#000", "#fff"]}
        locations={[0.2]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
      />,
    );
    expect(state.gradient).toMatchObject({ x1: 1, y1: 0, x2: 0, y2: 0 });
    expect(state.stops.map((stop) => stop["offset"])).toEqual([0.2, 1]);
    state.stops.length = 0;
    render(<SvgGradient colors={["#000"]} />);
    expect(state.stops[0]?.["offset"]).toBe(0);
  });
});
