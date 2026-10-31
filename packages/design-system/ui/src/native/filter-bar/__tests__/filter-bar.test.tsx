/**
 * Stackra file contract:
 * Purpose: proves the native FilterBar, the adapted form, on a `useCollection` engine: it names its root a search and
 *          its box by `searchLabel`, writes the engine's search from the box, opens the sheet on the quick filters not
 *          yet applied, swaps the same sheet to a chosen filter's editor and draws its chip at once, writes each change
 *          as one top-level condition of the engine's filter, opens a chip's own editor with its value, removes a
 *          filter from its close button (closing its sheet), drops the chip of an emptied filter once the sheet is
 *          done, shows another condition as a read-only chip that removes it, opens the advanced rule builder over the
 *          top level, shows clear-all only while the search or filter narrows and clears both, gives the close buttons
 *          a hit area, and passes the root's other props through.
 * Boundary: React Native does not render in vitest, so react-native and the sibling native components are replaced by
 *           recording stand-ins that render plain DOM; what reaches them is checked, not their rendering. The editor has
 *           its own test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decision 10); ADR 0505 (one filter model); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-194 sta-350:FR-195 sta-350:FR-197
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { FilterBar } from "#native/filter-bar/filter-bar";
import type { FilterBarProps } from "#native/filter-bar/filter-bar.props";
import { useCollection } from "#react/hooks/use-collection";

/** The props each stand-in was last handed, by name. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement(
      "div",
      {
        "data-testid": name,
        role: props["accessibilityRole"] as string | undefined,
        "aria-label": props["accessibilityLabel"] as string | undefined,
        "data-extra": props["testID"] as string | undefined,
      },
      props["children"] as ReactNode,
    );
  };
  return { View: box("root"), ScrollView: box("row") };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-text": "true" }, props["children"] as ReactNode),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          disabled: props["isDisabled"] === true,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("#native/close-button/close-button", async () => {
  const { createElement } = await import("react");
  return {
    CloseButton: (props: Record<string, unknown>) => {
      received.props[`close:${String(props["label"])}`] = props;
      return createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        onClick: props["onPress"] as () => void,
      });
    },
  };
});

vi.mock("#native/search-field/search-field", async () => {
  const { createElement } = await import("react");
  return {
    SearchField: (props: Record<string, unknown>) => {
      received.props["search"] = props;
      return createElement("input", {
        "aria-label": props["accessibilityLabel"] as string,
        placeholder: props["placeholder"] as string | undefined,
        value: props["value"] as string,
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (text: string) => void)(event.target.value),
      });
    },
  };
});

vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const part = (tag: string, name: string) => (props: Record<string, unknown>) =>
    createElement(tag, { "data-part": name }, props["children"] as ReactNode);
  const Drawer = Object.assign(
    (props: Record<string, unknown>) => {
      received.props["drawer"] = props;
      return props["isOpen"]
        ? createElement(
            "div",
            { role: "dialog", "aria-label": props["label"] as string },
            props["children"] as ReactNode,
          )
        : null;
    },
    {
      Header: part("div", "header"),
      Title: part("h2", "title"),
      Body: part("div", "body"),
      Footer: part("div", "footer"),
    },
  );
  return { Drawer };
});

vi.mock("#native/filter-bar/filter-editor", async () => {
  const { createElement } = await import("react");
  return {
    FilterEditor: (props: Record<string, unknown>) => {
      received.props["editor"] = props;
      const definition = props["definition"] as FilterDefinition;
      return createElement(
        "button",
        {
          type: "button",
          onClick: () => (props["onChange"] as (value: unknown) => void)("typed"),
        },
        `Editor ${definition.label}`,
      );
    },
  };
});

vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { "data-chip": "true", "data-tone": props["tone"] as string | undefined },
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
        "aria-label": props["label"] as string,
        "aria-description": props["accessibilityHint"] as string | undefined,
      }),
  };
});

vi.mock("#native/rule-builder/rule-builder", async () => {
  const { createElement } = await import("react");
  return {
    RuleBuilder: (props: Record<string, unknown>) => {
      received.props["rules"] = props;
      return createElement("div", { "data-testid": "rules" }, "Rule builder");
    },
  };
});

const COLUMNS: readonly CollectionColumn[] = [
  {
    id: "status",
    label: "Status",
    type: "choice",
    options: [
      { id: "paid", label: "Paid" },
      { id: "shipped", label: "Shipped" },
    ],
  },
  { id: "customer", label: "Customer" },
  { id: "note", label: "Note", isFilterable: false },
];

const EMPTY: CollectionFilter = { match: "all", conditions: [] };

/** A filter of quick conditions, by field: text `contains`, a list `in`. */
const quick = (values: Readonly<Record<string, string | readonly string[]>>): CollectionFilter => ({
  match: "all",
  conditions: Object.entries(values).map(([field, value]) => ({
    id: `filter:${field}`,
    field,
    operator: typeof value === "string" ? "contains" : "in",
    value,
  })),
});

