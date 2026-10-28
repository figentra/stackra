/**
 * Stackra file contract:
 * Purpose: proves `RuleBuilder` offers only the registered fields and the operators of a field's type, reports each
 *          edit as a whole condition (add a condition or a group, change the match mode, negate, remove, change the
 *          field or the operator, type a value read in the field's type), shows a node's problem at the node, shows
 *          the right value after a removal moves a leaf, offers no edit when read-only, and edits outcomes (add one,
 *          fill a parameter, mark one past a floor) only when the host takes outcome changes.
 * Boundary: unit tier, jsdom. `@stackra/ui/react` is replaced by DOM stand-ins so the test reads plain elements, and
 *           the translation returns the key itself.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 3, 4 and 8).
 */
// @vitest-environment jsdom
import type { I18nKey } from "@stackra/i18n";
import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { FieldType, Operator } from "#contracts/index";
import { type Condition, type Outcome, Rules } from "#core/index";
import { RuleBuilder } from "#react/rule-builder/rule-builder";

/** What a stand-in field receives. */
interface FieldProps {
  readonly label: string;
  readonly value?: unknown;
  readonly items?: readonly { id: string; label: string }[];
  readonly isReadOnly?: boolean;
  readonly errorMessage?: ReactNode;
  readonly onChange: (value: never) => void;
}

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: FieldProps) =>
      createElement(
        "div",
        null,
        createElement(
          "select",
          {
            "aria-label": props.label,
            value: props.value ?? "",
            disabled: props.isReadOnly === true,
            onChange: (event: { target: { value: string } }) =>
              (props.onChange as (value: string | null) => void)(event.target.value || null),
          },
          createElement("option", { value: "" }),
          ...(props.items ?? []).map((item) =>
            createElement("option", { key: item.id, value: item.id }, item.label),
          ),
        ),
        props.errorMessage,
      ),
    TextField: (props: FieldProps) =>
      createElement(
        "div",
        null,
        createElement("input", {
          "aria-label": props.label,
          value: props.value,
          readOnly: props.isReadOnly === true,
          onChange: (event: { target: { value: string } }) =>
            (props.onChange as (value: string) => void)(event.target.value),
        }),
        props.errorMessage,
      ),
    Switch: (props: FieldProps) =>
      createElement("button", {
        type: "button",
        role: "switch",
        "aria-label": props.label,
        "aria-checked": props.value === true,
        disabled: props.isReadOnly === true,
        onClick: () => (props.onChange as (value: boolean) => void)(props.value !== true),
      }),
    CheckboxGroup: (props: FieldProps) => createElement("div", { "aria-label": props.label }),
    Button: (props: { children: ReactNode; onPress: () => void }) =>
      createElement("button", { type: "button", onClick: props.onPress }, props.children),
    FieldError: (props: { children: ReactNode }) =>
      createElement("div", { role: "alert" }, props.children),
  };
});

vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

/** A label key. */
const label = (name: string) => `shop::facts.${name}` as I18nKey;

/** The registry the builder offers. */
const RULES = Rules.create({
  key: "shop.discount",
  sources: [
    {
      key: "cart",
      fields: {
        items: { type: FieldType.Number, label: label("items") },
        total: { type: FieldType.Money, label: label("total") },
      },
    },
  ],
});

/** A registry with an outcome kind whose days are floored. */
const RETURNS = Rules.create({
  key: "shop.returns",
  sources: [{ key: "cart", fields: { items: { type: FieldType.Number, label: label("items") } } }],
  outcomes: [
    {
      key: "refundWindow",
      label: label("refund"),
      params: { days: { type: FieldType.Number, label: label("days"), floor: "consumer.days" } },
    },
  ],
});

/** One leaf: at least three items. */
const ITEMS: Condition = { field: "cart.items", operator: Operator.AtLeast, value: 3 };

/** Renders the builder on `value` and returns the change spy. */
function renderBuilder(value: Condition, isReadOnly = false) {
  const onChange = vi.fn<(next: Condition) => void>();
  render(<RuleBuilder rules={RULES} value={value} onChange={onChange} isReadOnly={isReadOnly} />);
  return onChange;
}

/** The options a select offers, by value. */
const optionsOf = (select: HTMLElement) =>
  within(select)
    .getAllByRole("option")
    .map((option) => (option as HTMLOptionElement).value)
    .filter((value) => value !== "");

afterEach(() => {
  cleanup();
});

