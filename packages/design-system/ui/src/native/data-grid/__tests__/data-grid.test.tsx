/**
 * Stackra file contract:
 * Purpose: proves the native DataGrid lists its rows named by the first column, opens a quick-edit sheet on a press
 *          whose Done records a change and raises the save bar, bulk-edits the selected rows in one step, and saves
 *          the changes through `onSave`.
 * Boundary: `react-native` and the kit's parts are stand-ins that render plain DOM; `useUiText` writes the key.
 * Runtime: node
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid on a phone); ADR 0505; ADR 0022.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import { DataGrid } from "#native/data-grid/data-grid";
import { useCollection } from "#react/hooks/use-collection";

type Props = Record<string, unknown> & { readonly children?: ReactNode };

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    View: (props: Props) => h("div", null, props.children),
    Pressable: (props: Props) =>
      h(
        "button",
        { "aria-label": props["accessibilityLabel"], onClick: props["onPress"] },
        props.children,
      ),
    ScrollView: (props: Props) => h("div", null, props.children),
  };
});
vi.mock("#native/text/text", () => ({
  Text: (props: Props) => createElement("span", null, props.children),
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Props) =>
    createElement(
      "button",
      { type: "button", onClick: props["onPress"], disabled: props["isDisabled"] },
      props.children,
    ),
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Props) =>
    createElement(
      "button",
      { type: "button", onClick: props["onPress"] },
      props["label"] as string,
    ),
}));
vi.mock("#native/checkbox/checkbox", () => ({ Checkbox: () => null }));
vi.mock("#native/icon/icon", () => ({
  Icon: (props: Props) => createElement("i", null, props["name"] as string),
}));
vi.mock("#native/select/select", () => ({ Select: () => null }));
vi.mock("#native/switch/switch", () => ({ Switch: () => null }));
vi.mock("#native/text-field/text-field", () => ({
  TextField: (props: Props) =>
    createElement("input", {
      "aria-label": props["label"],
      value: props["value"],
      onChange: (event: { target: { value: string } }) =>
        (props["onChange"] as (v: string) => void)(event.target.value),
    }),
}));
vi.mock("#native/save-bar/save-bar", () => ({
  SaveBar: (props: Props) =>
    props["isDirty"]
      ? createElement(
          "section",
          null,
          createElement("p", null, props["message"] as string),
          props.children,
          createElement("button", { type: "button", onClick: props["onSave"] }, "save"),
        )
      : null,
}));
vi.mock("#native/drawer/drawer", () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const part = (props: Props) => createElement("div", null, props.children);
  return {
    Drawer: Object.assign(
      (props: Props) =>
        props["isOpen"] ? createElement("dialog", { open: true }, props.children) : null,
      {
        Header: part,
        Title: part,
        Body: part,
        Footer: part,
      },
    ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}(${Object.values(values).join("|")})` : key,
}));

const COLUMNS = [
  { id: "name", label: "Name", isReadOnly: true },
  { id: "qty", label: "Qty", type: "number" as const },
];
const ROWS = [
  { id: "a", name: "Latte", qty: 1 },
  { id: "b", name: "Mocha", qty: 2 },
];

/** The rows' names, in drawn order. */
const names = () =>
  screen
    .getAllByRole("button", { name: /^ui::data_grid\.edit_row/u })
    .map((button) => button.getAttribute("aria-label"));

/** A grid on a collection whose Qty column is hidden. */
function Harness() {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    initialState: {
      columns: [
        { id: "name", pin: "start" },
        { id: "qty", isHidden: true },
      ],
    },
  });
  return <DataGrid label="Menu" collection={collection} />;
}

describe("DataGrid (native)", () => {
  it("quick-edits a row, bulk-edits selected rows and saves", async () => {
    const onSave = vi.fn();
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "ui::data_grid.edit_row(Latte)" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Qty" }), { target: { value: "5" } });
    fireEvent.click(screen.getByText("ui::data_grid.done"));
    expect(screen.getByText("ui::data_grid.changes(1)")).toBeTruthy();

    fireEvent.click(screen.getByText("ui::data_grid.select"));
    fireEvent.click(screen.getByRole("button", { name: "Mocha" }));
    fireEvent.click(screen.getByText("ui::data_grid.bulk_edit(1)"));
    fireEvent.change(screen.getByRole("textbox", { name: "ui::data_grid.bulk_value" }), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByText("ui::data_grid.apply"));

    await act(async () => fireEvent.click(screen.getByText("save")));
    expect(onSave).toHaveBeenCalledWith({ a: { qty: 5 }, b: { qty: 9 } });
  });

  it("sorts by a header press, edits one cell from its own press, and errors with the shared words", () => {
    const columns = [...COLUMNS, { id: "note", label: "Note" }];
    render(<DataGrid label="Menu" columns={columns} items={ROWS} />);
    expect(names()).toEqual(["ui::data_grid.edit_row(Latte)", "ui::data_grid.edit_row(Mocha)"]);
    fireEvent.click(screen.getByRole("button", { name: "ui::table.sort_by Qty" }));
    fireEvent.click(
      screen.getByRole("button", { name: "ui::table.sort_by Qty, ui::table.ascending" }),
    );
    expect(names()).toEqual(["ui::data_grid.edit_row(Mocha)", "ui::data_grid.edit_row(Latte)"]);

    fireEvent.click(screen.getByRole("button", { name: "Qty: 1" }));
    expect(screen.queryByRole("textbox", { name: "Note" })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Qty" }), { target: { value: "x" } });
    fireEvent.click(screen.getByText("ui::data_grid.done"));
    expect(screen.getByRole("button", { name: /^Qty: x, ui::data_grid\./u })).toBeTruthy();
  });

  it("follows the columns of a collection it is given", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "ui::table.sort_by Qty" })).toBeNull();
    expect(screen.getByRole("button", { name: "ui::table.sort_by Name" })).toBeTruthy();
  });
});
