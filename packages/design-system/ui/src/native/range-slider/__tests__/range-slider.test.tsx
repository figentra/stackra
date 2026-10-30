/**
 * Stackra file contract:
 * Purpose: proves the native RangeSlider: HeroUI Native's Slider with two thumbs, the whole span by default, named by
 *          a text label; a change of both thumbs is reported as a pair and kept when uncontrolled (a missing thumb
 *          falls back to its bound), a single value ignored; the bounds, step, format and disabled pass through.
 * Boundary: React Native and heroui-native do not render in vitest, so they and the house Text are recording
 *           stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { RangeSlider } from "#native/range-slider/range-slider";

const state = vi.hoisted(() => ({
  slider: {} as Record<string, unknown>,
  thumbs: [] as number[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const pass = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  return {
    Slider: Object.assign(
      (props: Record<string, unknown>) => {
        state.slider = props;
        return pass(props);
      },
      {
        Output: () => null,
        Track: pass,
        Fill: () => null,
        Thumb: (props: { index: number }) => {
          state.thumbs.push(props.index);
          return null;
        },
      },
    ),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const change = (next: unknown) =>
  act(() => (state.slider["onChange"] as (n: unknown) => void)(next));

beforeEach(() => {
  state.slider = {};
  state.thumbs.length = 0;
});

describe("RangeSlider (native)", () => {
  it("spans the whole track with two thumbs, named by the label", () => {
    render(<RangeSlider label="Price" description="In SAR" />);
    expect(state.slider).toMatchObject({
      value: [0, 100],
      minValue: 0,
      maxValue: 100,
      step: 1,
      accessibilityLabel: "Price",
    });
    expect(state.thumbs).toEqual([0, 1]);
    expect(screen.getByText("Price")).toBeTruthy();
    expect(screen.getByText("In SAR")).toBeTruthy();
  });

  it("reports and keeps both thumbs, ignoring a single value", () => {
    const onChange = vi.fn();
    render(<RangeSlider minValue={10} maxValue={50} onChange={onChange} />);
    change([20, 30]);
    expect(onChange).toHaveBeenLastCalledWith([20, 30]);
    expect(state.slider["value"]).toEqual([20, 30]);
    change([]);
    expect(onChange).toHaveBeenLastCalledWith([10, 50]);
    change(5);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("shows the owner's pair, keeps it and passes the rest through", () => {
    const onChange = vi.fn();
    render(
      <RangeSlider
        value={[1, 2]}
        onChange={onChange}
        step={5}
        formatOptions={{ style: "percent" }}
        isDisabled
        label={<b>R</b>}
      />,
    );
    change([3, 4]);
    expect(onChange).toHaveBeenCalledWith([3, 4]);
    expect(state.slider).toMatchObject({
      value: [1, 2],
      step: 5,
      formatOptions: { style: "percent" },
      isDisabled: true,
    });
    expect(state.slider).not.toHaveProperty("accessibilityLabel");
  });

  it("starts from defaultValue", () => {
    render(<RangeSlider defaultValue={[30, 40]} />);
    expect(state.slider["value"]).toEqual([30, 40]);
  });
});
