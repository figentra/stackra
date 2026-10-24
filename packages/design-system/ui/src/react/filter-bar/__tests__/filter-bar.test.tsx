/**
 * Stackra file contract:
 * Purpose: proves the web FilterBar names its search landmark and box, edits only `search` of the query from the box,
 *          lists in its add-filter menu only the filters not yet applied, opens the editor of a chosen filter in a popover
 *          named by the filter with its chip already drawn, applies each change at once, draws one chip per applied filter
 *          in the order applied with the value written out, drops the chip and the key of an emptied filter when its
 *          editor closes, removes a filter from its close button and moves focus on, shows clear-all only while the query
 *          narrows and clears search and filters but not the sort, says how many filters are applied, edits every kind
 *          (text, choice, several choices in list order, yes or no, a number range and a date range), passes unknown
 *          props and the ref through, and types as its contract.
 * Boundary: jsdom with real HeroUI and React Aria; NumberField and DateField, which are leaf groups built beside this
 *           one, are replaced by recording stand-ins, so what the bar hands them and does with their changes is checked,
 *           not their own rendering. The theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-194 sta-350:FR-195 sta-350:FR-196
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef, useState, type ReactNode } from "react";

import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { FilterBar, type FilterBarProps } from "#react/filter-bar/filter-bar";

/** The props each stand-in was last handed, by name, as the real field would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("#react/number-field/number-field", async () => {
  const { createElement } = await import("react");
  return {
    NumberField: (props: Record<string, unknown>) => {
      received.props[String(props["label"])] = props;
      return createElement(
        "button",
        {
          type: "button",
          onClick: () => (props["onChange"] as (value: number | null) => void)(7),
        },
        `Set ${String(props["label"])}`,
      );
    },
  };
});

vi.mock("#react/date-field/date-field", async () => {
  const { createElement } = await import("react");
  const { CalendarDate: Day } = await import("@internationalized/date");
  return {
    DateField: (props: Record<string, unknown>) => {
      received.props[String(props["label"])] = props;
      return createElement(
        "button",
        {
          type: "button",
          onClick: () => (props["onChange"] as (value: unknown) => void)(new Day(2026, 3, 1)),
        },
        `Set ${String(props["label"])}`,
      );
    },
  };
});

const FILTERS: readonly FilterDefinition[] = [
  {
    id: "status",
    label: "Status",
    kind: "select",
    options: [
      { id: "paid", label: "Paid" },
      { id: "shipped", label: "Shipped" },
    ],
  },
  {
    id: "region",
    label: "Region",
    kind: "multi-select",
    options: [
      { id: "eu", label: "Europe" },
      { id: "us", label: "United States" },
      { id: "apac", label: "Asia Pacific" },
    ],
  },
  { id: "customer", label: "Customer", kind: "text", placeholder: "Name contains" },
  { id: "gift", label: "Gift", kind: "boolean" },
  { id: "total", label: "Total", kind: "number", minValue: 0, maxValue: 1000, step: 5 },
  {
    id: "placed",
    label: "Placed",
    kind: "date-range",
    minValue: new CalendarDate(2026, 1, 1),
    maxValue: new CalendarDate(2026, 12, 31),
  },
];

const EMPTY: ResourceQuery = { search: "", filterValues: {}, sort: null };

/** What the harness last held, so a test can read the query the bar asked for. */
const latest = { query: EMPTY };

/** Holds the query as an app would, so the bar is exercised controlled. */
function Harness({
  initial = EMPTY,
  ...rest
}: { readonly initial?: ResourceQuery } & Partial<FilterBarProps>): ReactNode {
  const [query, setQuery] = useState(initial);
  return (
    <FilterBar
      query={query}
      onQueryChange={(next) => {
        latest.query = next;
        setQuery(next);
      }}
      filters={FILTERS}
      searchLabel="Search orders"
      {...rest}
    />
  );
}

const press = (element: HTMLElement) => act(() => element.click());
const dialog = (name: string) => screen.getByRole("dialog", { name });
/** The button of a chip that opens its editor; the chip's other button removes it. */
const triggerOf = (name: string) =>
  within(screen.getByRole("group", { name })).getByRole("button", {
    name: new RegExp(`^${name}`),
  });

/** Chooses a filter from the add-filter menu and returns once its editor is open. */
async function add(label: string) {
  press(screen.getByRole("button", { name: "Add filter" }));
  press(screen.getByRole("menuitem", { name: label }));
  return await screen.findByRole("dialog", { name: label });
}

