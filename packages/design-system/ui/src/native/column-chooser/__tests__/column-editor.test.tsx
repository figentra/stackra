/**
 * Stackra file contract:
 * Purpose: proves the native `ColumnEditor` arranges the columns of the `useCollection` engine it is given: a reorder
 *          from the sortable list, show or hide by the checkbox and by the row's screen-reader action (never the row
 *          header), rename and pin from the opened column, density, and reset.
 * Boundary: `react-native` and the kit's parts are stand-ins that render plain DOM; the engine is the real one.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); STA-1371; ADR 0022.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement, useEffect, type ReactNode } from "react";

import type { CollectionController } from "#contracts/types/collection-controller.type";
import { ColumnEditor } from "#native/column-chooser/column-editor";
import { useCollection } from "#react/hooks/use-collection";

type Props = Record<string, unknown> & { readonly children?: ReactNode };

/** The sortable list's last props. */
const list = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return { View: (props: Props) => h("div", null, props.children) };
});
vi.mock("#native/drawer/drawer", () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const part = (props: Props) => createElement("div", null, props.children);
  return {
    Drawer: Object.assign(part, {
      Header: part,
      Title: part,
      Description: part,
      Body: part,
      Footer: part,
    }),
  };
});
vi.mock("#native/sortable-list/sortable-list", () => ({
  SortableList: (
    props: Props & { items: { id: string }[]; renderItem: (item: unknown) => ReactNode },
  ) => {
    list.props = props;
    return createElement(
      "ul",
      null,
      props.items.map((item) => createElement("li", { key: item.id }, props.renderItem(item))),
    );
  },
}));
vi.mock("#native/checkbox/checkbox", () => ({
  Checkbox: (props: Props) =>
    createElement("input", {
      type: "checkbox",
      "aria-label": props["accessibilityLabel"] ?? props["label"],
      "data-label": props["label"],
      className: props["className"],
      checked: props["value"],
      disabled: props["isDisabled"],
      onChange: (event: { target: { checked: boolean } }) =>
        (props["onChange"] as (value: boolean) => void)(event.target.checked),
    }),
}));
vi.mock("#native/segmented-control/segmented-control", () => ({
  SegmentedControl: (props: Props & { items: { id: string; label: string }[] }) =>
    createElement(
      "div",
      { role: "group", "aria-label": props["label"] },
      props.items.map((item) =>
        createElement(
          "button",
          {
            key: item.id,
            type: "button",
            "aria-pressed": props["selectedKey"] === item.id,
            onClick: () => (props["onSelectionChange"] as (key: string) => void)(item.id),
          },
          item.label,
        ),
      ),
    ),
}));
vi.mock("#native/text-field/text-field", () => ({
  TextField: (props: Props) =>
    createElement("input", {
      "aria-label": props["label"],
      value: props["value"],
      onChange: (event: { target: { value: string } }) =>
        (props["onChange"] as (value: string) => void)(event.target.value),
    }),
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Props) =>
    createElement("button", { type: "button", onClick: props["onPress"] }, props.children),
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Props) =>
    createElement("button", {
      type: "button",
      "aria-label": props["label"],
      onClick: props["onPress"],
    }),
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", () => ({
  Text: (props: Props) => createElement("span", null, props.children),
}));
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}(${Object.values(values).join("|")})` : key,
}));

const COLUMNS = [
  { id: "item", label: "Item" },
  { id: "price", label: "Price" },
  { id: "size", label: "Size" },
];

/** The engine the editor arranges, read back after each change. */
const engine = { current: undefined as unknown as CollectionController };

/** The editor on a real engine. */
function Harness() {
  const collection = useCollection({ columns: COLUMNS, items: [] });
  useEffect(() => {
    engine.current = collection;
  });
  return <ColumnEditor collection={collection} />;
}

const order = () => engine.current.columns.map((column) => column.id);
const runAction = (id: string, name: string) => {
  const actions = (
    list.props["accessibilityActionsOf"] as (item: { id: string }) => {
      name: string;
      onAction: () => void;
    }[]
  )({ id });
  act(() => actions.find((action) => action.name === name)?.onAction());
  return actions.map((action) => action.name);
};

describe("ColumnEditor (native)", () => {
  it("reorders, hides and shows, renames, pins, sets the density and resets", () => {
    render(<Harness />);
    act(() =>
      (list.props["onReorder"] as (items: { id: string }[]) => void)([
        { id: "size" },
        { id: "item" },
        { id: "price" },
      ]),
    );
    expect(order()).toEqual(["size", "item", "price"]);

    expect(
      (
        screen.getByRole("checkbox", {
          name: "ui::collection.show_column(Item)",
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
    // The box shows the column's name and shares the row with the pin and the pencil, so neither is pushed off it.
    const price = screen.getByRole("checkbox", { name: "ui::collection.show_column(Price)" });
    expect(price.getAttribute("data-label")).toBe("Price");
    expect(price.className).toContain("flex-1");
    fireEvent.click(price);
    expect(engine.current.columns.find((column) => column.id === "price")?.isHidden).toBe(true);
    expect(runAction("price", "toggle_visibility")).toEqual(["toggle_visibility", "edit_column"]);
    expect(engine.current.columns.find((column) => column.id === "price")?.isHidden).toBe(false);
    expect(runAction("item", "noop")).toEqual(["edit_column"]);

    fireEvent.click(screen.getByRole("button", { name: "ui::collection.rename_column(Size)" }));
    fireEvent.change(screen.getByRole("textbox", { name: "ui::collection.column_name" }), {
      target: { value: "Cup" },
    });
    fireEvent.click(screen.getByText("ui::collection.pin_end"));
    const size = engine.current.columns.find((column) => column.id === "size");
    expect(size).toMatchObject({ label: "Cup", pin: "end" });
    expect(order().at(-1)).toBe("size");

    fireEvent.click(screen.getByText("ui::collection.density_compact"));
    expect(engine.current.state.density).toBe("compact");

    fireEvent.click(screen.getByText("ui::collection.reset_columns"));
    expect(order()).toEqual(["item", "price", "size"]);
  });
});