describe("RuleBuilder", () => {
  it("offers the registered fields and only the operators of the field's type", () => {
    renderBuilder({ all: [ITEMS] });
    expect(optionsOf(screen.getByLabelText("rules::builder.field"))).toEqual([
      "cart.items",
      "cart.total",
    ]);
    expect(optionsOf(screen.getByLabelText("rules::builder.operator"))).toEqual([
      "equals",
      "not_equals",
      "less_than",
      "at_most",
      "greater_than",
      "at_least",
      "between",
      "is_set",
      "is_not_set",
    ]);
    expect((screen.getByLabelText("rules::operands.value") as HTMLInputElement).value).toBe("3");
  });

  it("adds a condition at the first field's is_set test, and a group", () => {
    const onChange = renderBuilder({ all: [ITEMS] });
    fireEvent.click(screen.getByText("rules::builder.addCondition"));
    expect(onChange).toHaveBeenLastCalledWith({
      all: [ITEMS, { field: "cart.items", operator: Operator.IsSet }],
    });
    fireEvent.click(screen.getByText("rules::builder.addGroup"));
    expect(onChange).toHaveBeenLastCalledWith({ all: [ITEMS, { all: [] }] });
  });

  it("changes the match mode, negates a group and removes a condition", () => {
    const onChange = renderBuilder({ all: [ITEMS] });
    fireEvent.change(screen.getByLabelText("rules::builder.match"), { target: { value: "any" } });
    expect(onChange).toHaveBeenLastCalledWith({ any: [ITEMS] });
    fireEvent.click(screen.getByRole("switch", { name: "rules::builder.not" }));
    expect(onChange).toHaveBeenLastCalledWith({ not: { all: [ITEMS] } });
    fireEvent.click(screen.getByText("rules::builder.remove"));
    expect(onChange).toHaveBeenLastCalledWith({ all: [] });
  });

  it("unwraps a negation", () => {
    const onChange = renderBuilder({ not: { all: [ITEMS] } });
    const [negation] = screen.getAllByRole("switch", { name: "rules::builder.not" });
    fireEvent.click(negation as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith({ all: [ITEMS] });
  });

  it("resets the test when the field changes and drops the value when the operator does", () => {
    const onChange = renderBuilder({ all: [ITEMS] });
    fireEvent.change(screen.getByLabelText("rules::builder.field"), {
      target: { value: "cart.total" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      all: [{ field: "cart.total", operator: Operator.IsSet }],
    });
    fireEvent.change(screen.getByLabelText("rules::builder.operator"), {
      target: { value: "between" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      all: [{ field: "cart.items", operator: Operator.Between }],
    });
  });

  it("reads typed text in the field's type and shows a refused value at its node", () => {
    const onChange = renderBuilder({
      all: [{ field: "cart.total", operator: Operator.AtLeast, value: "12.5" }],
    });
    expect(screen.getByText("rules::problems.value_invalid")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("rules::operands.value"), {
      target: { value: "12.50 usd" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      all: [
        {
          field: "cart.total",
          operator: Operator.AtLeast,
          value: { minor: 1250, currency: "USD" },
        },
      ],
    });
  });

  it("edits a range in two fields", () => {
    const onChange = renderBuilder({
      all: [{ field: "cart.items", operator: Operator.Between, value: [1, 5] }],
    });
    fireEvent.change(screen.getByLabelText("rules::operands.to"), { target: { value: "9" } });
    expect(onChange).toHaveBeenLastCalledWith({
      all: [{ field: "cart.items", operator: Operator.Between, value: [1, 9] }],
    });
  });

  it("shows the value of the leaf a removal moves into a place", () => {
    const five: Condition = { field: "cart.items", operator: Operator.AtLeast, value: 5 };
    const onChange = vi.fn<(next: Condition) => void>();
    const { rerender } = render(
      <RuleBuilder rules={RULES} value={{ all: [ITEMS, five] }} onChange={onChange} />,
    );
    rerender(<RuleBuilder rules={RULES} value={{ all: [five] }} onChange={onChange} />);
    expect((screen.getByLabelText("rules::operands.value") as HTMLInputElement).value).toBe("5");
  });

  it("offers no edit when read-only", () => {
    renderBuilder({ all: [ITEMS] }, true);
    expect(screen.queryByText("rules::builder.addCondition")).toBeNull();
    expect(screen.queryByText("rules::builder.remove")).toBeNull();
    expect((screen.getByLabelText("rules::builder.field") as HTMLSelectElement).disabled).toBe(
      true,
    );
  });

  it("edits outcomes: adds one, fills a parameter and marks a value past a floor", () => {
    const onOutcomesChange = vi.fn<(next: readonly Outcome[]) => void>();
    const floors = [
      {
        key: "consumer.days",
        value: 14,
        market: "eu",
        version: "1.0.0",
        floor: { bound: FloorBound.Min, law: "Directive 2011/83/EU" },
      },
    ] as ResolvedValue[];
    const { rerender } = render(
      <RuleBuilder
        rules={RETURNS}
        value={{ all: [] }}
        onChange={vi.fn()}
        outcomes={[]}
        onOutcomesChange={onOutcomesChange}
        floors={floors}
      />,
    );
    fireEvent.click(screen.getByText("rules::builder.addOutcome"));
    expect(onOutcomesChange).toHaveBeenLastCalledWith([{ kind: "refundWindow", params: {} }]);
    rerender(
      <RuleBuilder
        rules={RETURNS}
        value={{ all: [] }}
        onChange={vi.fn()}
        outcomes={[{ kind: "refundWindow", params: {} }]}
        onOutcomesChange={onOutcomesChange}
        floors={floors}
      />,
    );
    expect(screen.getByText("rules::problems.param_missing")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("shop::facts.days"), { target: { value: "7" } });
    expect(onOutcomesChange).toHaveBeenLastCalledWith([
      { kind: "refundWindow", params: { days: 7 } },
    ]);
    rerender(
      <RuleBuilder
        rules={RETURNS}
        value={{ all: [] }}
        onChange={vi.fn()}
        outcomes={[{ kind: "refundWindow", params: { days: 7 } }]}
        onOutcomesChange={onOutcomesChange}
        floors={floors}
      />,
    );
    expect(screen.getByText("rules::problems.past_floor")).toBeTruthy();
  });

  it("shows no outcome list without onOutcomesChange", () => {
    renderBuilder({ all: [ITEMS] });
    expect(screen.queryByText("rules::builder.outcomes")).toBeNull();
  });
});
