/**
 * Stackra file contract:
 * Purpose: proves the native FilterEditor draws the editor of each kind from the filter's definition and reports a
 *          value of that kind: text from a `TextField` named by the filter, one choice from a `RadioGroup` (an unset
 *          choice shows nothing chosen), several choices from a `CheckboxGroup` in the order the options are listed, a
 *          yes or no from a `RadioGroup` in the filter's words with "no" reported as `false`, a number range from two
 *          `NumberField`s that take the filter's bounds, step and format, and a day range from two `DateField`s each
 *          bound by the other; and that a value of the wrong shape shows as an empty editor.
 * Boundary: React Native does not render in vitest, so react-native and the sibling native fields are replaced by
 *           recording stand-ins that render plain DOM; what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 3 and 10); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-196 sta-350:FR-197
import { CalendarDate } from "@internationalized/date";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { FilterEditor } from "#native/filter-bar/filter-editor";

/**
 * The props each stand-in was last handed, by name, and the maker of a stand-in. It is hoisted with the mocks, which
 * run before the module's own constants, so the factories below can reach it.
 */
const received = vi.hoisted(() => {
  const handed: Record<string, Record<string, unknown>> = {};
  return {
    props: handed,
    /** A stand-in field whose one button reports `reported(props)` through `onChange`, named after the field. */
    make: async (name: string, reported: (props: Record<string, unknown>) => unknown) => {
      const { createElement } = await import("react");
      return (props: Record<string, unknown>) => {
        const key = String(props["label"] ?? name);
        handed[key] = props;
        return createElement(
          "button",
          {
            type: "button",
            onClick: () => (props["onChange"] as (value: unknown) => void)(reported(props)),
          },
          `Report ${key}`,
        );
      };
    },
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));

vi.mock("#native/text-field/text-field", async () => ({
  TextField: await received.make("text", () => "ada"),
}));
vi.mock("#native/radio-group/radio-group", async () => ({
  RadioGroup: await received.make("radio", () => "paid"),
}));
vi.mock("#native/checkbox-group/checkbox-group", async () => ({
  CheckboxGroup: await received.make("checks", () => ["apac", "eu"]),
}));
vi.mock("#native/number-field/number-field", async () => ({
  NumberField: await received.make("number", () => 7),
}));
vi.mock("#native/date-field/date-field", async () => {
  const { CalendarDate: Day } = await import("@internationalized/date");
  return { DateField: await received.make("date", () => new Day(2026, 3, 1)) };
});

const OPTIONS = [
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
] as const;

const press = (name: string) => act(() => screen.getByRole("button", { name }).click());

describe("FilterEditor (native)", () => {
  beforeEach(() => {
    for (const key of Object.keys(received.props)) Reflect.deleteProperty(received.props, key);
  });

  it("edits text with a field named by the filter and reports the new text", () => {
    const onChange = vi.fn();
    const filter: FilterDefinition = {
      id: "c",
      label: "Customer",
      kind: "text",
      placeholder: "Name",
    };
    render(<FilterEditor definition={filter} value="Ada" onChange={onChange} />);
    expect(received.props["text"]).toMatchObject({
      accessibilityLabel: "Customer",
      value: "Ada",
      placeholder: "Name",
    });
    press("Report text");
    expect(onChange).toHaveBeenCalledWith("ada");
  });

  it("shows an empty text field for a value of the wrong shape or none", () => {
    const filter: FilterDefinition = { id: "c", label: "Customer", kind: "text" };
    render(<FilterEditor definition={filter} value={["x"]} onChange={vi.fn()} />);
    expect(received.props["text"]).toMatchObject({ value: "" });
  });

  it("edits one choice with radios from the options, nothing chosen when unset", () => {
    const onChange = vi.fn();
    const filter: FilterDefinition = { id: "s", label: "Status", kind: "select", options: OPTIONS };
    render(<FilterEditor definition={filter} value={undefined} onChange={onChange} />);
    expect(received.props["radio"]).toMatchObject({
      accessibilityLabel: "Status",
      value: "",
      options: [
        { value: "paid", label: "Paid" },
        { value: "shipped", label: "Shipped" },
      ],
    });
    press("Report radio");
    expect(onChange).toHaveBeenCalledWith("paid");
  });

  it("edits several choices with checkboxes, reported in the order the options are listed", () => {
    const onChange = vi.fn();
    const filter: FilterDefinition = {
      id: "r",
      label: "Region",
      kind: "multi-select",
      options: [
        { id: "eu", label: "Europe" },
        { id: "us", label: "United States" },
        { id: "apac", label: "Asia Pacific" },
      ],
    };
    render(<FilterEditor definition={filter} value={["us"]} onChange={onChange} />);
    expect(received.props["checks"]).toMatchObject({ accessibilityLabel: "Region", value: ["us"] });
    // The stand-in reports `apac` then `eu`, the order they were ticked; the editor puts them back in list order.
    press("Report checks");
    expect(onChange).toHaveBeenCalledWith(["eu", "apac"]);
  });

  it("asks a yes or no in the filter's words and reports a no as false", () => {
    const onChange = vi.fn();
    const filter: FilterDefinition = {
      id: "g",
      label: "Gift",
      kind: "boolean",
      trueLabel: "A gift",
      falseLabel: "Not a gift",
    };
    const { rerender } = render(
      <FilterEditor definition={filter} value={false} onChange={onChange} />,
    );
    expect(received.props["radio"]).toMatchObject({
      value: "false",
      options: [
        { value: "true", label: "A gift" },
        { value: "false", label: "Not a gift" },
      ],
    });
    // The stand-in reports "paid", which is not "true", so the answer is a no.
    press("Report radio");
    expect(onChange).toHaveBeenCalledWith(false);
    rerender(<FilterEditor definition={filter} value={undefined} onChange={onChange} />);
    expect(received.props["radio"]).toMatchObject({ value: "" });
  });

  it("edits a number range with two fields that take the filter's bounds, step and format", () => {
    const onChange = vi.fn();
    const filter: FilterDefinition = {
      id: "t",
      label: "Total",
      kind: "number",
      minValue: 0,
      maxValue: 1000,
      step: 5,
      formatOptions: { style: "currency", currency: "USD" },
    };
    render(<FilterEditor definition={filter} value={{ min: 10, max: null }} onChange={onChange} />);
    expect(received.props["Minimum"]).toMatchObject({
      value: 10,
      minValue: 0,
      maxValue: 1000,
      step: 5,
      formatOptions: { style: "currency", currency: "USD" },
    });
    expect(received.props["Maximum"]).toMatchObject({ value: null });
    press("Report Maximum");
    expect(onChange).toHaveBeenLastCalledWith({ min: 10, max: 7 });
    press("Report Minimum");
    expect(onChange).toHaveBeenLastCalledWith({ min: 7, max: null });
  });

  it("edits a day range with two fields, each bound by the other and by the filter's bounds", () => {
    const onChange = vi.fn();
    const first = new CalendarDate(2026, 1, 1);
    const last = new CalendarDate(2026, 12, 31);
    const start = new CalendarDate(2026, 5, 1);
    const filter: FilterDefinition = {
      id: "p",
      label: "Placed",
      kind: "date-range",
      minValue: first,
      maxValue: last,
    };
    render(<FilterEditor definition={filter} value={{ start, end: null }} onChange={onChange} />);
    expect(received.props["From"]).toMatchObject({ value: start, minValue: first, maxValue: last });
    expect(received.props["Until"]).toMatchObject({ value: null, minValue: start, maxValue: last });
    press("Report Until");
    expect(onChange).toHaveBeenLastCalledWith({ start, end: new CalendarDate(2026, 3, 1) });
  });

  it("shows empty fields for a range of the wrong shape", () => {
    const filter: FilterDefinition = { id: "t", label: "Total", kind: "number" };
    render(<FilterEditor definition={filter} value="12" onChange={vi.fn()} />);
    expect(received.props["Minimum"]).toMatchObject({ value: null });
    expect(received.props["Maximum"]).toMatchObject({ value: null });
  });
});
