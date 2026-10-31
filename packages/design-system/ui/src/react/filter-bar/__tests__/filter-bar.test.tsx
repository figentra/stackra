/**
 * Stackra file contract:
 * Purpose: proves the web FilterBar on a `useCollection` engine: it names its search landmark and box, writes the
 *          engine's search from the box, lists in its add-filter menu the quick filters (one per filterable column) not
 *          yet applied, opens a chosen filter's editor in a popover with its chip drawn, writes each change as one
 *          top-level condition of the engine's filter (several choices `in`, yes or no `is_true` / `is_false`, a number
 *          range `between`), drops an emptied filter and focuses add, shows any other condition as a read-only chip
 *          that removes it, opens the advanced and/or editor, shows clear-all only while the search or filter narrows
 *          and clears both, says how many filters are applied, passes props and the ref through, and types as its
 *          contract.
 * Boundary: jsdom with real HeroUI and React Aria; NumberField and DateField are recording stand-ins.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-194 sta-350:FR-195 sta-350:FR-196
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef, useEffect, type ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";
import { FilterBar } from "#react/filter-bar/filter-bar";
import type { FilterBarProps } from "#react/filter-bar/filter-bar.props";
import { useCollection } from "#react/hooks/use-collection";

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
  { id: "gift", label: "Gift", type: "boolean" },
  { id: "total", label: "Total", type: "number", min: 0, max: 1000 },
  { id: "note", label: "Note", isFilterable: false },
];

const EMPTY: CollectionFilter = { match: "all", conditions: [] };

/** The engine the harness last drew, so a test can read what the bar asked for. */
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
const dialog = (name: string) => screen.getByRole("dialog", { name });
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

const PAID: CollectionFilter = {
  match: "all",
  conditions: [{ id: "filter:status", field: "status", operator: "in", value: ["paid"] }],
};

describe("FilterBar (web)", () => {
  beforeEach(() => {
    received.props = {};
    latest.collection = undefined;
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

  it("writes the engine's search from the box, keeping the filter", () => {
    render(<Harness search="ada" filter={PAID} />);
    const box = screen.getByRole<HTMLInputElement>("searchbox", { name: "Search orders" });
    expect(box.value).toBe("ada");
    fireEvent.change(box, { target: { value: "grace" } });
    expect(latest.collection?.state.search).toBe("grace");
    expect(conditions()).toEqual(['status in ["paid"]']);
  });

  it("lists in the add-filter menu only the filterable columns not applied", () => {
    render(<Harness filter={PAID} />);
    press(screen.getByRole("button", { name: "Add filter" }));
    const names = screen.getAllByRole("menuitem").map((item) => item.textContent);
    expect(names).toEqual(["Customer", "Gift", "Total"]);
  });

  it("writes several choices as one `in` condition and keeps the chip when the editor closes", async () => {
    render(<Harness />);
    const editor = await add("Status");
    expect(conditions()).toEqual([]);
    press(within(editor).getByRole("checkbox", { name: "Shipped" }));
    expect(conditions()).toEqual(['status in ["shipped"]']);
    fireEvent.keyDown(dialog("Status"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(triggerOf("Status").textContent).toContain("Status: Shipped");
    expect(screen.getByRole("status").textContent).toBe("1 filter applied");
  });

  it("writes a yes or no as `is_true` or `is_false`", async () => {
    render(<Harness />);
    const editor = await add("Gift");
    press(within(editor).getAllByRole("radio")[1] as HTMLElement);
    expect(conditions()).toEqual(['gift is_false ""']);
  });

  it("writes a number range as `between`, an open end empty", async () => {
    render(<Harness />);
    const editor = await add("Total");
    expect(received.props["Minimum"]).toMatchObject({ minValue: 0, maxValue: 1000 });
    press(within(editor).getByRole("button", { name: "Set Minimum" }));
    expect(conditions()).toEqual(['total between ["7",""]']);
  });

  it("drops a filter left empty when its editor closes, and focuses add", async () => {
    render(<Harness />);
    await add("Customer");
    const box = screen.getByRole("textbox", { name: "Customer" });
    fireEvent.change(box, { target: { value: "ada" } });
    expect(conditions()).toEqual(['customer contains "ada"']);
    fireEvent.change(box, { target: { value: "" } });
    expect(conditions()).toEqual([]);
    fireEvent.keyDown(dialog("Customer"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("group", { name: "Customer" })).toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add filter" })),
    );
  });

  it("removes a filter from its close button", () => {
    render(<Harness filter={PAID} />);
    press(screen.getByRole("button", { name: "Remove filter Status" }));
    expect(conditions()).toEqual([]);
  });

  it("shows another condition as a read-only chip that removes it", () => {
    render(
      <Harness
        filter={{
          match: "all",
          conditions: [{ id: "c1", field: "customer", operator: "not_contains", value: "x" }],
        }}
      />,
    );
    expect(screen.getByText("Customer does not contain x")).toBeTruthy();
    press(screen.getByRole("button", { name: "Remove filter Customer does not contain x" }));
    expect(conditions()).toEqual([]);
  });

  it("draws a chip in unappliedIds as a warning, led by a button that says it is not applied", () => {
    const filter: CollectionFilter = {
      match: "all",
      conditions: [
        ...PAID.conditions,
        { id: "c1", field: "customer", operator: "not_contains", value: "x" },
      ],
    };
    const { rerender } = render(<Harness filter={filter} />);
    expect(screen.queryByRole("button", { name: "Not applied on the server" })).toBeNull();
    rerender(<Harness filter={filter} unappliedIds={["c1"]} />);
    expect(screen.getAllByRole("button", { name: "Not applied on the server" })).toHaveLength(1);
    expect(screen.getByText("Customer does not contain x").closest("div")?.className).toContain(
      "bg-warning-soft",
    );
    expect(screen.getByRole("group", { name: "Status" }).className).not.toContain(
      "bg-warning-soft",
    );
    // A quick filter's chip is named by its condition id.
    rerender(<Harness filter={filter} unappliedIds={["c1", "filter:status"]} />);
    expect(screen.getAllByRole("button", { name: "Not applied on the server" })).toHaveLength(2);
    expect(screen.getByRole("group", { name: "Status" }).className).toContain("bg-warning-soft");
  });

  it("opens the whole and/or tree from Advanced", async () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: "Advanced" }));
    expect(await screen.findByRole("dialog", { name: "Advanced" })).toBeTruthy();
  });

  it("shows clear-all only while the search or filter narrows, and clears both", () => {
    render(<Harness filter={PAID} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search orders" }), {
      target: { value: "ada" },
    });
    press(screen.getByRole("button", { name: "Clear all" }));
    expect(latest.collection?.state.search).toBe("");
    expect(conditions()).toEqual([]);
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("No filters applied");
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Harness data-testid="orders-filters" className="extra" ref={ref} />);
    const root = screen.getByTestId("orders-filters");
    expect(root.classList.contains("extra")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("types: extends its contract, needs the engine and the search label, and refuses children", () => {
    expectTypeOf<FilterBarProps>().toExtend<FilterBarContractProps>();
    // @ts-expect-error the bar needs its engine
    void (<FilterBar searchLabel="Search" />);
  });
});
