/**
 * Stackra file contract:
 * Purpose: proves the web PermissionsMatrix is a named table with scoped headers, one checkbox per cell named by the
 *          permission and role, a role's column and a group's rows toggled in bulk (checked, dashed or empty from the
 *          grants), each role's summary, uncontrolled and controlled grants, and read-only marks in place of
 *          checkboxes.
 * Boundary: jsdom with real HeroUI and React Aria; `useUiText` writes the key and its values.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import { PermissionsMatrix } from "#react/permissions-matrix/permissions-matrix";

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: Record<string, unknown>) =>
    values
      ? `${key.replace("ui::permissions_matrix.", "")}(${Object.values(values).join("|")})`
      : key,
}));

const ROLES = [
  { id: "cashier", label: "Cashier" },
  { id: "manager", label: "Manager" },
];
const GROUPS = [
  {
    id: "sales",
    label: "Sales",
    permissions: [
      { id: "sell", label: "Sell", description: "Ring up a sale" },
      { id: "refund", label: "Refund" },
    ],
  },
  { id: "stock", label: "Stock", permissions: [{ id: "count", label: "Count stock" }] },
];

const box = (name: string) => screen.getByRole("checkbox", { name });

describe("PermissionsMatrix (web)", () => {
  it("is a named table with scoped headers and one named checkbox per cell", () => {
    render(
      <PermissionsMatrix label="Store roles" roles={ROLES} groups={GROUPS} isAnimated={false} />,
    );
    const table = screen.getByRole("table", { name: "Store roles" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    expect(within(table).getByRole("rowheader", { name: /Sell/ })).toBeTruthy();
    expect(screen.getByText("Ring up a sale")).toBeTruthy();
    expect(box("cell(Refund|Manager)")).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2 + 2 * 2 + 3 * 2);
  });

  it("toggles a cell, and a role's column and a group's rows in bulk, uncontrolled", () => {
    const onChange = vi.fn();
    render(
      <PermissionsMatrix
        label="Store roles"
        roles={ROLES}
        groups={GROUPS}
        defaultValue={{ cashier: ["sell"] }}
        onChange={onChange}
        isAnimated={false}
      />,
    );
    expect((box("cell(Sell|Cashier)") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("summary(1|3)")).toBeTruthy();
    expect(box("group_for_role(Sales|Cashier)").closest("[data-indeterminate]")).toBeTruthy();

    fireEvent.click(box("cell(Refund|Cashier)"));
    expect(onChange).toHaveBeenLastCalledWith({ cashier: ["sell", "refund"] });
    expect((box("group_for_role(Sales|Cashier)") as HTMLInputElement).checked).toBe(true);

    fireEvent.click(box("all_for_role(Manager)"));
    expect(onChange).toHaveBeenLastCalledWith({
      cashier: ["sell", "refund"],
      manager: ["sell", "refund", "count"],
    });
    expect(screen.getByText("summary(3|3)")).toBeTruthy();

    fireEvent.click(box("group_for_role(Stock|Manager)"));
    expect(onChange).toHaveBeenLastCalledWith({
      cashier: ["sell", "refund"],
      manager: ["sell", "refund"],
    });
  });

  it("shows `value` when controlled and only reports a change", () => {
    const onChange = vi.fn();
    render(
      <PermissionsMatrix
        label="Store roles"
        roles={ROLES}
        groups={GROUPS}
        value={{}}
        onChange={onChange}
        isAnimated={false}
      />,
    );
    fireEvent.click(box("cell(Sell|Cashier)"));
    expect(onChange).toHaveBeenCalledWith({ cashier: ["sell"] });
    expect((box("cell(Sell|Cashier)") as HTMLInputElement).checked).toBe(false);
  });

  it("draws named allowed and not-allowed marks when read-only", () => {
    render(
      <PermissionsMatrix
        label="Store roles"
        roles={ROLES}
        groups={GROUPS}
        value={{ cashier: ["sell"] }}
        isReadOnly
      />,
    );
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(
      screen.getByRole("img", { name: "cell_state(Sell|Cashier|ui::permissions_matrix.allowed)" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "cell_state(Sell|Manager|ui::permissions_matrix.denied)" }),
    ).toBeTruthy();
  });
});
