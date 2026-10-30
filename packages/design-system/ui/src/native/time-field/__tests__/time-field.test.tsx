/**
 * Stackra file contract:
 * Purpose: proves the native TimeField and its PickerField: a button named by the label that says the time in the
 *          locale (or "empty"), opens a modal with the wheel (from the field or its clock button), and on done reports
 *          the wheel's time (09:00 when nothing was set) and keeps it when uncontrolled; cancel keeps the old time;
 *          disabled and read-only never open; the open state can be owned; the hour cycle reaches the format and wheel.
 * Boundary: React Native and heroui-native do not render in vitest, so they and the house Modal, Button, IconButton
 *           and WheelTimePicker are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { TimeField } from "#native/time-field/time-field";

const state = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Pressable: (props: Record<string, unknown>) => {
      state.props["field"] = props;
      return createElement(
        "button",
        { type: "button", "aria-label": "field", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    state.props[name] = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    TextField: record("text-field"),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    Input: record("input"),
  };
});
vi.mock("#native/modal/modal", async () => {
  const { createElement } = await import("react");
  const pass = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  return {
    Modal: Object.assign(
      (props: Record<string, unknown>) => {
        state.props["modal"] = props;
        return pass(props);
      },
      { Header: pass, Title: pass, Body: pass, Footer: pass },
    ),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      state.props["icon-button"] = props;
      return createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        onClick: props["onPress"] as () => void,
      });
    },
  };
});
vi.mock("#native/wheel-picker/wheel-time-picker", () => ({
  WheelTimePicker: (props: Record<string, unknown>) => {
    state.props["wheel"] = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const within = (node: ReactNode) =>
  render(
    <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
      {node}
    </DesignSystemContext>,
  );
const propsOf = (name: string) => state.props[name] ?? {};
const open = () => fireEvent.click(screen.getByLabelText("field"));
const done = () => fireEvent.click(screen.getByText("ui::date_field.done"));
const turn = (hour: number, minute: number) =>
  act(() => (propsOf("wheel")["onChange"] as (next: unknown) => void)({ hour, minute }));

beforeEach(() => {
  state.props = {};
});

describe("TimeField (native)", () => {
  it("says empty, opens on press and reports 09:00 when done untouched", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    within(<TimeField label="Start" onChange={onChange} onOpenChange={onOpenChange} />);
    expect(propsOf("field")).toMatchObject({
      accessibilityLabel: "Start",
      accessibilityValue: { text: "ui::date_field.empty" },
      accessibilityState: { disabled: false, expanded: false },
    });
    expect(propsOf("wheel")).toEqual({});
    open();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(propsOf("modal")).toMatchObject({ isOpen: true, label: "Start" });
    expect(propsOf("wheel")).toMatchObject({ value: { hour: 9, minute: 0 }, minuteStep: 1 });
    done();
    expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 0 });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(propsOf("input")["value"]).toBe("9:00 AM");
  });

  it("reports the turned wheel and keeps the old time on cancel", () => {
    const onChange = vi.fn();
    within(<TimeField label="Start" defaultValue={{ hour: 14, minute: 30 }} onChange={onChange} />);
    expect(propsOf("input")["value"]).toBe("2:30 PM");
    open();
    turn(8, 15);
    fireEvent.click(screen.getByText("ui::date_field.cancel"));
    expect(onChange).not.toHaveBeenCalled();
    expect(propsOf("input")["value"]).toBe("2:30 PM");
    open();
    expect(propsOf("wheel")["value"]).toEqual({ hour: 14, minute: 30 });
    turn(8, 15);
    done();
    expect(onChange).toHaveBeenCalledWith({ hour: 8, minute: 15 });
    expect(propsOf("input")["value"]).toBe("8:15 AM");
  });

  it("shows the owner's time in a 24-hour cycle from the clock button", () => {
    const onChange = vi.fn();
    within(
      <TimeField
        label="Start"
        value={{ hour: 14, minute: 5 }}
        hourCycle={24}
        onChange={onChange}
        pickerButtonLabel="Pick"
        minuteStep={15}
      />,
    );
    expect(propsOf("input")["value"]).toBe("14:05");
    fireEvent.click(screen.getByLabelText("Pick"));
    expect(propsOf("wheel")).toMatchObject({ hourCycle: 24, minuteStep: 15 });
    turn(7, 0);
    done();
    expect(onChange).toHaveBeenCalledWith({ hour: 7, minute: 0 });
    expect(propsOf("input")["value"]).toBe("14:05");
  });

  it("never opens while disabled or read-only, and shows the help and error", () => {
    within(
      <TimeField
        label="Start"
        isDisabled
        defaultOpen
        description="Help"
        errorMessage="Bad"
        isInvalid
        pickerButtonLabel="Pick"
        isFullWidth={false}
      />,
    );
    expect(propsOf("modal")["isOpen"]).toBe(false);
    open();
    expect(propsOf("modal")["isOpen"]).toBe(false);
    expect(propsOf("icon-button")["isDisabled"]).toBe(true);
    expect(propsOf("description")["children"]).toBe("Help");
    expect(propsOf("error")["children"]).toBe("Bad");
    expect(propsOf("text-field")["className"]).toBe("self-start");
  });

  it("follows an owned open state and names itself by accessibilityLabel", () => {
    const onOpenChange = vi.fn();
    within(
      <TimeField
        label={<b>Rich</b>}
        accessibilityLabel="Start time"
        isOpen
        onOpenChange={onOpenChange}
        isReadOnly={false}
      />,
    );
    expect(propsOf("modal")).toMatchObject({ isOpen: true, label: "Start time" });
    fireEvent.click(screen.getByText("ui::date_field.cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(propsOf("modal")["isOpen"]).toBe(true);
  });

  it("has no name without a text label", () => {
    within(<TimeField isReadOnly />);
    expect(propsOf("field")["accessibilityLabel"]).toBeUndefined();
    open();
    expect(propsOf("modal")["isOpen"]).toBe(false);
  });
});
