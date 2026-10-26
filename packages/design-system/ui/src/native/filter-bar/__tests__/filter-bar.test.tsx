/**
 * Stackra file contract:
 * Purpose: proves the native FilterBar, the adapted form, names its root a search and its box by `searchLabel`, edits only
 *          `search` of the query from the box, opens the sheet on the list of filters not yet applied from the add button
 *          (disabled when none is left), swaps the same sheet to a chosen filter's editor and draws its chip at once,
 *          draws one chip per applied filter in the order applied with the value written out, opens a chip's own editor,
 *          applies each change at once, removes a filter from its close button (closing its sheet), drops the chip of an
 *          emptied filter once the sheet is done, shows clear-all only while the query narrows and clears search and
 *          filters but not the sort, wraps its one loose string in `Text`, gives the close buttons a hit area, and
 *          passes the root's other props through.
 * Boundary: React Native does not render in vitest, so react-native and the sibling native components are replaced by
 *           recording stand-ins that render plain DOM; what reaches them is checked, not their rendering. The editor has
 *           its own test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 2, 3 and 10); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-194 sta-350:FR-195 sta-350:FR-197
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState, type ReactNode } from "react";

import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { FilterBar } from "#native/filter-bar/filter-bar";
import type { FilterBarProps } from "#native/filter-bar/filter-bar.props";

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

const FILTERS: readonly FilterDefinition[] = [
  {
    id: "status",
    label: "Status",
    kind: "select",
    options: [
      { id: "paid", label: "Paid" },
      { id: "shipped", label: "Shipped" },
    ],
    icon: "check",
  },
  { id: "customer", label: "Customer", kind: "text" },
  { id: "gift", label: "Gift", kind: "boolean", isDisabled: true },
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
const sheet = () => screen.getByRole("dialog");

describe("FilterBar (native)", () => {
  beforeEach(() => {
    received.props = {};
    latest.query = EMPTY;
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

  it("shows the search text and edits only the search, keeping filters and sort", () => {
    const sort = { column: "total", direction: "ascending" } as const;
    render(<Harness initial={{ search: "ada", filterValues: { status: "paid" }, sort }} />);
    const box = screen.getByRole<HTMLInputElement>("textbox", { name: "Search orders" });
    expect(box.value).toBe("ada");
    fireEvent.change(box, { target: { value: "grace" } });
    expect(latest.query).toEqual({ search: "grace", filterValues: { status: "paid" }, sort });
  });

  it("lays the chips out in a horizontal row", () => {
    render(<Harness />);
    expect(received.props["row"]).toMatchObject({ horizontal: true });
  });

  it("opens the sheet on the filters not yet applied, each pressable unless it is disabled", () => {
    render(<Harness initial={{ ...EMPTY, filterValues: { customer: "ada" } }} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    press(screen.getByRole("button", { name: "Add filter" }));
    const names = within(sheet())
      .getAllByRole("button")
      .map((button) => ({
        name: button.textContent,
        disabled: (button as HTMLButtonElement).disabled,
      }));
    expect(names).toEqual([
      { name: "Status", disabled: false },
      { name: "Gift", disabled: true },
      { name: "Done", disabled: false },
    ]);
    expect(sheet().getAttribute("aria-label")).toBe("Add filter");
  });

  it("disables the add button when every filter is applied", () => {
    const only: readonly FilterDefinition[] = [FILTERS[0] as FilterDefinition];
    render(<Harness filters={only} initial={{ ...EMPTY, filterValues: { status: "paid" } }} />);
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
    expect(within(sheet()).getByRole("heading", { name: "Status" })).toBeTruthy();
    expect(within(sheet()).getByRole("button", { name: "Editor Status" })).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "Status" }).some((button) => !sheet().contains(button)),
    ).toBe(true);
    expect(latest.query.filterValues).toEqual({});
  });

  it("applies an editor's change at once and writes it on the chip", () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: "Add filter" }));
    press(within(sheet()).getByRole("button", { name: "Customer" }));
    press(within(sheet()).getByRole("button", { name: "Editor Customer" }));
    expect(latest.query.filterValues).toEqual({ customer: "typed" });
    press(within(sheet()).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Customer: typed" })).toBeTruthy();
  });

  it("draws one chip per applied filter in the order applied, and opens a chip's own editor", () => {
    render(
      <Harness initial={{ ...EMPTY, filterValues: { customer: "ada", status: "shipped" } }} />,
    );
    const chips = screen
      .getAllByRole("button")
      .map((button) => button.textContent)
      .filter((text) => text?.includes(": "));
    expect(chips).toEqual(["Customer: ada", "Status: Shipped"]);
    press(screen.getByRole("button", { name: "Status: Shipped" }));
    expect(within(sheet()).getByRole("button", { name: "Editor Status" })).toBeTruthy();
    expect(received.props["editor"]).toMatchObject({ value: "shipped" });
  });

  it("drops the chip of a filter left empty once the sheet is done", () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: "Add filter" }));
    press(within(sheet()).getByRole("button", { name: "Customer" }));
    press(within(sheet()).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("button", { name: "Customer" })).toBeNull();
    expect(latest.query.filterValues).toEqual({});
  });

  it("removes a filter from its close button, closing the sheet if it was that filter's", () => {
    render(<Harness initial={{ ...EMPTY, filterValues: { status: "paid", customer: "ada" } }} />);
    press(screen.getByRole("button", { name: "Status: Paid" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    press(screen.getByRole("button", { name: "Remove filter Status" }));
    expect(latest.query.filterValues).toEqual({ customer: "ada" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "Status: Paid" })).toBeNull();
  });

  it("gives the close buttons a hit area, so a touch target is at least 24 points", () => {
    render(<Harness initial={{ ...EMPTY, filterValues: { status: "paid" } }} />);
    expect(received.props["close:Remove filter Status"]).toMatchObject({ hitSlop: 8 });
  });

  it("shows clear-all only while the query narrows, and clears search and filters but not the sort", () => {
    const sort = { column: "total", direction: "descending" } as const;
    render(<Harness initial={{ search: "", filterValues: {}, sort }} />);
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Search orders" }), {
      target: { value: "ada" },
    });
    press(screen.getByRole("button", { name: "Clear all" }));
    expect(latest.query).toEqual({ search: "", filterValues: {}, sort });
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("wraps the one loose string of the sheet in Text, when a change elsewhere leaves nothing to add", () => {
    const { rerender } = render(<Harness key="same" />);
    press(screen.getByRole("button", { name: "Add filter" }));
    rerender(<Harness key="same" filters={[]} />);
    const note = within(sheet()).getByText("Every filter is applied.");
    expect(note.getAttribute("data-text")).toBe("true");
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
