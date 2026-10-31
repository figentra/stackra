/**
 * Stackra file contract:
 * Purpose: proves the native RuleBuilder: it switches the match between all and any, says when there are no
 *          conditions, adds a condition on the first field with its first operator, removes one, changes a field
 *          (keeping the operator when the new type allows it, clearing the value), changes the operator, takes a
 *          choice value from a Select and other values from a text field (a decimal pad for numbers), drops the value
 *          for the empty operators, and disables every control when disabled.
 * Boundary: React Native does not render in vitest, so it and the house Select, TextField, Button, IconButton and Text
 *           are stand-ins that render plain DOM form controls; what the builder reports through onChange is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { RuleField } from "#contracts/types/rule-field.type";
import type { RuleGroup } from "#contracts/types/rule-group.type";
import { RuleBuilder } from "#native/rule-builder/rule-builder";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/select/select", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: {
      label: string;
      items: { id: string; label: string }[];
      value: string | null;
      isDisabled: boolean;
      onChange: (key: string | null) => void;
    }) =>
      createElement(
        "select",
        {
          "aria-label": props.label,
          value: props.value ?? "",
          disabled: props.isDisabled,
          onChange: (event: { target: { value: string } }) =>
            props.onChange(event.target.value === "" ? null : event.target.value),
        },
        [{ id: "", label: "" }, ...props.items].map((item) =>
          createElement("option", { key: item.id, value: item.id }, item.label),
        ),
      ),
  };
});
vi.mock("#native/text-field/text-field", async () => {
  const { createElement } = await import("react");
  return {
    TextField: (props: Record<string, unknown>) =>
      createElement("input", {
        "aria-label": props["label"] as string,
        value: props["value"] as string,
        disabled: props["isDisabled"] as boolean,
        inputMode: props["keyboardType"] === "decimal-pad" ? "decimal" : "text",
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (value: string) => void)(event.target.value),
      }),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", disabled: props["isDisabled"], onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"],
        disabled: props["isDisabled"],
        onClick: props["onPress"],
      }),
  };
});
vi.mock("#native/date-field/date-field", async () => {
  const { createElement } = await import("react");
  const { CalendarDate: Day } = await import("@internationalized/date");
  return {
    DateField: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        "data-day": String(props["value"] ?? ""),
        onClick: () => (props["onChange"] as (day: unknown) => void)(new Day(2026, 3, 1)),
      }),
  };
});
vi.mock("#native/tag-group/tag-group", async () => {
  const { createElement } = await import("react");
  return {
    TagGroup: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        "data-value": (props["value"] as readonly string[]).join(","),
        onClick: () => (props["onChange"] as (ids: readonly string[]) => void)(["pro"]),
      }),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const K = "ui::rule_builder.";
const FIELDS = [
  { key: "name", label: "Name", type: "text" as const },
  { key: "age", label: "Age", type: "number" as const },
  {
    key: "plan",
    label: "Plan",
    type: "choice" as const,
    options: [{ id: "pro", label: "Pro" }],
  },
];
const RULE: RuleGroup = {
  match: "all",
  conditions: [
    { id: "a", field: "name", operator: "contains", value: "Ada" },
    { id: "b", field: "plan", operator: "equals", value: "" },
    { id: "c", field: "age", operator: "is_empty", value: "" },
  ],
};

const setup = (
  value: RuleGroup = RULE,
  fields: readonly RuleField[] = FIELDS,
  isDisabled = false,
) => {
  const onChange = vi.fn();
  render(
    <RuleBuilder
      fields={fields}
      value={value}
      onChange={onChange}
      label="Audience"
      isDisabled={isDisabled}
      className="wide"
    />,
  );
  const last = (): RuleGroup => onChange.mock.lastCall?.[0] as RuleGroup;
  return { onChange, last };
};
const change = (element: HTMLElement | undefined, value: string) =>
  fireEvent.change(element as HTMLElement, { target: { value } });

describe("RuleBuilder (native)", () => {
  it("says when there are no conditions and adds one on the first field", () => {
    const { last } = setup({ match: "all", conditions: [] });
    expect(screen.getByLabelText("Audience")).toBeTruthy();
    expect(screen.getByText(`${K}empty`)).toBeTruthy();
    fireEvent.click(screen.getByText(`${K}add`));
    expect(last().conditions).toEqual([
      {
        id: expect.stringMatching(/^c.+0$/) as string,
        field: "name",
        operator: "equals",
        value: "",
      },
    ]);
  });

  it("switches the match between all and any", () => {
    const { last } = setup();
    change(screen.getByLabelText(`${K}match`), "any");
    expect(last().match).toBe("any");
    change(screen.getByLabelText(`${K}match`), "all");
    expect(last().match).toBe("all");
  });

  it("draws each condition's value control by its field type and operator", () => {
    setup();
    expect(screen.queryByText(`${K}empty`)).toBeNull();
    expect(screen.getAllByLabelText(`${K}field`)).toHaveLength(3);
    const values = screen.getAllByLabelText(`${K}value`);
    expect(values.map((element) => element.tagName)).toEqual(["INPUT", "SELECT"]);
    expect((values[0] as HTMLInputElement).value).toBe("Ada");
    expect((values[1] as HTMLSelectElement).value).toBe("");
  });

  it("removes a condition", () => {
    const { last } = setup();
    fireEvent.click(screen.getAllByLabelText(`${K}remove`)[1] as HTMLElement);
    expect(last().conditions.map((condition) => condition.id)).toEqual(["a", "c"]);
  });

  it("keeps an operator the new field allows and resets one it does not", () => {
    const { last } = setup();
    const fields = screen.getAllByLabelText(`${K}field`);
    change(fields[2], "name");
    expect(last().conditions[2]).toEqual({
      id: "c",
      field: "name",
      operator: "is_empty",
      value: "",
    });
    change(fields[0], "plan");
    expect(last().conditions[0]).toEqual({ id: "a", field: "plan", operator: "equals", value: "" });
  });

  it("ignores a field it does not know", () => {
    const { onChange } = setup();
    change(screen.getAllByLabelText(`${K}field`)[0], "");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("changes the operator and ignores an empty one", () => {
    const { onChange, last } = setup();
    const operators = screen.getAllByLabelText(`${K}operator`);
    change(operators[0], "not_contains");
    expect(last().conditions[0]?.operator).toBe("not_contains");
    onChange.mockClear();
    change(operators[0], "");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes a typed value and a chosen value, clearing a cleared choice", () => {
    const { last } = setup();
    const values = screen.getAllByLabelText(`${K}value`);
    change(values[0], "Bob");
    expect(last().conditions[0]?.value).toBe("Bob");
    change(values[1], "pro");
    expect(last().conditions[1]?.value).toBe("pro");
    change(values[1], "");
    expect(last().conditions[1]?.value).toBe("");
  });

  it("asks for a decimal pad on a number and falls back to the first field when the field is gone", () => {
    setup({
      match: "any",
      conditions: [
        { id: "a", field: "age", operator: "greater", value: "3" },
        { id: "b", field: "gone", operator: "equals", value: "x" },
      ],
    });
    const values = screen.getAllByLabelText(`${K}value`) as HTMLInputElement[];
    expect(values.map((input) => input.inputMode)).toEqual(["decimal", "text"]);
  });

  it("disables every control when disabled, and adding without fields", () => {
    setup(RULE, FIELDS, true);
    for (const element of screen.getAllByRole("combobox"))
      expect(element).toHaveProperty("disabled", true);
    expect(screen.getByText(`${K}add`)).toHaveProperty("disabled", true);
    expect(screen.getAllByLabelText(`${K}remove`)[0]).toHaveProperty("disabled", true);
  });

  it("adds nothing and draws no operators without fields", () => {
    const { onChange } = setup(
      { match: "all", conditions: [{ id: "a", field: "x", operator: "equals", value: "" }] },
      [],
    );
    expect(screen.getByText(`${K}add`)).toHaveProperty("disabled", true);
    expect(screen.getAllByLabelText(`${K}operator`)[0]?.querySelectorAll("option")).toHaveLength(1);
    fireEvent.click(screen.getByText(`${K}add`));
    expect(onChange).not.toHaveBeenCalled();
  });
  it("draws several choices as tags, a range as two inputs and a day as a date field", () => {
    const fields = [
      ...FIELDS,
      { key: "due", label: "Due", type: "date" as const },
      { key: "vip", label: "VIP", type: "boolean" as const },
    ];
    const { last } = setup(
      {
        match: "all",
        conditions: [
          { id: "a", field: "plan", operator: "in", value: [] },
          { id: "b", field: "age", operator: "between", value: ["1", ""] },
          { id: "c", field: "due", operator: "after", value: "2026-01-01" },
          { id: "d", field: "vip", operator: "is_true", value: "" },
        ],
      },
      fields,
    );
    act(() => (screen.getAllByLabelText(`${K}value`)[0] as HTMLElement).click());
    expect(last().conditions[0]?.value).toEqual(["pro"]);
    const ends = [
      screen.getByLabelText("ui::filter_bar.from"),
      screen.getByLabelText("ui::filter_bar.until"),
    ];
    expect((ends[0] as HTMLInputElement).value).toBe("1");
    change(ends[1], "9");
    expect(last().conditions[1]?.value).toEqual(["1", "9"]);
    const day = screen.getAllByRole("button").find((button) => button.dataset["day"] !== undefined);
    expect(day?.dataset["day"]).toBe("2026-01-01");
    act(() => day?.click());
    expect(last().conditions[2]?.value).toBe("2026-03-01");
    // A yes or no takes no value: four fields, three value controls.
    expect(screen.getAllByLabelText(`${K}field`)).toHaveLength(4);
  });

  it("resets the value to the new operator's shape", () => {
    const { last } = setup({
      match: "all",
      conditions: [{ id: "a", field: "plan", operator: "equals", value: "pro" }],
    });
    change(screen.getByLabelText(`${K}operator`), "in");
    expect(last().conditions[0]).toMatchObject({ operator: "in", value: [] });
    change(screen.getByLabelText(`${K}operator`), "not_equals");
    expect(last().conditions[0]).toMatchObject({ operator: "not_equals", value: "pro" });
  });
});
