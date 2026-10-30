/**
 * Stackra file contract:
 * Purpose: proves the native `DataView`: the search narrows the engine's rows and the count says so; the list view
 *          hands the List the title, subtitle and meta of each row; switching to cards keeps the search; the options
 *          sheet adds a sort key and flips its direction; a filter condition is a chip whose button removes it.
 * Boundary: React Native does not render in vitest, so react-native and the native parts DataView composes are replaced
 *           by recording stand-ins that render plain DOM; the engine is the real `useCollection`.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { DataView } from "#native/data-view/data-view";
import { useCollection } from "#react/hooks/use-collection";

/** What the List stand-in was last handed. */
const seen = vi.hoisted(() => ({ items: [] as readonly Record<string, unknown>[] }));

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
        { type: "button", onClick: props["onPress"] },
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
  return { Text: (props: { children: ReactNode }) => createElement("span", {}, props.children) };
});
vi.mock("#native/search-field/search-field", async () => {
  const { createElement } = await import("react");
  return {
    SearchField: (props: {
      value: string;
      onChange: (value: string) => void;
      "aria-label": string;
    }) =>
      createElement("input", {
        "aria-label": props["aria-label"],
        value: props.value,
        onChange: (event: { target: { value: string } }) => props.onChange(event.target.value),
      }),
  };
});
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
    SegmentedControl: (props: {
      items: { id: string; label: string }[];
      onSelectionChange: (key: string) => void;
    }) =>
      createElement(
        "div",
        {},
        props.items.map((item) =>
          createElement(
            "button",
            { type: "button", key: item.id, onClick: () => props.onSelectionChange(item.id) },
            item.label,
          ),
        ),
      ),
  };
});
vi.mock("#native/select/select", async () => {
  const { createElement } = await import("react");
  return {
    Select: (props: {
      label: string;
      items: { id: string; label: string }[];
      onChange: (id: string) => void;
    }) =>
      createElement(
        "select",
        {
          "aria-label": props.label,
          onChange: (event: { target: { value: string } }) => props.onChange(event.target.value),
        },
        props.items.map((item) =>
          createElement("option", { key: item.id, value: item.id }, item.label),
        ),
      ),
  };
});
vi.mock("#native/rule-builder/rule-builder", () => ({ RuleBuilder: () => null }));
vi.mock("#native/list/list", () => ({
  List: (props: { items: readonly Record<string, unknown>[] }) => {
    seen.items = props.items;
    return null;
  },
}));
vi.mock("#native/card/card", async () => {
  const { createElement } = await import("react");
  const part = (props: { children: ReactNode }) =>
    createElement("div", { "data-testid": "card" }, props.children);
  return { Card: Object.assign(part, { Header: part, Content: part }) };
});
vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const part = (props: { children: ReactNode }) => createElement("div", {}, props.children);
  return {
    Drawer: Object.assign(
      (props: { isOpen: boolean; children: ReactNode }) =>
        props.isOpen ? createElement("div", {}, props.children) : null,
      { Header: part, Title: part, Body: part, Footer: part },
    ),
  };
});

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer", isSortable: true },
  { id: "city", label: "City", isSortable: true },
  { id: "total", label: "Total", type: "number", isSortable: true },
];
const ROWS = [
  { id: "1", customer: "Al Noor Trading", city: "Riyadh", total: 1200 },
  { id: "2", customer: "Gulf Dates Co.", city: "Jeddah", total: 300 },
];

/** A native DataView on a client engine. */
function Harness() {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    initialState: {
      filter: {
        match: "all",
        conditions: [{ id: "c", field: "total", operator: "greater", value: "0" }],
      },
    },
  });
  return <DataView label="Customers" collection={collection} list={{ meta: "total" }} />;
}

describe("DataView (native)", () => {
  it("searches the engine and hands the List each row's title, subtitle and meta", () => {
    render(<Harness />);
    expect(screen.getByText("2 results")).toBeTruthy();
    expect(seen.items[0]).toMatchObject({
      title: "Al Noor Trading",
      description: "Riyadh",
      endContent: "1200",
    });
    fireEvent.change(screen.getByLabelText("Search Customers"), { target: { value: "jeddah" } });
    expect(screen.getByText("1 result")).toBeTruthy();
    fireEvent.click(screen.getByText("Cards"));
    expect(screen.getAllByText("Gulf Dates Co.").length).toBeGreaterThan(0);
    expect(screen.getByText("1 result")).toBeTruthy();
  });

  it("adds and flips a sort key in the options sheet", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Search, filter and sort"));
    fireEvent.change(screen.getByLabelText("Add a sort key"), { target: { value: "total" } });
    fireEvent.click(screen.getByLabelText("Direction of Total: ascending"));
    expect(screen.getByLabelText("Direction of Total: descending")).toBeTruthy();
    expect(seen.items[0]).toMatchObject({ title: "Al Noor Trading" });
  });

  it("removes a filter condition from its chip", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Remove filter: Total is more than 0"));
    expect(screen.queryByLabelText(/Remove filter/)).toBeNull();
  });
});
