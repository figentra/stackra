/**
 * Stackra file contract:
 * Purpose: proves the native DateField shows its day as the locale writes it, opens Android's dialog on a press and
 *          reports the day it returns, opens iOS's inline calendar in a dialog (not a sheet) whose Done reports the day
 *          shown, today included, and whose Cancel reports nothing; refuses an unavailable day with a message and an
 *          announcement (the iOS dialog stays open); passes the bounds at local noon and opens an empty field on today
 *          kept inside them; closes on Android's dismissal; stays shut while disabled or read-only, announcing only
 *          disabled as disabled; has no calendar button; keeps its own day when uncontrolled; reports the same local
 *          day in any time zone; and hands HeroUI Native the field's states and the picker its locale, scheme and
 *          accent.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native, `@expo/ui`'s picker, the provider,
 *           the Modal, Button, Text and IconButton are replaced by stand-ins that render plain DOM; what reaches them is
 *           checked.
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
  announced: [] as string[],
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
    AccessibilityInfo: {
      announceForAccessibility: (text: string) => state.announced.push(text),
    },
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

vi.mock("#native/modal/modal", async () => {
  const { createElement: h } = await import("react");
  const part =
    (name: string) =>
    ({ children }: { readonly children?: ReactNode }) =>
      h("div", { "data-testid": name }, children);
  return {
    Modal: Object.assign(
      (props: { readonly isOpen: boolean; readonly children?: ReactNode }) => {
        state.props["modal"] = props as unknown as Record<string, unknown>;
        return props.isOpen ? h("div", { "data-testid": "modal" }, props.children) : null;
      },
      {
        Header: part("modal-header"),
        Title: part("modal-title"),
        Body: part("modal-body"),
        Footer: part("modal-footer"),
      },
    ),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement: h } = await import("react");
  return {
    Button: (props: { readonly children: string; readonly onPress: () => void }) =>
      h("button", { onClick: props.onPress }, props.children),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement: h } = await import("react");
  return {
    Text: (props: { readonly children?: ReactNode }) => {
      state.props["text"] = props as Record<string, unknown>;
      return h("span", { "data-testid": "message" }, props.children);
    },
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

/** Moves the open picker to `date`, as the platform reports it. */
const pickDate = (date: Date) =>
  act(() => (propsOf("picker")["onValueChange"] as (event: unknown, date: Date) => void)({}, date));

const isSunday = (date: CalendarDate) => date.toDate("UTC").getUTCDay() === 0;

describe("DateField (native)", () => {
  beforeEach(() => {
    state.props = {};
    state.os = "android";
    state.announced = [];
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

  it("opens Android's dialog on a press, reports the day it returns and closes", () => {
    const onChange = vi.fn();
    render(<DateField label="Due" value={day("2026-10-24")} onChange={onChange} />);
    expect(screen.queryByTestId("picker")).toBeNull();
    fireEvent.click(field());
    expect(screen.queryByTestId("modal")).toBeNull();
    expect(propsOf("pressable")["accessibilityState"]).toMatchObject({ expanded: true });
    pickDate(new Date(2026, 4, 3, 0, 5));
    expect(onChange).toHaveBeenCalledWith(day("2026-05-03"));
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("closes without a report when the same day comes back", () => {
    const onChange = vi.fn();
    render(<DateField label="Due" value={day("2026-10-24")} onChange={onChange} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 24, 18));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("opens iOS's inline calendar in a dialog, titled by the label, and reports the day on Done", () => {
    state.os = "ios";
    const onChange = vi.fn();
    render(<DateField label="Due" value={day("2026-10-24")} onChange={onChange} />);
    fireEvent.click(field());
    expect(screen.getByTestId("modal-body").contains(screen.getByTestId("picker"))).toBe(true);
    expect(screen.getByTestId("modal-title").textContent).toBe("Due");
    expect(propsOf("picker")["display"]).toBe("inline");
    pickDate(new Date(2026, 10, 2, 12));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenCalledWith(day("2026-11-02"));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("lets iOS pick the day the calendar opens on, today for an empty field", () => {
    state.os = "ios";
    const onChange = vi.fn();
    render(<DateField label="Due" onChange={onChange} />);
    fireEvent.click(field());
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    const today = new Date();
    expect(onChange).toHaveBeenCalledWith(
      new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()),
    );
  });

  it("reports nothing on iOS's Cancel", () => {
    state.os = "ios";
    const onChange = vi.fn();
    render(<DateField label="Due" onChange={onChange} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 10, 2, 12));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("refuses an unavailable day on iOS, says why and keeps the dialog open", () => {
    state.os = "ios";
    const onChange = vi.fn();
    render(<DateField label="Due" isDateUnavailable={isSunday} onChange={onChange} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 25, 12));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("modal")).toBeTruthy();
    // Inside the dialog, which covers the field while it is open.
    expect(screen.getByTestId("modal-body").contains(screen.getByTestId("message"))).toBe(true);
    expect(screen.getAllByTestId("message")).toHaveLength(1);
    expect(screen.getByTestId("message").textContent).toBe(
      "That day is not available. Choose another.",
    );
    expect(state.announced).toEqual(["That day is not available. Choose another."]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("message")).toBeNull();
  });

  it("refuses an unavailable day on Android, says why, and clears the message on a good day", () => {
    const onChange = vi.fn();
    render(<DateField label="Due" isDateUnavailable={isSunday} onChange={onChange} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 25, 12));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("picker")).toBeNull();
    expect(propsOf("text")["accessibilityLiveRegion"]).toBe("polite");
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 26, 12));
    expect(onChange).toHaveBeenCalledWith(day("2026-10-26"));
    expect(screen.queryByTestId("message")).toBeNull();
  });

  it("clears the refusal when the picker opens again", () => {
    render(<DateField label="Due" isDateUnavailable={isSunday} />);
    fireEvent.click(field());
    pickDate(new Date(2026, 9, 25, 12));
    expect(screen.getByTestId("message")).toBeTruthy();
    fireEvent.click(field());
    expect(screen.queryByTestId("message")).toBeNull();
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

  it.each([
    [{ isDisabled: true }, true],
    [{ isReadOnly: true }, false],
  ])("stays shut while %o, announced as disabled: %s", (locked, isAnnouncedDisabled) => {
    render(<DateField label="Due" {...locked} />);
    // Pressable writes `disabled` over the announced state, so only a disabled field sets it.
    expect(propsOf("pressable")).toMatchObject({
      disabled: isAnnouncedDisabled,
      accessibilityState: { disabled: isAnnouncedDisabled },
    });
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

  it.each(["Pacific/Kiritimati", "Pacific/Pago_Pago", "America/New_York"])(
    "reports the day the platform shows in %s",
    (zone) => {
      const saved = process.env["TZ"];
      process.env["TZ"] = zone;
      try {
        const onChange = vi.fn();
        render(<DateField label="Due" value={day("2026-03-07")} onChange={onChange} />);
        fireEvent.click(field());
        expect(propsOf("picker")["value"]).toEqual(new Date(2026, 2, 7, 12));
        pickDate(new Date(2026, 2, 8, 0, 30));
        expect(onChange).toHaveBeenCalledWith(day("2026-03-08"));
      } finally {
        // Assigning `undefined` would store the string "undefined", so an unset zone is deleted.
        if (saved === undefined) delete process.env["TZ"];
        else process.env["TZ"] = saved;
      }
    },
  );

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
