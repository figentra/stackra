/**
 * Stackra file contract:
 * Purpose: proves the native DateField shows its day as the locale writes it, opens the platform picker when pressed
 *          (Android's dialog on its own, iOS's inline calendar inside the inset sheet), reports the picked day as the
 *          local `CalendarDate` and closes, refuses an unavailable day, passes the bounds at local noon and opens an
 *          empty field on today kept inside them, closes on Android's dismissal, stays shut while disabled or
 *          read-only, has no calendar button, keeps its own day when uncontrolled, and hands HeroUI Native the field's
 *          states and the picker its locale, scheme and accent.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native, `@expo/ui`'s picker, the provider,
 *           the Drawer and the IconButton are replaced by stand-ins that render plain DOM; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decision 8); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-206
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DateValueContractProps } from "#contracts/types/date-value-contract-props.type";
import { DateField, type DateFieldProps } from "#native/date-field/date-field";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  os: "android",
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
    Input: (props: Record<string, unknown>) => {
      state.props["input"] = props;
      return h("input", {
        "data-testid": "input",
        value: props["value"] as string,
        readOnly: true,
      });
    },
    useThemeColor: (name: string) => `color:${name}`,
  };
});

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    Platform: {
      get OS() {
        return state.os;
      },
    },
    View: ({ children }: { readonly children?: ReactNode }) => h("div", null, children),
    Pressable: (props: Record<string, unknown>) => {
      state.props["pressable"] = props;
      return h(
        "button",
        {
          "data-testid": "field",
          disabled: props["disabled"] as boolean,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      );
    },
  };
});

vi.mock("@expo/ui/community/datetime-picker", async () => {
  const { createElement: h } = await import("react");
  return {
    DateTimePicker: (props: Record<string, unknown>) => {
      state.props["picker"] = props;
      return h("div", { "data-testid": "picker" });
    },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en-US", resolvedColorScheme: "dark" }),
}));

vi.mock("#native/drawer/drawer", async () => {
  const { createElement: h } = await import("react");
  const part =
    (name: string) =>
    ({ children }: { readonly children?: ReactNode }) =>
      h("div", { "data-testid": name }, children);
  return {
    Drawer: Object.assign(
      (props: Record<string, unknown>) => {
        state.props["drawer"] = props;
        return h("div", { "data-testid": "drawer" }, props["children"] as ReactNode);
      },
      {
        Header: part("drawer-header"),
        Title: part("drawer-title"),
        Body: part("drawer-body"),
        Close: ({ label }: { readonly label: string }) => h("button", { "aria-label": label }),
      },
    ),
  };
});

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement: h } = await import("react");
  return {
    IconButton: (props: { readonly label: string; readonly onPress?: () => void }) =>
      h("button", { "aria-label": props.label, onClick: props.onPress }),
  };
});

const propsOf = (name: string) => state.props[name] ?? {};
const field = () => screen.getByTestId("field");
const day = (text: string) => {
  const [year, month, date] = text.split("-").map(Number) as [number, number, number];
  return new CalendarDate(year, month, date);
};

/** Picks `date` in the open picker, as the platform reports it. */
const pickDate = (date: Date) =>
  act(() => (propsOf("picker")["onValueChange"] as (event: unknown, date: Date) => void)({}, date));

