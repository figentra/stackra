/**
 * Stackra file contract:
 * Purpose: proves the native DataGrid's edit sheet and modes: each column type gets its field (a switch for a boolean,
 *          a select of the options, a text field with a decimal pad for numbers and a left-to-right date), each field
 *          says why its draft is wrong (required, type, min, max, a custom rule), Cancel and dismissing drop the
 *          draft, selection toggles and cancels, the bulk sheet switches column and cancels, the matrix totals each
 *          row and the grid, and a read-only grid edits nothing.
 * Boundary: `react-native` and the kit's parts are stand-ins that render plain DOM form controls; `useUiText` writes
 *           the key with its values.
 * Runtime: node
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid on a phone); ADR 0505; ADR 0022.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { DataGrid } from "#native/data-grid/data-grid";

type Props = Record<string, unknown> & { readonly children?: ReactNode };

const state = vi.hoisted(() => ({ drawers: [] as Props[] }));

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    View: (props: Props) => h("div", null, props.children),
    ScrollView: (props: Props) => h("div", null, props.children),
    Pressable: (props: Props) =>
      h(
        "button",
        {
          "aria-label": props["accessibilityLabel"],
          "data-role": props["accessibilityRole"],
          onClick: props["onPress"],
        },
        props.children,
      ),
    FlatList: (
      props: Props & {
        data: { id: string }[];
        renderItem: (info: { item: unknown }) => ReactNode;
        keyExtractor: (item: unknown) => string;
      },
    ) =>
      h(
        "div",
        null,
        props.data.map((item) =>
          h("div", { key: props.keyExtractor(item) }, props.renderItem({ item })),
        ),
        props["ListFooterComponent"] as ReactNode,
      ),
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
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/select/select", () => ({
  Select: (props: Props & { items: { id: string; label: string }[] }) =>
    createElement(
      "select",
      {
        "aria-label": props["label"],
        "aria-errormessage": props["errorMessage"],
        value: (props["value"] as string | null) ?? "",
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (id: string | null) => void)(event.target.value || null),
      },
      [{ id: "", label: "" }, ...props.items].map((item) =>
        createElement("option", { key: item.id, value: item.id }, item.label),
      ),
    ),
}));
vi.mock("#native/switch/switch", () => ({
  Switch: (props: Props) =>
    createElement("input", {
      type: "checkbox",
      "aria-label": props["label"],
      checked: props["value"],
      onChange: (event: { target: { checked: boolean } }) =>
        (props["onChange"] as (value: boolean) => void)(event.target.checked),
    }),
}));
vi.mock("#native/text-field/text-field", () => ({
  TextField: (props: Props) =>
    createElement("input", {
      "aria-label": props["label"],
      "aria-errormessage": props["errorMessage"],
      inputMode: props["keyboardType"] === "decimal-pad" ? "decimal" : undefined,
      placeholder: props["placeholder"],
      dir: (props["style"] as { writingDirection?: string } | undefined)?.writingDirection,
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
        )
      : null,
}));
vi.mock("#native/drawer/drawer", () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const part = (props: Props) => createElement("div", null, props.children);
  return {
    Drawer: Object.assign(
      (props: Props) => {
        state.drawers.push(props);
        return props["isOpen"] ? createElement("dialog", { open: true }, props.children) : null;
      },
      { Header: part, Title: part, Body: part, Footer: part },
    ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: Record<string, unknown>) =>
    values && Object.keys(values).length > 0 ? `${key}(${Object.values(values).join("|")})` : key,
}));

const K = "ui::data_grid.";
const COLUMNS: readonly CollectionColumn[] = [
  { id: "name", label: "Name", isRequired: true },
  { id: "qty", label: "Qty", type: "number" as const, min: 1, max: 9 },
  { id: "on", label: "On", type: "boolean" as const },
  { id: "size", label: "Size", type: "choice" as const, options: [{ id: "s", label: "Small" }] },
  { id: "day", label: "Day", type: "date" as const, validate: () => "Not a weekday" },
];
const ROWS = [
  { id: "a", name: "Latte", qty: 1, on: true, size: "s", day: "2026-10-01" },
  { id: "b", name: "Mocha", qty: null, on: false, size: null, day: null },
];
const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const type = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });
const errorOf = (name: string) => screen.getByLabelText(name).getAttribute("aria-errormessage");
const openRow = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name: `${K}edit_row(${name})` }));

beforeEach(() => {
  state.drawers.length = 0;
});

describe("DataGrid fields (native)", () => {
  it("draws each column's field from the row and says why a draft is wrong", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    openRow("Latte");
    expect(field("Name").value).toBe("Latte");
    expect(field("Qty")).toMatchObject({ value: "1", inputMode: "decimal", dir: "ltr" });
    expect(field("On").checked).toBe(true);
    expect((screen.getByLabelText("Size") as HTMLSelectElement).value).toBe("s");
    expect(field("Day")).toMatchObject({ placeholder: "YYYY-MM-DD", dir: "ltr" });
    expect(errorOf("Day")).toBe("Not a weekday");

    type("Name", "");
    expect(errorOf("Name")).toBe(`${K}required`);
    type("Qty", "abc");
    expect(errorOf("Qty")).toBe(`${K}type`);
    type("Qty", "0");
    expect(errorOf("Qty")).toBe(`${K}min(1)`);
    type("Qty", "12");
    expect(errorOf("Qty")).toBe(`${K}max(9)`);
    fireEvent.click(field("On"));
    expect(field("On").checked).toBe(false);
    type("Size", "");
    expect((screen.getByLabelText("Size") as HTMLSelectElement).value).toBe("");
  });

  it("starts empty drafts for empty cells and drops the draft on cancel or dismiss", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    openRow("Mocha");
    expect(field("Qty").value).toBe("");
    expect(field("On").checked).toBe(false);
    type("Qty", "3");
    fireEvent.click(screen.getByText(`${K}cancel`));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText(/changes/)).toBeNull();

    openRow("Mocha");
    const sheet = [...state.drawers].reverse().find((drawer) => drawer["isOpen"] === true);
    act(() => (sheet?.["onOpenChange"] as ((isOpen: boolean) => void) | undefined)?.(true));
    expect(screen.getByRole("dialog")).toBeTruthy();
    act(() => (sheet?.["onOpenChange"] as ((isOpen: boolean) => void) | undefined)?.(false));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("toggles rows in and out of the selection and cancels it", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    fireEvent.click(screen.getByText(`${K}select`));
    const latte = screen.getByRole("button", { name: "Latte" });
    expect(latte.dataset["role"]).toBe("checkbox");
    expect(screen.getByText(`${K}bulk_edit(0)`)).toHaveProperty("disabled", true);
    fireEvent.click(latte);
    fireEvent.click(screen.getByRole("button", { name: "Mocha" }));
    fireEvent.click(screen.getByRole("button", { name: "Latte" }));
    expect(screen.getByText(`${K}bulk_edit(1)`)).toBeTruthy();
    fireEvent.click(screen.getByText(`${K}cancel`));
    expect(screen.getByText(`${K}select`)).toBeTruthy();
  });

  it("switches the bulk column, fills it and cancels without writing", () => {
    render(<DataGrid label="Menu" columns={COLUMNS} items={ROWS} />);
    fireEvent.click(screen.getByText(`${K}select`));
    fireEvent.click(screen.getByRole("button", { name: "Latte" }));
    fireEvent.click(screen.getByText(`${K}bulk_edit(1)`));
    expect((screen.getByLabelText(`${K}bulk_column`) as HTMLSelectElement).value).toBe("name");
    type(`${K}bulk_column`, "on");
    expect(field(`${K}bulk_value`).type).toBe("checkbox");
    type(`${K}bulk_column`, "");
    expect((screen.getByLabelText(`${K}bulk_column`) as HTMLSelectElement).value).toBe("name");
    fireEvent.click(screen.getAllByText(`${K}cancel`).at(-1) as HTMLElement);
    expect(screen.queryByLabelText(`${K}bulk_value`)).toBeNull();
    expect(screen.queryByText(/changes/)).toBeNull();
  });

  it("totals each row and the grid in a matrix", () => {
    render(
      <DataGrid
        label="Hours"
        variant="matrix"
        columns={[
          { id: "who", label: "Who", isReadOnly: true },
          { id: "mon", label: "Mon", type: "number" },
          { id: "tue", label: "Tue", type: "number" },
        ]}
        items={[
          { id: "a", who: "Ada", mon: 2, tue: 3 },
          { id: "b", who: "Bob", mon: 4, tue: null },
        ]}
      />,
    );
    // The totals column's heading and the total row's name.
    expect(screen.getAllByText(`${K}total`)).toHaveLength(2);
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: `${K}edit_row(Bob)` }).getAttribute("aria-label"),
    ).toBeTruthy();
  });

  it("offers no selection and no row editor when read-only", () => {
    render(<DataGrid label="Menu" columns={[]} items={[{ id: "r1" }]} isReadOnly className="x" />);
    expect(screen.queryByText(`${K}select`)).toBeNull();
    expect(screen.queryByRole("button", { name: `${K}edit_row(r1)` })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
