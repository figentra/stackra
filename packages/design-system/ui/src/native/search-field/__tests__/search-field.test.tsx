/**
 * Stackra file contract:
 * Purpose: proves the native SearchField hands HeroUI Native the contract's props (states on the root, placeholder,
 *          surface, read-only and name on the input), keeps its own text when uncontrolled and follows `value` when
 *          controlled, submits the text from the keyboard's search key, names and wires the clear button, leaves the
 *          clear button out of a disabled or read-only field, swaps the icon for a spinner and marks the input busy
 *          while loading, composes the label, description and error message, and keeps `name` off the view.
 * Boundary: React Native does not render in vitest, so heroui-native and the spinner are replaced by recording
 *          stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-073
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { SearchFieldContractProps } from "#contracts/types/search-field-contract-props.type";
import { SearchField, type SearchFieldProps } from "#native/search-field/search-field";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    SearchField: Object.assign(record("root"), {
      Group: record("group"),
      SearchIcon: record("icon"),
      Input: record("input"),
      ClearButton: record("clear"),
    }),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    cn: (...names: (string | undefined)[]) => names.filter(Boolean).join(" "),
  };
});

vi.mock("#native/spinner/spinner", async () => {
  const { createElement } = await import("react");
  return {
    Spinner: (props: Record<string, unknown>) => {
      received.props["spinner"] = props;
      return createElement("div", { "data-testid": "spinner" });
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const has = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-testid="${name}"]`) !== null;

describe("SearchField (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands the root the states and the input the placeholder, surface and name", () => {
    render(
      <SearchField
        isRequired
        isInvalid
        isDisabled
        placeholder="Order number"
        variant="secondary"
        accessibilityLabel="Find an order"
        name="q"
      />,
    );
    expect(propsOf("root")).toMatchObject({ isRequired: true, isInvalid: true, isDisabled: true });
    expect(propsOf("input")).toMatchObject({
      placeholder: "Order number",
      variant: "secondary",
      accessibilityLabel: "Find an order",
    });
    expect(propsOf("root")).not.toHaveProperty("name");
    expect(propsOf("root")).not.toHaveProperty("accessibilityLabel");
  });

  it("passes unknown props through to the root", () => {
    render(<SearchField testID="orders-search" />);
    expect(propsOf("root")["testID"]).toBe("orders-search");
  });

  it("keeps its own text when uncontrolled and reports each change", () => {
    const onChange = vi.fn();
    render(<SearchField defaultValue="ab" onChange={onChange} />);
    expect(propsOf("root")["value"]).toBe("ab");
    act(() => (propsOf("root")["onChange"] as (value: string) => void)("abc"));
    expect(onChange).toHaveBeenLastCalledWith("abc");
    expect(propsOf("root")["value"]).toBe("abc");
  });

  it("follows `value` when controlled and leaves the text to the caller", () => {
    const onChange = vi.fn();
    render(<SearchField value="fixed" onChange={onChange} />);
    act(() => (propsOf("root")["onChange"] as (value: string) => void)("other"));
    expect(onChange).toHaveBeenLastCalledWith("other");
    expect(propsOf("root")["value"]).toBe("fixed");
  });

  it("submits the current text from the keyboard's search key", () => {
    const onSubmit = vi.fn();
    render(<SearchField defaultValue="abc" onSubmit={onSubmit} />);
    (propsOf("input")["onSubmitEditing"] as () => void)();
    expect(onSubmit).toHaveBeenCalledWith("abc");
  });

  it("names the clear button by clearLabel and tells onClear it was pressed", () => {
    const onClear = vi.fn();
    render(<SearchField clearLabel="Clear the order search" onClear={onClear} />);
    expect(propsOf("clear")["accessibilityLabel"]).toBe("Clear the order search");
    (propsOf("clear")["onPress"] as () => void)();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("leaves HeroUI's own clear name alone when no clearLabel is given", () => {
    render(<SearchField />);
    expect(propsOf("clear")).not.toHaveProperty("accessibilityLabel");
  });

  it("makes the input read-only and draws no clear button when read-only or disabled", () => {
    const { container, rerender } = render(<SearchField isReadOnly />);
    expect(propsOf("input")["readOnly"]).toBe(true);
    expect(has(container, "clear")).toBe(false);
    rerender(<SearchField isDisabled />);
    expect(has(container, "clear")).toBe(false);
    rerender(<SearchField />);
    expect(propsOf("input")["readOnly"]).toBe(false);
    expect(has(container, "clear")).toBe(true);
  });

  it("swaps the icon for a spinner and marks the input busy while loading", () => {
    const { container, rerender } = render(<SearchField />);
    expect(has(container, "spinner")).toBe(false);
    expect(propsOf("input")).not.toHaveProperty("accessibilityState");
    rerender(<SearchField isLoading isDisabled />);
    expect(has(container, "spinner")).toBe(true);
    expect(propsOf("spinner")).toMatchObject({ size: "sm", tone: "muted" });
    expect(propsOf("input")["accessibilityState"]).toEqual({ busy: true, disabled: true });
  });

  it("composes the label, the description and the error message only when given", () => {
    const { container, rerender } = render(<SearchField />);
    for (const name of ["label", "description", "error"]) expect(has(container, name)).toBe(false);
    rerender(<SearchField label="Orders" description="By number" errorMessage="Too short" />);
    expect(container.querySelector('[data-testid="label"]')?.textContent).toBe("Orders");
    expect(container.querySelector('[data-testid="description"]')?.textContent).toBe("By number");
    expect(propsOf("description")["hideOnInvalid"]).toBe(true);
    expect(container.querySelector('[data-testid="error"]')?.textContent).toBe("Too short");
  });

  it("fills the width on request and keeps the caller's class", () => {
    const { rerender } = render(<SearchField className="mt-2" />);
    expect(propsOf("root")["className"]).toBe("mt-2");
    rerender(<SearchField isFullWidth className="mt-2" />);
    expect(propsOf("root")["className"]).toBe("w-full mt-2");
  });

  it("takes the contract's props", () => {
    expectTypeOf<SearchFieldProps>().toExtend<SearchFieldContractProps>();
    expectTypeOf<SearchFieldProps["onChange"]>().toEqualTypeOf<
      ((value: string) => void) | undefined
    >();
  });
});
