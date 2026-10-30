/**
 * Stackra file contract:
 * Purpose: proves the native `DataView`'s other paths: pressable list rows and cards (media, extra fields, the
 *          caller's cells), the empty state, a custom layout, grouping from the options sheet with a header per
 *          group, removing a sort key, the filter rules written back through the RuleBuilder, a chip for an empty
 *          operator, one layout without a switch, and the phone layout when the engine's layout is not offered.
 * Boundary: React Native does not render in vitest, so react-native and the native parts DataView composes are replaced
 *           by recording stand-ins that render plain DOM; the engine is the real `useCollection`.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { CollectionLayout } from "#contracts/enums/collection-layout.enum";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { DataView } from "#native/data-view/data-view";
import type { DataViewProps } from "#native/data-view/data-view.props";
import { useCollection } from "#react/hooks/use-collection";

const seen = vi.hoisted(() => ({
  items: [] as readonly Record<string, unknown>[],
  rules: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) =>
    createElement(
      "div",
      { "aria-label": props["accessibilityLabel"] },
      props["children"] as ReactNode,
    );
  return {
    View: box,
    ScrollView: box,
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", "aria-label": props["accessibilityLabel"], onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/data-view/data-view-icons.constant", () => ({ NATIVE_DATA_VIEW_ICONS: {} }));
vi.mock("@stackra/icons/native", () => ({
  IconRegistryProvider: (props: { children: ReactNode }) => props.children,
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: { children: ReactNode; accessibilityRole?: string }) =>
      createElement("span", { role: props.accessibilityRole }, props.children),
  };
});
vi.mock("#native/search-field/search-field", () => ({ SearchField: () => null }));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: { label: string; onPress: () => void }) =>
      createElement("button", {
        type: "button",
        "aria-label": props.label,
        onClick: props.onPress,
      }),
  };
});
vi.mock("#native/close-button/close-button", async () => {
  const { createElement } = await import("react");
  return {
    CloseButton: (props: { label: string; onPress: () => void }) =>
      createElement("button", {
        type: "button",
        "aria-label": props.label,
        onClick: props.onPress,
      }),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: { children: ReactNode; onPress: () => void }) =>
      createElement("button", { type: "button", onClick: props.onPress }, props.children),
  };
});
vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return { Chip: (props: { children: ReactNode }) => createElement("span", {}, props.children) };
});
vi.mock("#native/segmented-control/segmented-control", async () => {
  const { createElement } = await import("react");
  return {
    SegmentedControl: (props: { onSelectionChange: (key: string) => void }) =>
      createElement("button", {
        type: "button",
        "aria-label": "bogus layout",
        onClick: () => props.onSelectionChange("bogus"),
      }),
  };
});
vi.mock("#native/select/select", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: {
      label: string;
      items: { id: string; label: string }[];
      onChange: (id: string | null) => void;
    }) =>
      createElement(
        "select",
        {
          "aria-label": props.label,
          onChange: (event: { target: { value: string } }) =>
            props.onChange(event.target.value || null),
        },
        [{ id: "", label: "" }, ...props.items].map((item) =>
          createElement("option", { key: item.id, value: item.id }, item.label),
        ),
      ),
  };
});
vi.mock("#native/rule-builder/rule-builder", () => ({
  RuleBuilder: (props: Record<string, unknown>) => {
    seen.rules = props;
    return null;
  },
}));
vi.mock("#native/list/list", () => ({
  List: (props: { items: readonly Record<string, unknown>[] }) => {
    seen.items = props.items;
    return null;
  },
}));
vi.mock("#native/card/card", async () => {
  const { createElement } = await import("react");
  const part = (props: { children: ReactNode }) => createElement("div", {}, props.children);
  return { Card: Object.assign(part, { Header: part, Content: part }) };
});
vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const part = (props: { children: ReactNode }) => createElement("div", {}, props.children);
  return {
    Drawer: Object.assign(
      (props: { isOpen: boolean; children: ReactNode }) =>
        props.isOpen ? createElement("div", { role: "dialog" }, props.children) : null,
      { Header: part, Title: part, Body: part, Footer: part },
    ),
  };
});

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer", isSortable: true },
  { id: "city", label: "City", isGroupable: true },
  { id: "total", label: "Total", type: "number" },
  { id: "note", label: "Note" },
];
const ROWS = [
  { id: "1", customer: "Al Noor", city: "Riyadh", total: 1200, note: "VIP" },
  { id: "2", customer: "Gulf Dates", city: "Jeddah", total: 300, note: "" },
];

type Extra = Partial<DataViewProps>;

/** A native DataView on a client engine. */
function Harness({
  layout,
  filter,
  items = ROWS,
  ...props
}: Extra & {
  readonly layout?: CollectionLayout;
  readonly filter?: CollectionFilter;
  readonly items?: typeof ROWS;
}) {
  const collection = useCollection({
    columns: COLUMNS,
    items,
    initialState: {
      ...(layout ? { layout } : {}),
      ...(filter ? { filter } : {}),
      sort: [{ column: "customer", direction: "ascending" }],
    },
  });
  return <DataView label="Customers" collection={collection} {...props} />;
}

