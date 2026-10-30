/**
 * Stackra file contract:
 * Purpose: proves the native PhoneField: the country button says the country and dial code and opens a drawer of
 *          countries that a search narrows (Arabic digits read as Latin, an empty note when none match); picking one
 *          reports the number in the new country; typing reports `{ country, national, e164 }` (or null when empty)
 *          with the digits kept left to right; it holds its own value or shows the owner's; locked when disabled or
 *          read-only; the label marks required and the error shows only when invalid.
 * Boundary: React Native does not render in vitest, so it and the house Text, Icon, Drawer and SearchField are
 *           recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060;
 *          WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { PhoneField } from "#native/phone-field/phone-field";
import type { PhoneFieldProps } from "#native/phone-field/phone-field.props";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  views: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          "aria-pressed": (props["accessibilityState"] as { selected?: boolean }).selected,
          disabled: props["disabled"] as boolean,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
    TextInput: (props: Record<string, unknown>) => {
      state.props["input"] = props;
      return null;
    },
    FlatList: (props: {
      data: { code: string }[];
      renderItem: (info: { item: unknown }) => ReactNode;
      ListEmptyComponent: ReactNode;
    }) =>
      createElement(
        "ul",
        null,
        props.data.length === 0
          ? props.ListEmptyComponent
          : props.data.map((item) =>
              createElement("li", { key: item.code }, props.renderItem({ item })),
            ),
      ),
  };
});
vi.mock("heroui-native", () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/search-field/search-field", () => ({
  SearchField: (props: Record<string, unknown>) => {
    state.props["search"] = props;
    return null;
  },
}));
vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const pass = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  return {
    Drawer: Object.assign(
      (props: Record<string, unknown>) => {
        state.props["drawer"] = props;
        return props["isOpen"] ? pass(props) : null;
      },
      { Header: pass, Title: pass, Body: pass, Close: () => null },
    ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const within = (props: Partial<PhoneFieldProps> = {}) =>
  render(
    <DesignSystemContext value={{ locale: "en", direction: "ltr" } as DesignSystemState}>
      <PhoneField label="Phone" countries={["SA", "AE", "EG"]} {...props} />
    </DesignSystemContext>,
  );
const propsOf = (name: string) => state.props[name] ?? {};
const type = (text: string) =>
  act(() => (propsOf("input")["onChangeText"] as (next: string) => void)(text));
const search = (text: string) =>
  act(() => (propsOf("search")["onChange"] as (next: string) => void)(text));

beforeEach(() => {
  state.props = {};
  state.views.length = 0;
});

describe("PhoneField (native)", () => {
  it("says the default country and its dial code, and keeps the digits left to right", () => {
    within({ isRequired: true });
    expect(
      screen.getByLabelText('ui::phone_field.selected {"country":"Saudi Arabia","code":"+966"}'),
    ).toBeTruthy();
    expect(screen.getByText("Phone *")).toBeTruthy();
    expect(propsOf("input")).toMatchObject({
      accessibilityLabel: "Phone",
      value: "",
      editable: true,
      keyboardType: "phone-pad",
      style: { writingDirection: "ltr", textAlign: "left" },
    });
  });

  it("reports the typed number in its country and null when emptied", () => {
    const onChange = vi.fn();
    within({ onChange });
    type("0501234567");
    expect(onChange).toHaveBeenLastCalledWith({
      country: "SA",
      national: "501234567",
      e164: "+966501234567",
    });
    expect(propsOf("input")["value"]).toBe("0501234567");
    type("");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("opens the countries, narrows them by search and picks one", () => {
    const onChange = vi.fn();
    within({ onChange, defaultValue: { country: "SA", national: "501", e164: "+966501" } });
    fireEvent.click(screen.getByLabelText(/Saudi Arabia/));
    expect(propsOf("drawer")["isOpen"]).toBe(true);
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    search("٩٧١");
    expect(screen.getByText("United Arab Emirates")).toBeTruthy();
    expect(screen.queryByText("Egypt")).toBeNull();
    fireEvent.click(screen.getByLabelText(/United Arab Emirates/));
    expect(onChange).toHaveBeenLastCalledWith({
      country: "AE",
      national: "501",
      e164: "+971501",
    });
    expect(propsOf("drawer")["isOpen"]).toBe(false);
    expect(screen.getByLabelText(/United Arab Emirates/)).toBeTruthy();
  });

  it("says when no country matches and clears the search when the drawer closes", () => {
    within();
    fireEvent.click(screen.getByLabelText(/Saudi Arabia/));
    search("zzz");
    expect(screen.getByText("ui::phone_field.empty")).toBeTruthy();
    act(() => (propsOf("drawer")["onOpenChange"] as (next: boolean) => void)(false));
    fireEvent.click(screen.getByLabelText(/Saudi Arabia/));
    expect(propsOf("search")["value"]).toBe("");
    act(() => (propsOf("drawer")["onOpenChange"] as (next: boolean) => void)(true));
    expect(propsOf("drawer")["isOpen"]).toBe(true);
  });

  it("shows the owner's value and locks when disabled, showing the error only when invalid", () => {
    within({
      value: { country: "EG", national: "100", e164: "+20100" },
      isDisabled: true,
      isInvalid: true,
      errorMessage: "Wrong",
      description: "Mobile",
      label: <b>Rich</b>,
    });
    expect(propsOf("input")).toMatchObject({
      value: "100",
      editable: false,
      accessibilityLabel: "ui::phone_field.number",
    });
    expect((screen.getByLabelText(/Egypt/) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Wrong")).toBeTruthy();
    expect(screen.getByText("Mobile")).toBeTruthy();
    expect(state.views.some((view) => String(view["className"]).includes("border-danger"))).toBe(
      true,
    );
  });

  it("shows nothing for a cleared owner value and hides the error while valid", () => {
    within({ value: null, isReadOnly: true, errorMessage: "Wrong", label: null });
    expect(propsOf("input")).toMatchObject({ value: "", editable: false });
    expect(screen.queryByText("Wrong")).toBeNull();
  });

  it("names an unknown default country by its code", () => {
    within({ defaultCountry: "ZZ" });
    expect(
      screen.getByLabelText('ui::phone_field.selected {"country":"ZZ","code":""}'),
    ).toBeTruthy();
  });
});