describe("FilterBar (web)", () => {
  beforeEach(() => {
    received.props = {};
    latest.query = EMPTY;
    // jsdom has no layout, and the menu scrolls the focused item into view on a timer, which would throw late.
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("is a search landmark named after the search box, and the box is named by searchLabel", () => {
    render(<Harness searchPlaceholder="Order number" />);
    expect(screen.getByRole("search", { name: "Search orders, filters" })).toBeTruthy();
    const box = screen.getByRole("searchbox", { name: "Search orders" });
    expect(box.getAttribute("placeholder")).toBe("Order number");
  });

  it("takes the landmark's name from aria-label when given", () => {
    render(<Harness aria-label="Order filters" />);
    expect(screen.getByRole("search", { name: "Order filters" })).toBeTruthy();
  });

  it("shows the search text of the query and edits only the search, keeping filters and sort", () => {
    const sort = { column: "total", direction: "ascending" } as const;
    render(<Harness initial={{ search: "ada", filterValues: { status: "paid" }, sort }} />);
    const box = screen.getByRole<HTMLInputElement>("searchbox", { name: "Search orders" });
    expect(box.value).toBe("ada");
    fireEvent.change(box, { target: { value: "grace" } });
    expect(latest.query).toEqual({ search: "grace", filterValues: { status: "paid" }, sort });
  });

  it("lists in the add-filter menu only the filters that are not applied", () => {
    render(<Harness initial={{ ...EMPTY, filterValues: { status: "paid" } }} />);
    press(screen.getByRole("button", { name: "Add filter" }));
    const names = screen.getAllByRole("menuitem").map((item) => item.textContent);
    expect(names).toEqual(["Region", "Customer", "Gift", "Total", "Placed"]);
  });

  it("disables the add button when every filter is applied", () => {
    const only: readonly FilterDefinition[] = [FILTERS[0] as FilterDefinition];
    render(<Harness filters={only} initial={{ ...EMPTY, filterValues: { status: "paid" } }} />);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Add filter" }).disabled).toBe(
      true,
    );
  });

  it("draws one chip per applied filter, in the order applied, with the value written out", () => {
    render(
      <Harness
        initial={{
          ...EMPTY,
          filterValues: { region: ["eu", "us", "apac"], status: "paid", gift: false },
        }}
      />,
    );
    // The search field's own group has no such name, so only the chips are found by the filters' labels.
    const chips = screen
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-label"))
      .filter((name) => FILTERS.some((filter) => filter.label === name));
    expect(chips).toEqual(["Region", "Status", "Gift"]);
    expect(triggerOf("Region").textContent).toContain("Region: Europe, United States +1");
    expect(triggerOf("Status").textContent).toContain("Status: Paid");
    expect(triggerOf("Gift").textContent).toContain("Gift: No");
  });

  it("ignores a filter the list does not offer and a value that filters nothing", () => {
    render(<Harness initial={{ ...EMPTY, filterValues: { status: "", unknown: "x" } }} />);
    for (const filter of FILTERS)
      expect(screen.queryByRole("group", { name: filter.label })).toBeNull();
  });

  it("opens the editor of a chosen filter in a popover named by it, with its chip drawn", async () => {
    render(<Harness />);
    const editor = await add("Status");
    expect(within(editor).getByRole("heading", { level: 2, name: "Status" })).toBeTruthy();
    expect(within(editor).getByRole("radiogroup", { name: "Status" })).toBeTruthy();
    expect(within(editor).getAllByRole("radio")).toHaveLength(2);
    expect(latest.query.filterValues).toEqual({});
  });

  it("applies a choice at once, writes it on the chip, and keeps the chip when the editor closes", async () => {
    render(<Harness />);
    const editor = await add("Status");
    press(within(editor).getByRole("radio", { name: "Shipped" }));
    expect(latest.query.filterValues).toEqual({ status: "shipped" });
    fireEvent.keyDown(dialog("Status"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(triggerOf("Status").textContent).toContain("Status: Shipped");
    expect(screen.getByRole("status").textContent).toBe("1 filter applied");
  });

  it("reopens the editor of an applied filter from its chip, showing its value", () => {
    render(<Harness initial={{ ...EMPTY, filterValues: { status: "paid" } }} />);
    press(triggerOf("Status"));
    const editor = dialog("Status");
    expect(within(editor).getByRole<HTMLInputElement>("radio", { name: "Paid" }).checked).toBe(
      true,
    );
  });

  it("drops the chip and the key of a filter left empty when its editor closes, and focuses add", async () => {
    render(<Harness />);
    await add("Customer");
    expect(screen.getByRole("textbox", { name: "Customer" }).getAttribute("placeholder")).toBe(
      "Name contains",
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Customer" }), {
      target: { value: "ada" },
    });
    expect(latest.query.filterValues).toEqual({ customer: "ada" });
    fireEvent.change(screen.getByRole("textbox", { name: "Customer" }), { target: { value: "" } });
    expect(latest.query.filterValues).toEqual({});
    fireEvent.keyDown(dialog("Customer"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("group", { name: "Customer" })).toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add filter" })),
    );
  });

  it("reports several choices in the order the options are listed, not the order they were ticked", async () => {
    render(<Harness />);
    const editor = await add("Region");
    press(within(editor).getByRole("checkbox", { name: "Asia Pacific" }));
    press(within(editor).getByRole("checkbox", { name: "Europe" }));
    expect(latest.query.filterValues).toEqual({ region: ["eu", "apac"] });
  });

  it("asks a yes or no with the filter's own words and reports a boolean, no included", async () => {
    const worded: readonly FilterDefinition[] = [
      { id: "gift", label: "Gift", kind: "boolean", trueLabel: "A gift", falseLabel: "Not a gift" },
    ];
    render(<Harness filters={worded} />);
    const editor = await add("Gift");
    press(within(editor).getByRole("radio", { name: "Not a gift" }));
    expect(latest.query.filterValues).toEqual({ gift: false });
    press(within(editor).getByRole("radio", { name: "A gift" }));
    expect(latest.query.filterValues).toEqual({ gift: true });
  });

  it("edits a number range through two fields that take the filter's bounds, step and format", async () => {
    render(<Harness />);
    const editor = await add("Total");
    expect(received.props["Minimum"]).toMatchObject({ minValue: 0, maxValue: 1000, step: 5 });
    expect(received.props["Maximum"]).toMatchObject({ minValue: 0, maxValue: 1000, step: 5 });
    press(within(editor).getByRole("button", { name: "Set Minimum" }));
    expect(latest.query.filterValues).toEqual({ total: { min: 7, max: null } });
    press(within(editor).getByRole("button", { name: "Set Maximum" }));
    expect(latest.query.filterValues).toEqual({ total: { min: 7, max: 7 } });
  });

  it("edits a day range through two fields, each bound by the other and by the filter's bounds", async () => {
    render(<Harness />);
    const editor = await add("Placed");
    expect(received.props["From"]).toMatchObject({ minValue: new CalendarDate(2026, 1, 1) });
    expect(received.props["Until"]).toMatchObject({ maxValue: new CalendarDate(2026, 12, 31) });
    press(within(editor).getByRole("button", { name: "Set From" }));
    expect(latest.query.filterValues).toEqual({
      placed: { start: new CalendarDate(2026, 3, 1), end: null },
    });
    expect(received.props["Until"]).toMatchObject({ minValue: new CalendarDate(2026, 3, 1) });
  });

  it("removes a filter from its close button and moves focus to the add button", async () => {
    render(<Harness initial={{ ...EMPTY, filterValues: { status: "paid", gift: true } }} />);
    press(screen.getByRole("button", { name: "Remove filter Status" }));
    expect(latest.query.filterValues).toEqual({ gift: true });
    expect(screen.queryByRole("group", { name: "Status" })).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add filter" })),
    );
  });

  it("shows clear-all only while the query narrows, and clears search and filters but not the sort", () => {
    const sort = { column: "total", direction: "descending" } as const;
    render(<Harness initial={{ search: "", filterValues: {}, sort }} />);
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search orders" }), {
      target: { value: "ada" },
    });
    expect(screen.getByRole("button", { name: "Clear all" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Clear all" }));
    expect(latest.query).toEqual({ search: "", filterValues: {}, sort });
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("does not offer clear-all for a sort alone", () => {
    render(
      <Harness
        initial={{ search: "", filterValues: {}, sort: { column: "a", direction: "ascending" } }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("says how many filters are applied", () => {
    const { rerender } = render(<Harness key="none" />);
    expect(screen.getByRole("status").textContent).toBe("No filters applied");
    rerender(
      <Harness key="two" initial={{ ...EMPTY, filterValues: { status: "paid", gift: true } }} />,
    );
    expect(screen.getByRole("status").textContent).toBe("2 filters applied");
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Harness data-testid="orders-filters" className="extra" ref={ref} />);
    const root = screen.getByTestId("orders-filters");
    expect(root.classList.contains("extra")).toBe(true);
    expect(root.getAttribute("role")).toBe("search");
    expect(ref.current).toBe(root);
  });

  it("types: extends its contract, needs the query, the filters and the search label, and refuses children", () => {
    expectTypeOf<FilterBarProps>().toExtend<FilterBarContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the bar is controlled, so the query is required
    void (<FilterBar filters={FILTERS} searchLabel="Search" onQueryChange={() => undefined} />);
    // @ts-expect-error the box needs its accessible name
    void (<FilterBar query={EMPTY} filters={FILTERS} onQueryChange={() => undefined} />);
    void (
      (
        // @ts-expect-error the bar draws its own content
        <FilterBar query={EMPTY} filters={FILTERS} searchLabel="Search" onQueryChange={() => 0}>
          x
        </FilterBar>
      )
    );
  });
});