beforeEach(() => {
  seen.items = [];
  seen.rules = {};
});

describe("DataView layouts (native)", () => {
  it("makes list rows pressable with their media", () => {
    const onItemPress = vi.fn();
    render(<Harness onItemPress={onItemPress} list={{ media: () => <i>pic</i> }} />);
    expect(seen.items[0]).toMatchObject({ title: "Al Noor", label: "Al Noor", hasChevron: true });
    expect(seen.items[0]?.["startIcon"]).toBeTruthy();
    act(() => (seen.items[1]?.["onPress"] as (() => void) | undefined)?.());
    expect(onItemPress).toHaveBeenCalledWith(ROWS[1]);
  });

  it("draws cards with their fields and the caller's cells, pressable by title", () => {
    const onItemPress = vi.fn();
    render(
      <Harness
        layout="cards"
        onItemPress={onItemPress}
        cards={{ meta: "total", fields: ["note", "gone"], media: () => <i>pic</i> }}
        renderCell={(item, column) => {
          const value = cellTextOf(item, column.id);
          return column.id === "note" ? <em>{`*${value}`}</em> : value;
        }}
      />,
    );
    expect(screen.getByText("*VIP")).toBeTruthy();
    expect(screen.getByText("1200")).toBeTruthy();
    expect(screen.getAllByText("pic")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Gulf Dates" }));
    expect(onItemPress).toHaveBeenCalledWith(ROWS[1]);
  });

  it("draws plain cards without a press", () => {
    render(<Harness layout="cards" layouts={["cards"]} />);
    expect(screen.getByText("Al Noor")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Al Noor" })).toBeNull();
    expect(screen.queryByLabelText("bogus layout")).toBeNull();
  });

  it("shows the empty state and a custom layout", () => {
    const { unmount } = render(<Harness items={[]} emptyState={<p>Nothing yet</p>} />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
    unmount();
    render(
      <Harness
        layout="board"
        layouts={["list", "board", "table"]}
        renderLayout={{ board: () => <p>the map</p> }}
      />,
    );
    expect(screen.getByText("the map")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("bogus layout"));
    expect(screen.getByText("the map")).toBeTruthy();
  });

  it("falls back to the phone layout when the engine's layout is not offered", () => {
    render(<Harness layout="cards" layouts={["list"]} phoneLayout="list" />);
    expect(seen.items).toHaveLength(2);
  });

  it("groups from the options sheet, removes a sort key and closes with Done", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Search, filter and sort"));
    fireEvent.change(screen.getByLabelText("Group by"), { target: { value: "city" } });
    expect(screen.getAllByRole("header").map((header) => header.textContent)).toContain(
      "Riyadh · 1 row",
    );
    fireEvent.change(screen.getByLabelText("Group by"), { target: { value: "none" } });
    expect(screen.queryByText("Riyadh · 1 row")).toBeNull();
    fireEvent.click(screen.getByLabelText("Remove Customer from the sort"));
    expect(screen.getByText("Not sorted: rows keep their source order.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Add a sort key"), { target: { value: "" } });
    expect(screen.getByText("Not sorted: rows keep their source order.")).toBeTruthy();
    fireEvent.click(screen.getByText("Done"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("writes the filter back through the RuleBuilder and chips an empty operator", () => {
    render(
      <Harness
        filter={{
          match: "all",
          conditions: [{ id: "c", field: "note", operator: "is_empty", value: "" }],
        }}
      />,
    );
    expect(screen.getByLabelText("Remove filter: Note is empty")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Search, filter and sort"));
    act(() =>
      (seen.rules["onChange"] as (value: CollectionFilter) => void)({
        match: "any",
        conditions: [],
      }),
    );
    expect(screen.queryByLabelText(/Remove filter/)).toBeNull();
  });
});