/** The engine the harness last drew. */
const latest = { collection: undefined as CollectionController | undefined };

/** The engine's filter as `field operator value` lines. */
const conditions = () =>
  latest.collection?.state.filter.conditions.map(
    (entry) => `${entry.field} ${entry.operator} ${JSON.stringify(entry.value)}`,
  );

/** An engine over no rows, with the bar on it. */
function Harness({
  filter = EMPTY,
  search = "",
  ...rest
}: {
  readonly filter?: CollectionFilter;
  readonly search?: string;
} & Partial<FilterBarProps>): ReactNode {
  const collection = useCollection({ columns: COLUMNS, initialState: { filter, search } });
  useEffect(() => {
    latest.collection = collection;
  });
  return <FilterBar collection={collection} searchLabel="Search orders" {...rest} />;
}

const press = (element: HTMLElement) => act(() => element.click());
const sheet = () => screen.getByRole("dialog");

describe("FilterBar (native)", () => {
  beforeEach(() => {
    received.props = {};
    latest.collection = undefined;
  });

  it("is a search named after the box, and the box is named by searchLabel", () => {
    render(<Harness searchPlaceholder="Order number" />);
    expect(screen.getByRole("search", { name: "Search orders, filters" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search orders" }).getAttribute("placeholder")).toBe(
      "Order number",
    );
  });

  it("takes the root's name from accessibilityLabel when given, and passes other props through", () => {
    render(<Harness accessibilityLabel="Order filters" testID="orders-filters" />);
    expect(screen.getByRole("search", { name: "Order filters" })).toBeTruthy();
    expect(received.props["root"]).toMatchObject({ testID: "orders-filters" });
  });

  it("writes the engine's search from the box, keeping the filter", () => {
    render(<Harness search="ada" filter={quick({ status: ["paid"] })} />);
    const box = screen.getByRole<HTMLInputElement>("textbox", { name: "Search orders" });
    expect(box.value).toBe("ada");
    fireEvent.change(box, { target: { value: "grace" } });
    expect(latest.collection?.state.search).toBe("grace");
    expect(conditions()).toEqual(['status in ["paid"]']);
  });

  it("lays the chips out in a horizontal row", () => {
    render(<Harness />);
    expect(received.props["row"]).toMatchObject({ horizontal: true });
  });

  it("opens the sheet on the filterable columns not yet applied", () => {
    render(<Harness filter={quick({ customer: "ada" })} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    press(screen.getByRole("button", { name: "Add filter" }));
    const names = within(sheet())
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(names).toEqual(["Status", "Done"]);
    expect(sheet().getAttribute("aria-label")).toBe("Add filter");
  });

  it("disables the add button when every filter is applied", () => {
    render(<Harness filter={quick({ customer: "ada", status: ["paid"] })} />);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Add filter" }).disabled).toBe(
      true,
    );
  });

  it("swaps the same sheet to the chosen filter's editor and draws its chip", () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: "Add filter" }));
    press(within(sheet()).getByRole("button", { name: "Status" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(sheet().getAttribute("aria-label")).toBe("Status");
    expect(within(sheet()).getByRole("button", { name: "Editor Status" })).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "Status" }).some((button) => !sheet().contains(button)),
    ).toBe(true);
    expect(conditions()).toEqual([]);
  });

  it("writes an editor's change at once as a condition and on the chip", () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: "Add filter" }));
    press(within(sheet()).getByRole("button", { name: "Customer" }));
    press(within(sheet()).getByRole("button", { name: "Editor Customer" }));
    expect(conditions()).toEqual(['customer contains "typed"']);
    press(within(sheet()).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Customer: typed" })).toBeTruthy();
  });

  it("draws one chip per applied filter, and opens a chip's own editor with its value", () => {
    render(<Harness filter={quick({ customer: "ada", status: ["shipped"] })} />);
    const chips = screen
      .getAllByRole("button")
      .map((button) => button.textContent)
      .filter((text) => text?.includes(": "));
    expect(chips).toEqual(["Status: Shipped", "Customer: ada"]);
    press(screen.getByRole("button", { name: "Status: Shipped" }));
    expect(within(sheet()).getByRole("button", { name: "Editor Status" })).toBeTruthy();
    expect(received.props["editor"]).toMatchObject({ value: ["shipped"] });
  });

  it("drops the chip of a filter left empty once the sheet is done", () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: "Add filter" }));
    press(within(sheet()).getByRole("button", { name: "Customer" }));
    press(within(sheet()).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("button", { name: "Customer" })).toBeNull();
    expect(conditions()).toEqual([]);
  });

  it("removes a filter from its close button, closing the sheet if it was that filter's", () => {
    render(<Harness filter={quick({ status: ["paid"], customer: "ada" })} />);
    press(screen.getByRole("button", { name: "Status: Paid" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    press(screen.getByRole("button", { name: "Remove filter Status" }));
    expect(conditions()).toEqual(['customer contains "ada"']);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows another condition as a read-only chip that removes it", () => {
    render(
      <Harness
        filter={{
          match: "all",
          conditions: [{ id: "c1", field: "customer", operator: "is_empty", value: "" }],
        }}
      />,
    );
    expect(screen.getByText("Customer is empty")).toBeTruthy();
    press(screen.getByRole("button", { name: "Remove filter Customer is empty" }));
    expect(conditions()).toEqual([]);
  });

  it("marks a chip in unappliedIds as a warning, led by a button whose name and hint say it is not applied", () => {
    const filter: CollectionFilter = {
      match: "all",
      conditions: [{ id: "c1", field: "customer", operator: "is_empty", value: "" }],
    };
    const { rerender } = render(<Harness filter={filter} />);
    expect(screen.queryByRole("button", { name: "Not applied on the server" })).toBeNull();
    expect(screen.getByText("Customer is empty").getAttribute("data-tone")).toBeNull();
    rerender(<Harness filter={filter} unappliedIds={["c1"]} />);
    const mark = screen.getByRole("button", { name: "Not applied on the server" });
    expect(mark.getAttribute("aria-description")).toBe("Not applied on the server");
    expect(screen.getByText("Customer is empty").getAttribute("data-tone")).toBe("warning");
  });

  it("opens the rule builder over the filter's top level from Advanced", () => {
    render(<Harness filter={quick({ customer: "ada" })} />);
    press(screen.getByRole("button", { name: "Advanced" }));
    expect(sheet().getAttribute("aria-label")).toBe("Advanced");
    expect(received.props["rules"]).toMatchObject({
      value: quick({ customer: "ada" }),
    });
    expect(
      ((received.props["rules"] ?? {})["fields"] as readonly { key: string }[]).map(
        (field) => field.key,
      ),
    ).toEqual(["status", "customer"]);
  });

  it("gives the close buttons a hit area, so a touch target is at least 24 points", () => {
    render(<Harness filter={quick({ status: ["paid"] })} />);
    expect(received.props["close:Remove filter Status"]).toMatchObject({ hitSlop: 8 });
  });

  it("shows clear-all only while the search or filter narrows, and clears both", () => {
    render(<Harness filter={quick({ status: ["paid"] })} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search orders" }), {
      target: { value: "ada" },
    });
    press(screen.getByRole("button", { name: "Clear all" }));
    expect(latest.collection?.state.search).toBe("");
    expect(conditions()).toEqual([]);
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("types: extends its contract and needs the engine", () => {
    expectTypeOf<FilterBarProps>().toExtend<FilterBarContractProps>();
    // @ts-expect-error the bar needs its engine
    void (<FilterBar searchLabel="Search" />);
  });
});