describe("DateField (native)", () => {
  beforeEach(() => {
    state.props = {};
    state.os = "android";
  });

  it("shows the day as the locale writes it, and the empty word for no day", () => {
    const { rerender } = render(<DateField label="Due" value={day("2026-10-24")} />);
    expect(propsOf("input")).toMatchObject({ value: "Oct 24, 2026", editable: false });
    expect(propsOf("pressable")).toMatchObject({
      accessibilityRole: "button",
      accessibilityLabel: "Due",
      accessibilityValue: { text: "Oct 24, 2026" },
    });
    rerender(<DateField label="Due" value={null} />);
    expect(propsOf("input")).toMatchObject({ value: "", placeholder: "Select a date" });
    expect(propsOf("pressable")["accessibilityValue"]).toEqual({ text: "Select a date" });
  });

  it("opens Android's dialog on its own when pressed", () => {
    render(<DateField label="Due" />);
    expect(screen.queryByTestId("picker")).toBeNull();
    fireEvent.click(field());
    expect(screen.getByTestId("picker")).toBeTruthy();
    expect(screen.queryByTestId("drawer")).toBeNull();
    expect(propsOf("pressable")["accessibilityState"]).toMatchObject({ expanded: true });
  });

  it("opens iOS's inline calendar inside the inset sheet, titled by the label", () => {
    state.os = "ios";
    render(<DateField label="Due" />);
    fireEvent.click(field());
    expect(screen.getByTestId("drawer-body").contains(screen.getByTestId("picker"))).toBe(true);
    expect(screen.getByTestId("drawer-title").textContent).toBe("Due");
    expect(propsOf("drawer")).toMatchObject({ isOpen: true, label: "Due" });
    expect(propsOf("picker")["display"]).toBe("inline");
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("reports the picked local day and closes", () => {
    const onChange = vi.fn();
    render(<DateField label="Due" value={day("2026-10-24")} onChange={onChange} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 4, 3, 0, 5));
    expect(onChange).toHaveBeenCalledWith(day("2026-05-03"));
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("closes without a report when the same day is picked", () => {
    const onChange = vi.fn();
    render(<DateField label="Due" value={day("2026-10-24")} onChange={onChange} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 24, 18));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("refuses an unavailable day: iOS keeps the calendar open, Android's dialog has closed", () => {
    const onChange = vi.fn();
    const isSunday = (date: CalendarDate) => date.toDate("UTC").getUTCDay() === 0;
    state.os = "ios";
    const { unmount } = render(
      <DateField label="Due" isDateUnavailable={isSunday} onChange={onChange} />,
    );
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 25, 12));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("picker")).toBeTruthy();
    unmount();
    state.os = "android";
    render(<DateField label="Due" isDateUnavailable={isSunday} onChange={onChange} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 25, 12));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("passes the bounds at local noon and opens an empty field on today kept inside them", () => {
    render(<DateField label="Due" minValue={day("2999-01-01")} maxValue={day("2999-12-31")} />);
    fireEvent.click(field());
    expect(propsOf("picker")).toMatchObject({
      minimumDate: new Date(2999, 0, 1, 12),
      maximumDate: new Date(2999, 11, 31, 12),
      value: new Date(2999, 0, 1, 12),
    });
  });

  it("closes on Android's dismissal without a report", () => {
    const onChange = vi.fn();
    render(<DateField label="Due" onChange={onChange} />);
    fireEvent.click(field());
    act(() => (propsOf("picker")["onDismiss"] as () => void)());
    expect(screen.queryByTestId("picker")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([{ isDisabled: true }, { isReadOnly: true }])("stays shut while %o", (locked) => {
    render(<DateField label="Due" {...locked} />);
    expect(propsOf("pressable")).toMatchObject({ disabled: true });
    fireEvent.click(field());
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("has no calendar button", () => {
    render(<DateField label="Due" />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("keeps its own day when uncontrolled", () => {
    render(<DateField label="Due" defaultValue={day("2026-10-24")} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 10, 2, 12));
    expect(propsOf("input")["value"]).toBe("Nov 2, 2026");
  });

  it("hands the picker the locale, the scheme and the accent, and lets the caller's display win", () => {
    render(<DateField label="Due" display="spinner" />);
    fireEvent.click(field());
    expect(propsOf("picker")).toMatchObject({
      locale: "en_US",
      themeVariant: "dark",
      accentColor: "color:accent",
      display: "spinner",
    });
  });

  it("hands HeroUI Native the field's states and keeps name off the input", () => {
    render(
      <DateField
        label="Due"
        name="due"
        isRequired
        isInvalid
        errorMessage="Pick a weekday"
        description="When it ships"
        isFullWidth={false}
        className="mt-2"
      />,
    );
    expect(propsOf("root")).toMatchObject({
      isRequired: true,
      isInvalid: true,
      className: "self-start mt-2",
    });
    expect(propsOf("input")).not.toHaveProperty("name");
    expect(screen.getByTestId("error").textContent).toBe("Pick a weekday");
    expect(propsOf("description")["hideOnInvalid"]).toBe(true);
  });

  it("extends its contract and leaves the open state to the DatePicker", () => {
    expectTypeOf<DateFieldProps>().toExtend<DateValueContractProps>();
    // @ts-expect-error a DateField keeps its own open state
    void (<DateField label="x" isOpen />);
  });
});
