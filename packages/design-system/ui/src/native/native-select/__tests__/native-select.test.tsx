/**
 * Stackra file contract:
 * Purpose: proves the native NativeSelect: off iOS it hands the house Select its props with the dialog presentation;
 *          on iOS it is a button that says the chosen label (or placeholder) and opens the action sheet of the enabled
 *          items plus cancel, titled by a text label; a pick plays a selection haptic, reports the id and is kept
 *          when uncontrolled; cancel does nothing; disabled and read-only never open; the error and description show.
 * Boundary: React Native and heroui-native do not render in vitest, so they and the house Select and Icon are
 *           recording stand-ins that render plain DOM; `Platform.OS` is switched per test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { NativeSelect } from "#native/native-select/native-select";

const state = vi.hoisted(() => ({
  os: "ios",
  props: {} as Record<string, Record<string, unknown>>,
  sheets: [] as { options: Record<string, unknown>; pick: (index: number) => void }[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    Platform: {
      get OS() {
        return state.os;
      },
    },
    ActionSheetIOS: {
      showActionSheetWithOptions: (options: Record<string, unknown>, pick: (i: number) => void) =>
        state.sheets.push({ options, pick }),
    },
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Pressable: (props: Record<string, unknown>) => {
      state.props["button"] = props;
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
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
    TextField: record("field"),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    Input: record("input"),
  };
});
vi.mock("#native/select/select", () => ({
  Select: (props: Record<string, unknown>) => {
    state.props["select"] = props;
    return null;
  },
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const ITEMS = [
  { id: "a", label: "Apple" },
  { id: "b", label: "Banana", isDisabled: true },
  { id: "c", label: "Cherry" },
];
const propsOf = (name: string) => state.props[name] ?? {};
const press = () => fireEvent.click(screen.getByRole("button"));

beforeEach(() => {
  state.os = "ios";
  state.props = {};
  state.sheets.length = 0;
  state.played.length = 0;
});

describe("NativeSelect (native)", () => {
  it("hands the house Select a dialog off iOS, dropping its own name props", () => {
    state.os = "android";
    render(
      <NativeSelect items={ITEMS} label="Fruit" name="fruit" accessibilityLabel="Pick fruit" />,
    );
    expect(propsOf("select")).toMatchObject({
      items: ITEMS,
      label: "Fruit",
      presentation: "dialog",
      accessibilityLabel: "Pick fruit",
    });
    expect(propsOf("select")).not.toHaveProperty("name");
  });

  it("leaves accessibilityLabel off the Select when not given", () => {
    state.os = "android";
    render(<NativeSelect items={ITEMS} label="Fruit" />);
    expect(propsOf("select")).not.toHaveProperty("accessibilityLabel");
  });

  it("is a button named by the label that says the placeholder until a pick", () => {
    render(<NativeSelect items={ITEMS} label="Fruit" placeholder="Choose" />);
    expect(propsOf("button")).toMatchObject({
      accessibilityRole: "button",
      accessibilityLabel: "Fruit",
      accessibilityValue: { text: "Choose" },
    });
    expect(propsOf("input")).toMatchObject({ value: "", placeholder: "Choose", editable: false });
    expect(propsOf("label")["children"]).toBe("Fruit");
  });

  it("opens the sheet of enabled items, keeps a pick and reports it", () => {
    const onChange = vi.fn();
    render(<NativeSelect items={ITEMS} label="Fruit" onChange={onChange} />);
    press();
    expect(state.sheets[0]?.options).toEqual({
      options: ["Apple", "Cherry", "ui::date_field.cancel"],
      cancelButtonIndex: 2,
      title: "Fruit",
    });
    act(() => state.sheets[0]?.pick(1));
    expect(onChange).toHaveBeenCalledWith("c");
    expect(state.played).toEqual(["selection"]);
    expect(propsOf("button")["accessibilityValue"]).toEqual({ text: "Cherry" });
    act(() => state.sheets[0]?.pick(2));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("shows the owner's value and keeps it on a pick", () => {
    const onChange = vi.fn();
    render(
      <NativeSelect
        items={ITEMS}
        label={<b>Rich</b>}
        accessibilityLabel="Fruit"
        value="a"
        onChange={onChange}
        isFullWidth={false}
        className="x"
      />,
    );
    expect(propsOf("button")["accessibilityLabel"]).toBe("Fruit");
    press();
    expect(state.sheets[0]?.options).not.toHaveProperty("title");
    act(() => state.sheets[0]?.pick(1));
    expect(onChange).toHaveBeenCalledWith("c");
    expect(propsOf("input")["value"]).toBe("Apple");
    expect(propsOf("field")["className"]).toBe("self-start x");
  });

  it("starts from defaultValue and never opens while disabled or read-only", () => {
    const { unmount } = render(
      <NativeSelect
        items={ITEMS}
        defaultValue="c"
        isDisabled
        isInvalid
        errorMessage="Bad"
        description="Help"
      />,
    );
    expect(propsOf("input")["value"]).toBe("Cherry");
    expect(propsOf("button")).toMatchObject({ disabled: true, accessibilityLabel: undefined });
    expect(propsOf("error")["children"]).toBe("Bad");
    expect(propsOf("description")["children"]).toBe("Help");
    press();
    unmount();
    render(<NativeSelect items={ITEMS} isReadOnly />);
    press();
    expect(state.sheets).toHaveLength(0);
  });
});
