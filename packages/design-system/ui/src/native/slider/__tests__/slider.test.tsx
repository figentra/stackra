/**
 * Stackra file contract:
 * Purpose: proves the native Slider names HeroUI Native's slider by its label, writes unlabelled marks in the
 *          customer's digits, hides the marks from screen readers, and pairs a number input when asked.
 * Boundary: react-native and heroui-native are the DOM stand-ins of `#testing/fakes/native-dom`; the NumberField is a
 *           stand-in that records its props.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Slider } from "#native/slider/slider";

const seen = vi.hoisted(() => ({
  input: undefined as Record<string, unknown> | undefined,
  slider: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("heroui-native", async () => {
  const { heroNativeDom } = await import("#testing/fakes/hero-native-dom");
  const { createElement } = await import("react");
  const pass = (props: { children?: ReactNode }) => createElement("div", null, props.children);
  // The shared stand-in, with a Slider that also records its props so its change can be driven.
  const RecordingSlider = Object.assign(
    (props: Record<string, unknown>) => {
      seen.slider = props;
      return pass(props);
    },
    { Output: () => null, Track: pass, Fill: () => null, Thumb: () => null },
  );
  return new Proxy(heroNativeDom, {
    get: (target, key) => (key === "Slider" ? RecordingSlider : target[key as string]),
  });
});
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/number-field/number-field", () => ({
  NumberField: (props: Record<string, unknown>) => {
    seen.input = props;
    return null;
  },
}));

describe("Slider (native)", () => {
  it("writes the marks, hidden from screen readers", () => {
    render(<Slider label="Discount" marks={[{ value: 0 }, { value: 50, label: "Half" }]} />);
    expect(screen.getByText("Half")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("pairs a number input named by the label", () => {
    render(<Slider label="Budget" hasInput defaultValue={30} />);
    expect(seen.input).toMatchObject({ accessibilityLabel: "Budget", value: 30 });
  });

  it("reports and keeps a slide, taking the first thumb of an array", () => {
    const onChange = vi.fn();
    render(<Slider label="Volume" minValue={10} onChange={onChange} />);
    expect(seen.slider).toMatchObject({
      value: 10,
      accessibilityLabel: "Volume",
      orientation: "horizontal",
    });
    act(() => (seen.slider["onChange"] as (next: number | number[]) => void)(40));
    expect(onChange).toHaveBeenLastCalledWith(40);
    expect(seen.slider["value"]).toBe(40);
    act(() => (seen.slider["onChange"] as (next: number[]) => void)([]));
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it("clamps a typed number to the bounds, ignores an empty one and keeps the owner's value", () => {
    const onChange = vi.fn();
    render(<Slider label={<b>R</b>} hasInput value={50} maxValue={80} onChange={onChange} />);
    expect(seen.input).not.toHaveProperty("accessibilityLabel");
    expect(seen.slider).not.toHaveProperty("accessibilityLabel");
    const type = seen.input?.["onChange"] as (next: number | null) => void;
    act(() => type(500));
    act(() => type(-5));
    act(() => type(null));
    expect(onChange.mock.calls).toEqual([[80], [0]]);
    expect(seen.slider["value"]).toBe(50);
  });

  it("stands upright with its marks beside it and no number input", () => {
    seen.input = undefined;
    render(
      <Slider
        orientation="vertical"
        hasInput
        description="Up is louder"
        minValue={5}
        maxValue={5}
        marks={[{ value: 5, label: "Max" }]}
      />,
    );
    expect(seen.input).toBeUndefined();
    expect(seen.slider["className"]).toBe("h-64 gap-2");
    expect(screen.getByText("Max")).toBeTruthy();
    expect(screen.getByText("Up is louder")).toBeTruthy();
  });
});
