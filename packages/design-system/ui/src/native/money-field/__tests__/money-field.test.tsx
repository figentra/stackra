/**
 * Stackra file contract:
 * Purpose: proves the native MoneyField hands the native NumberField the amount in major units with the currency's
 *          format, minimum and step, reads changes back as minor units, keeps the largest amount past it with a shake
 *          and an error haptic, draws the currency picker only for two or more codes and reports a pick.
 * Boundary: React Native does not render in vitest, so the NumberField, the Select, Reanimated, the shake and the
 *           haptics are replaced by recording stand-ins; what reaches them is checked.
 * Runtime: node
 * Governing contract: gap inventory row 2; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { MoneyField } from "#native/money-field/money-field";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  shake: vi.fn(),
  play: vi.fn(),
}));

vi.mock("react-native", async () => ({ View: (await import("react")).Fragment }));
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: { children?: ReactNode }) => createElement("div", null, props.children),
    },
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => false,
    useSharedValue: (value: number) => ({ value, set: () => undefined }),
    withSequence: (...steps: unknown[]) => steps,
    withTiming: (value: number) => value,
  };
});
vi.mock("#native/shake/use-shake", () => ({ useShake: () => ({ style: {}, shake: state.shake }) }));
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: state.play } }));
vi.mock("#native/number-field/number-field", () => ({
  NumberField: (props: Record<string, unknown>) => {
    state.props["field"] = props;
    return null;
  },
}));
vi.mock("#native/select/select", () => ({
  Select: (props: Record<string, unknown>) => {
    state.props["select"] = props;
    return null;
  },
}));

const field = () => state.props["field"] ?? {};
const change = (major: number | null) =>
  act(() => (field()["onChange"] as (value: number | null) => void)(major));

describe("MoneyField (native)", () => {
  beforeEach(() => {
    state.props = {};
    state.shake.mockClear();
    state.play.mockClear();
  });

  it("hands the NumberField major units in the currency's format, minimum and step", () => {
    render(<MoneyField label="Price" currency="KWD" value={12_500} minValue={500} />);
    expect(field()["value"]).toBe(12.5);
    expect(field()["minValue"]).toBe(0.5);
    expect(field()["step"]).toBe(1);
    expect(field()["formatOptions"]).toEqual({
      style: "currency",
      currency: "KWD",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    expect(field()["maxValue"]).toBeUndefined();
  });

  it("reads changes back as minor units, null for empty", () => {
    const onChange = vi.fn();
    render(<MoneyField label="Price" currency="SAR" defaultValue={null} onChange={onChange} />);
    change(19.99);
    expect(onChange).toHaveBeenLastCalledWith(1999);
    expect(field()["value"]).toBe(19.99);
    change(null);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("keeps the largest amount past it, with a shake and an error haptic", () => {
    const onChange = vi.fn();
    render(<MoneyField label="Price" currency="SAR" maxValue={10_000} onChange={onChange} />);
    change(150);
    expect(onChange).toHaveBeenLastCalledWith(10_000);
    expect(state.shake).toHaveBeenCalledTimes(1);
    expect(state.play).toHaveBeenCalledWith("error");
    change(100);
    expect(state.shake).toHaveBeenCalledTimes(1);
  });

  it("draws the currency picker only for two or more codes and reports a pick", () => {
    const onCurrencyChange = vi.fn();
    const { rerender } = render(
      <MoneyField label="Price" currency="SAR" currencies={["SAR"]} currencyLabel="Currency" />,
    );
    expect(state.props["select"]).toBeUndefined();
    rerender(
      <MoneyField
        label="Price"
        currency="SAR"
        currencies={["SAR", "AED"]}
        currencyLabel="Currency"
        onCurrencyChange={onCurrencyChange}
      />,
    );
    const select = state.props["select"] ?? {};
    expect(select["label"]).toBe("Currency");
    expect(select["value"]).toBe("SAR");
    act(() => (select["onChange"] as (code: string | null) => void)("AED"));
    expect(onCurrencyChange).toHaveBeenCalledWith("AED");
  });
});
