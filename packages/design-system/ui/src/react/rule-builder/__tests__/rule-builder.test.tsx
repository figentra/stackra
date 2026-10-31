/**
 * Stackra file contract:
 * Purpose: proves the web RuleBuilder: it names the group by its label, shows the empty state, adds a condition on the
 *          first field with that field's first operator, switches match all/any, changes a condition's field (keeping
 *          or resetting the operator), operator and value (text or choice), hides the value for the emptiness
 *          operators, removes a condition, and refuses every edit while disabled.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and callbacks are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { RuleField } from "#contracts/types/rule-field.type";
import type { RuleGroup } from "#contracts/types/rule-group.type";
import { RuleBuilder } from "#react/rule-builder/rule-builder";

const press = (element: HTMLElement) => act(() => element.click());
const choose = (trigger: RegExp, option: RegExp) => {
  press(screen.getAllByRole("button", { name: trigger })[0] as HTMLElement);
  press(within(screen.getByRole("listbox")).getByRole("option", { name: option }));
};

const FIELDS: readonly RuleField[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "total", label: "Total", type: "number" },
  {
    key: "tier",
    label: "Tier",
    type: "choice",
    options: [
      { id: "gold", label: "Gold" },
      { id: "silver", label: "Silver" },
    ],
  },
];

const ONE: RuleGroup = {
  match: "all",
  conditions: [{ id: "a", field: "name", operator: "contains", value: "x" }],
};

describe("RuleBuilder (web)", () => {
  it("is a group named by its label, shows the empty state and adds a condition", () => {
    const onChange = vi.fn();
    render(
      <RuleBuilder
        label="Applies when"
        fields={FIELDS}
        value={{ match: "all", conditions: [] }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("group", { name: "Applies when" })).toBeTruthy();
    expect(screen.getByText(/No conditions yet/)).toBeTruthy();
    press(screen.getByRole("button", { name: "Add a condition" }));
    expect(onChange).toHaveBeenLastCalledWith({
      match: "all",
      conditions: [expect.objectContaining({ field: "name", operator: "equals", value: "" })],
    });
  });

  it("switches between all and any", () => {
    const onChange = vi.fn();
    render(<RuleBuilder label="R" fields={FIELDS} value={ONE} onChange={onChange} />);
    choose(/Conditions that must hold/, /Any of these/);
    expect(onChange).toHaveBeenLastCalledWith({ ...ONE, match: "any" });
  });

  it("changes the operator and the text value, and removes the condition", () => {
    const onChange = vi.fn();
    render(<RuleBuilder label="R" fields={FIELDS} value={ONE} onChange={onChange} />);
    choose(/Operator/, /^is not$/);
    expect(onChange.mock.lastCall?.[0].conditions[0].operator).toBe("not_equals");
    fireEvent.change(screen.getByRole("textbox", { name: "Value" }), { target: { value: "y" } });
    expect(onChange.mock.lastCall?.[0].conditions[0].value).toBe("y");
    press(screen.getByRole("button", { name: "Remove the condition" }));
    expect(onChange).toHaveBeenLastCalledWith({ match: "all", conditions: [] });
  });

  it("keeps an operator the new field allows and resets one it does not", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RuleBuilder
        label="R"
        fields={FIELDS}
        value={{
          match: "all",
          conditions: [{ id: "a", field: "name", operator: "equals", value: "x" }],
        }}
        onChange={onChange}
      />,
    );
    choose(/Field/, /Total/);
    expect(onChange.mock.lastCall?.[0].conditions[0]).toEqual({
      id: "a",
      field: "total",
      operator: "equals",
      value: "",
    });
    rerender(<RuleBuilder label="R" fields={FIELDS} value={ONE} onChange={onChange} />);
    choose(/Field/, /Tier/);
    expect(onChange.mock.lastCall?.[0].conditions[0].operator).toBe("equals");
  });

  it("offers a choice field's options as the value and a decimal keypad for a number", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RuleBuilder
        label="R"
        fields={FIELDS}
        value={{
          match: "all",
          conditions: [{ id: "a", field: "tier", operator: "equals", value: "" }],
        }}
        onChange={onChange}
      />,
    );
    choose(/Value/, /Gold/);
    expect(onChange.mock.lastCall?.[0].conditions[0].value).toBe("gold");
    rerender(
      <RuleBuilder
        label="R"
        fields={FIELDS}
        value={{
          match: "all",
          conditions: [{ id: "a", field: "total", operator: "greater", value: "1" }],
        }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Value" }).getAttribute("inputmode")).toBe(
      "decimal",
    );
  });

  it("hides the value for the emptiness operators and falls back to the first field for an unknown key", () => {
    render(
      <RuleBuilder
        label="R"
        fields={FIELDS}
        value={{
          match: "any",
          conditions: [{ id: "a", field: "gone", operator: "is_empty", value: "" }],
        }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("textbox", { name: "Value" })).toBeNull();
    // The unknown field falls back to the first field's operators, so the stored one still shows.
    expect(screen.getByRole("button", { name: /Operator/ }).textContent).toContain("is empty");
  });

  it("refuses every edit while disabled and adds nothing without fields", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RuleBuilder label="R" fields={FIELDS} value={ONE} onChange={onChange} isDisabled />,
    );
    expect((screen.getByRole("group", { name: "R" }) as HTMLFieldSetElement).disabled).toBe(true);
    press(screen.getByRole("button", { name: "Add a condition" }));
    press(screen.getByRole("button", { name: "Remove the condition" }));
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <RuleBuilder
        label="R"
        fields={[]}
        value={{ match: "all", conditions: [] }}
        onChange={onChange}
      />,
    );
    press(screen.getByRole("button", { name: "Add a condition" }));
    expect(onChange).not.toHaveBeenCalled();
  });
  it("draws several choices as tags and a range as a from and an until field", () => {
    const onChange = vi.fn();
    render(
      <RuleBuilder
        label="Applies when"
        fields={FIELDS}
        value={{
          match: "all",
          conditions: [
            { id: "a", field: "tier", operator: "in", value: ["gold"] },
            { id: "b", field: "total", operator: "between", value: ["1", ""] },
          ],
        }}
        onChange={onChange}
      />,
    );
    press(screen.getByRole("row", { name: "Silver" }));
    expect(onChange.mock.lastCall?.[0].conditions[0].value).toEqual(["gold", "silver"]);
    fireEvent.change(screen.getByRole("textbox", { name: "Until" }), { target: { value: "9" } });
    expect(onChange.mock.lastCall?.[0].conditions[1].value).toEqual(["1", "9"]);
  });
});
