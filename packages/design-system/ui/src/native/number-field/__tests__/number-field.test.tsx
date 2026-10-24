/**
 * Stackra file contract:
 * Purpose: proves the native NumberField shows its number as the locale and format write it, keeps a draft only while
 *          it can still become a number, parses, clamps and rounds the draft when the field is left (reporting `null`
 *          when emptied), steps by `step` (0.01 for percent) within the bounds and from the nearer bound when empty,
 *          disables a stepper at its bound and both while disabled or read-only, reads Arabic digits, picks the keyboard
 *          that can type every accepted value, keeps its own number when uncontrolled, and hands HeroUI Native the
 *          field's states and name.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native's Platform, the provider's locale and
 *           the IconButton are replaced by stand-ins that render plain DOM; `@internationalized/number` runs for real,
 *           so the parsing and formatting checked are the ones the app ships.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0055; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-203
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import { NumberField, type NumberFieldProps } from "#native/number-field/number-field";

/** The props each stand-in was last handed, by name, and the stand-ins' own settings. */
const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  locale: "en-US",
  os: "ios",
}));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    state.props[name] = props;
    return h("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    TextField: record("root"),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    InputGroup: Object.assign(record("group"), {
      Prefix: record("prefix"),
      Suffix: record("suffix"),
      Input: (props: Record<string, unknown>) => {
        state.props["input"] = props;
        return h("input", {
          "data-testid": "input",
          value: props["value"] as string,
          onChange: (event: { target: { value: string } }) =>
            (props["onChangeText"] as (text: string) => void)(event.target.value),
          onBlur: props["onBlur"] as () => void,
        });
      },
    }),
  };
});

vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return state.os;
    },
  },
}));

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: state.locale }),
}));

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement: h } = await import("react");
  return {
    IconButton: (props: {
      readonly label: string;
      readonly icon: string;
      readonly isDisabled?: boolean;
      readonly onPress?: () => void;
    }) =>
      h("button", {
        "aria-label": props.label,
        "data-icon": props.icon,
        disabled: props.isDisabled,
        onClick: props.onPress,
      }),
  };
});

const propsOf = (name: string) => state.props[name] ?? {};
const input = () => screen.getByTestId("input") as HTMLInputElement;
const increase = () => screen.getByRole("button", { name: "Increase" }) as HTMLButtonElement;
const decrease = () => screen.getByRole("button", { name: "Decrease" }) as HTMLButtonElement;

/** Types `text` and leaves the field. */
const typeAndLeave = (text: string) => {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.blur(input());
};

