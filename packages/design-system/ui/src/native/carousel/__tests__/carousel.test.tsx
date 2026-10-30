/**
 * Stackra file contract:
 * Purpose: proves the native Carousel: a labelled pager whose slides are each named "slide n of count", whose arrows
 *          scroll one page (refused at either end) and whose dots jump to a page and mark the current one; a settled
 *          scroll picks the page and reports it once; reduced motion pages without animation, and the arrows and dots
 *          can be left out.
 * Boundary: React Native and Reanimated do not run in vitest, so they and the house IconButton are recording stand-ins
 *           that render plain DOM; the scroll view records each `scrollTo`.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.2.2 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Carousel } from "#native/carousel/carousel";
import type { CarouselProps } from "#native/carousel/carousel.props";

const state = vi.hoisted(() => ({
  reduced: false,
  scrolls: [] as unknown[],
  root: {} as Record<string, unknown>,
  scroller: {} as Record<string, unknown>,
  dots: [] as Record<string, unknown>[],
  arrows: {} as Record<string, Record<string, unknown>>,
}));

vi.mock("react-native", async () => {
  const { createElement, useImperativeHandle } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      if (props["onLayout"]) state.root = props;
      return createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] as string },
        props["children"] as ReactNode,
      );
    },
    ScrollView: (props: Record<string, unknown>) => {
      state.scroller = props;
      useImperativeHandle(props["ref"] as never, () => ({
        scrollTo: (to: unknown) => state.scrolls.push(to),
      }));
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.dots.push(props);
      return createElement("button", {
        type: "button",
        "aria-label": `dot ${String(props["accessibilityLabel"])}`,
        onClick: props["onPress"] as () => void,
      });
    },
  };
});
vi.mock("react-native-reanimated", () => ({ useReducedMotion: () => state.reduced }));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      state.arrows[props["icon"] as string] = props;
      return createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        onClick: props["onPress"] as () => void,
      });
    },
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const SLIDES = [<span key="1">One</span>, <span key="2">Two</span>, <span key="3">Three</span>];
const draw = (props: Partial<CarouselProps> = {}) => {
  const result = render(
    <Carousel label="Gallery" {...props}>
      {SLIDES}
    </Carousel>,
  );
  act(() =>
    (state.root["onLayout"] as (event: unknown) => void)({
      nativeEvent: { layout: { width: 300 } },
    }),
  );
  return result;
};
const settle = (x: number) =>
  act(() =>
    (state.scroller["onMomentumScrollEnd"] as (event: unknown) => void)({
      nativeEvent: { contentOffset: { x } },
    }),
  );
const lastDots = () => state.dots.slice(-3);

beforeEach(() => {
  state.reduced = false;
  state.scrolls.length = 0;
  state.root = {};
  state.scroller = {};
  state.dots.length = 0;
  state.arrows = {};
});

describe("Carousel (native)", () => {
  it("is a labelled horizontal pager naming each slide by its place", () => {
    draw({ className: "wide" });
    expect(state.root).toMatchObject({
      accessibilityLabel: "Gallery",
      className: "w-full gap-3 wide",
    });
    expect(state.scroller).toMatchObject({ horizontal: true, pagingEnabled: true });
    expect(screen.getByLabelText('ui::carousel.slide {"index":2,"count":3}')).toBeTruthy();
    expect(screen.getByLabelText("ui::carousel.pages")).toBeTruthy();
    expect(lastDots().map((dot) => dot["accessibilityState"])).toEqual([
      { selected: true },
      { selected: false },
      { selected: false },
    ]);
    expect(state.arrows["chevron-left"]?.["isDisabled"]).toBe(true);
    expect(state.arrows["chevron-right"]?.["isDisabled"]).toBe(false);
  });

  it("pages with the arrows and clamps at the ends", () => {
    draw();
    fireEvent.click(screen.getByLabelText("ui::carousel.next"));
    expect(state.scrolls).toEqual([{ x: 300, animated: true }]);
    fireEvent.click(screen.getByLabelText("ui::carousel.previous"));
    expect(state.scrolls.at(-1)).toEqual({ x: 0, animated: true });
  });

  it("picks the page from a settled scroll and reports it once", () => {
    const onIndexChange = vi.fn();
    draw({ onIndexChange });
    settle(610);
    settle(590);
    expect(onIndexChange).toHaveBeenCalledOnce();
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(lastDots()[2]?.["accessibilityState"]).toEqual({ selected: true });
    expect(state.arrows["chevron-right"]?.["isDisabled"]).toBe(true);
    fireEvent.click(screen.getByLabelText("ui::carousel.next"));
    expect(state.scrolls.at(-1)).toEqual({ x: 600, animated: true });
  });

  it("ignores a scroll before it is measured", () => {
    const onIndexChange = vi.fn();
    render(
      <Carousel label="Gallery" onIndexChange={onIndexChange}>
        {SLIDES}
      </Carousel>,
    );
    settle(600);
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("jumps to a dot's page without animation under reduced motion", () => {
    state.reduced = true;
    draw();
    fireEvent.click(screen.getByLabelText('dot ui::carousel.slide {"index":3,"count":3}'));
    expect(state.scrolls).toEqual([{ x: 600, animated: false }]);
  });

  it("leaves out the arrows, the dots or both", () => {
    draw({ showArrows: false });
    expect(state.arrows).toEqual({});
    expect(lastDots()).toHaveLength(3);
    state.dots.length = 0;
    draw({ showDots: false });
    expect(state.dots).toEqual([]);
    expect(state.arrows["chevron-left"]).toBeDefined();
    state.arrows = {};
    draw({ showDots: false, showArrows: false });
    expect(state.arrows).toEqual({});
  });
});
