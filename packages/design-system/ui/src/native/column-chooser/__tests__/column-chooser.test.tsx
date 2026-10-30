/**
 * Stackra file contract:
 * Purpose: proves the native ColumnChooser: a popover behind a button, both named by the label (or the catalogue's
 *          "columns"), holding one checkbox per column with the shown ones checked and the row header locked on, and
 *          reporting the columns left unchecked as hidden, never the row header.
 * Boundary: React Native does not render in vitest, so it and the house Popover, Button and CheckboxGroup are recording
 *           stand-ins; what each is handed and what the chooser reports is checked.
 * Runtime: node
 * Governing contract: ADR 0318; WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ColumnChooser } from "#native/column-chooser/column-chooser";

const state = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": props["testID"] }, props["children"] as ReactNode),
  };
});
vi.mock("#native/popover/popover", async () => {
  const { createElement } = await import("react");
  return {
    Popover: (props: Record<string, unknown>) => {
      state.props["popover"] = props;
      return createElement(
        "div",
        null,
        props["trigger"] as ReactNode,
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement("button", { type: "button" }, props["children"] as ReactNode),
  };
});
vi.mock("#native/checkbox-group/checkbox-group", () => ({
  CheckboxGroup: (props: Record<string, unknown>) => {
    state.props["group"] = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const COLUMNS = [
  { id: "id", label: "ID" },
  { id: "name", label: "Name", isRowHeader: true },
  { id: "email", label: "Email" },
];
const group = () => state.props["group"] ?? {};

describe("ColumnChooser (native)", () => {
  it("names the button and popover by the catalogue and locks the row header", () => {
    render(
      <ColumnChooser
        columns={COLUMNS}
        hiddenColumns={["email"]}
        onHiddenColumnsChange={vi.fn()}
        testID="chooser"
      />,
    );
    expect(screen.getByTestId("chooser")).toBeTruthy();
    expect(screen.getByRole("button").textContent).toBe("ui::data_table_tools.columns");
    expect(state.props["popover"]?.["title"]).toBe("ui::data_table_tools.columns");
    expect(group()).toMatchObject({
      label: "ui::data_table_tools.columns",
      value: ["id", "name"],
      options: [
        { value: "id", label: "ID", isDisabled: false },
        { value: "name", label: "Name", isDisabled: true },
        { value: "email", label: "Email", isDisabled: false },
      ],
    });
  });

  it("reports the unchecked columns as hidden, never the row header", () => {
    const onHiddenColumnsChange = vi.fn();
    render(
      <ColumnChooser
        columns={COLUMNS}
        hiddenColumns={[]}
        onHiddenColumnsChange={onHiddenColumnsChange}
        label="Shown"
      />,
    );
    expect(screen.getByRole("button").textContent).toBe("Shown");
    act(() => (group()["onChange"] as (shown: string[]) => void)(["email"]));
    expect(onHiddenColumnsChange).toHaveBeenCalledWith(["id"]);
  });

  it("locks the first column when none is the row header", () => {
    render(
      <ColumnChooser
        columns={[COLUMNS[0] as (typeof COLUMNS)[number], { id: "x", label: "X" }]}
        hiddenColumns={[]}
        onHiddenColumnsChange={vi.fn()}
      />,
    );
    expect((group()["options"] as { isDisabled: boolean }[]).map((o) => o.isDisabled)).toEqual([
      true,
      false,
    ]);
  });
});