describe("NumberField (native)", () => {
  beforeEach(() => {
    state.props = {};
    state.locale = "en-US";
    state.os = "ios";
  });

  it("shows the number as the locale and the format write it, and nothing when empty", () => {
    const { rerender } = render(<NumberField label="Seats" value={1234.5} />);
    expect(input().value).toBe("1,234.5");
    rerender(
      <NumberField
        label="Price"
        value={12.5}
        formatOptions={{ style: "currency", currency: "EUR" }}
      />,
    );
    expect(input().value).toBe("€12.50");
    rerender(<NumberField label="Seats" value={null} />);
    expect(input().value).toBe("");
  });

  it("keeps a draft only while it can still become a number", () => {
    render(<NumberField label="Seats" value={4} minValue={0} />);
    fireEvent.change(input(), { target: { value: "12" } });
    expect(input().value).toBe("12");
    fireEvent.change(input(), { target: { value: "12a" } });
    expect(input().value).toBe("12");
    fireEvent.change(input(), { target: { value: "-1" } });
    expect(input().value).toBe("12");
  });

  it("parses, clamps and rounds the draft when the field is left, and reports it", () => {
    const onChange = vi.fn();
    render(
      <NumberField
        label="Rate"
        value={1}
        minValue={0}
        maxValue={10}
        formatOptions={{ maximumFractionDigits: 1 }}
        onChange={onChange}
      />,
    );
    typeAndLeave("3.14");
    expect(onChange).toHaveBeenLastCalledWith(3.1);
    typeAndLeave("42");
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it("reports null once emptied, and nothing for a draft that never became a number", () => {
    const onChange = vi.fn();
    render(<NumberField label="Seats" value={4} onChange={onChange} />);
    typeAndLeave("-");
    expect(onChange).not.toHaveBeenCalled();
    expect(input().value).toBe("4");
    typeAndLeave("");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("does not report a draft that settles on the value it already holds", () => {
    const onChange = vi.fn();
    render(<NumberField label="Seats" value={4} onChange={onChange} />);
    typeAndLeave("4.0");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls the caller's own blur after it commits", () => {
    const onBlur = vi.fn();
    render(<NumberField label="Seats" onBlur={onBlur} />);
    typeAndLeave("2");
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("steps by step within the bounds, without float drift", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <NumberField label="Dose" value={0.2} step={0.1} maxValue={0.35} onChange={onChange} />,
    );
    fireEvent.click(increase());
    expect(onChange).toHaveBeenLastCalledWith(0.3);
    rerender(
      <NumberField label="Dose" value={0.3} step={0.1} maxValue={0.35} onChange={onChange} />,
    );
    fireEvent.click(increase());
    expect(onChange).toHaveBeenLastCalledWith(0.35);
    fireEvent.click(decrease());
    expect(onChange).toHaveBeenLastCalledWith(0.2);
  });

  it("steps from the nearer bound, or 0, when the field is empty", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <NumberField label="Seats" value={null} minValue={2} maxValue={9} onChange={onChange} />,
    );
    fireEvent.click(increase());
    expect(onChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(decrease());
    expect(onChange).toHaveBeenLastCalledWith(9);
    rerender(<NumberField label="Seats" value={null} onChange={onChange} />);
    fireEvent.click(increase());
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("steps a percent by one point and shows it as a percent", () => {
    const onChange = vi.fn();
    render(
      <NumberField
        label="Share"
        value={0.25}
        formatOptions={{ style: "percent" }}
        onChange={onChange}
      />,
    );
    expect(input().value).toBe("25%");
    fireEvent.click(increase());
    expect(onChange).toHaveBeenLastCalledWith(0.26);
  });

  it("disables a stepper at its bound, and both while disabled or read-only", () => {
    const { rerender } = render(<NumberField label="Seats" value={9} minValue={0} maxValue={9} />);
    expect(increase().disabled).toBe(true);
    expect(decrease().disabled).toBe(false);
    rerender(<NumberField label="Seats" value={0} minValue={0} maxValue={9} />);
    expect(decrease().disabled).toBe(true);
    rerender(<NumberField label="Seats" value={4} isReadOnly />);
    expect([increase().disabled, decrease().disabled]).toEqual([true, true]);
    expect(propsOf("input")["readOnly"]).toBe(true);
    rerender(<NumberField label="Seats" value={4} isDisabled />);
    expect([increase().disabled, decrease().disabled]).toEqual([true, true]);
    expect(propsOf("group")["isDisabled"]).toBe(true);
  });

  it("hides the steppers when asked and names them by their labels", () => {
    const { rerender } = render(<NumberField label="Seats" hasSteppers={false} />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(
      <NumberField label="Seats" incrementLabel="Add one seat" decrementLabel="Remove one seat" />,
    );
    const names = screen.getAllByRole("button").map((node) => node.getAttribute("aria-label"));
    expect(names).toEqual(["Remove one seat", "Add one seat"]);
  });

  it("reads Arabic digits in an Arabic locale", () => {
    state.locale = "ar-EG";
    const onChange = vi.fn();
    render(<NumberField label="العدد" onChange={onChange} />);
    typeAndLeave("١٢");
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  it.each([
    ["ios", { minValue: 0, formatOptions: { maximumFractionDigits: 0 } }, "number-pad"],
    ["ios", { minValue: 0 }, "decimal-pad"],
    ["ios", { minValue: 0, step: 0.5, formatOptions: { maximumFractionDigits: 0 } }, "decimal-pad"],
    ["ios", { minValue: 0, formatOptions: { maximumFractionDigits: 2 } }, "decimal-pad"],
    ["ios", {}, "numbers-and-punctuation"],
    ["android", { minValue: -5 }, "numeric"],
  ] as const)("on %s with %o shows the %s keyboard", (os, props, keyboard) => {
    state.os = os;
    render(<NumberField label="Amount" {...props} />);
    expect(propsOf("input")["keyboardType"]).toBe(keyboard);
  });

  it("lets a caller's own keyboard win", () => {
    render(<NumberField label="Amount" minValue={0} keyboardType="phone-pad" />);
    expect(propsOf("input")["keyboardType"]).toBe("phone-pad");
  });

  it("keeps its own number when uncontrolled", () => {
    const onChange = vi.fn();
    render(<NumberField label="Seats" defaultValue={3} onChange={onChange} />);
    fireEvent.click(increase());
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(input().value).toBe("4");
  });

  it("hands HeroUI Native the states, names the input by a string label and keeps name off it", () => {
    render(
      <NumberField
        label="Seats"
        name="seats"
        isRequired
        isInvalid
        errorMessage="Too many"
        description="Per team"
        isFullWidth={false}
        className="mt-2"
      />,
    );
    expect(propsOf("root")).toMatchObject({
      isRequired: true,
      isInvalid: true,
      className: "self-start mt-2",
    });
    expect(propsOf("input")["accessibilityLabel"]).toBe("Seats");
    expect(propsOf("input")).not.toHaveProperty("name");
    expect(screen.getByTestId("error").textContent).toBe("Too many");
    expect(propsOf("description")["hideOnInvalid"]).toBe(true);
  });

  it("extends its contract and refuses the names the contract replaces", () => {
    expectTypeOf<NumberFieldProps>().toExtend<NumberFieldContractProps>();
    // @ts-expect-error the contract's `onChange` replaces `onChangeText`
    void (<NumberField label="x" onChangeText={() => {}} />);
    // @ts-expect-error `isReadOnly` replaces `editable`
    void (<NumberField label="x" editable={false} />);
  });
});
