/**
 * Stackra file contract:
 * Purpose: the page of the filter bar route: the bar with a filter of every kind (a choice, several choices, text, a
 *          number range, a day range and a yes or no) and its search box; the kinds listed with the editor and the value
 *          each has; filters applied from the start, with icons, with a disabled filter and with none left to add; and a
 *          live example that filters a list of orders by the bar's query and shows the query it holds, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The bar holds no query: each
 *           sample keeps its own in state and the page applies it to a fixed list on the client, as an app would ask a
 *           server. A day range is applied from the ISO text of its days, which sorts as dates do, so the page needs no
 *           date library. No sample starts with a day range, because building one takes a date library the page does not
 *           carry; pick one in the bar.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 3); ADR 0060 (light,
 *          dark, RTL).
 */
import type { FilterDefinition, FilterValue, ResourceQuery } from "@stackra/ui/contracts";
import { FilterBar as UiFilterBar, Heading, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { FilterBarRoute } from "#src/routes/filter-bar/filter-bar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::filter-bar.*` keys.
const STRINGS = {
  kindLine: (kind: string, editor: string, value: string) => `${kind}: ${editor}; holds ${value}.`,
  documentTitle: `${FilterBarRoute.title} · Stackra Playground`,
  intro:
    "A filter bar is the search and filter row of a resource index: a search box, an add-filter menu, one chip for each filter that is applied, and a clear-all button while anything narrows the list. A chip opens the editor of its filter and has a button that removes it. The bar holds no query: the page owns it, and each change asks for the next one. On a phone the same props draw one row of chips that opens a sheet.",
  basics: "Basics",
  basicsNote:
    "A filter of every kind. Add one from the menu, change it in its popover, remove it with its button. The query the bar holds is shown under it.",
  basicsSearch: "Search the sample orders",
  basicsPlaceholder: "Order or customer",
  kinds: "Kinds of filter",
  kindsNote:
    "Each kind has one editor and holds one value. An editor that is left empty drops its chip and its key, but a yes or no never counts as empty, because no is an answer.",
  kindsList: "Filter kinds",
  kindRows: [
    ["Select", "one choice from a short list", "the key of the choice"],
    ["Multi-select", "any of a short list, ticked", "the keys, in the order of the list"],
    ["Text", "a text field", "the text"],
    ["Number", "a minimum and a maximum", "a range with either bound empty"],
    ["Date range", "a first and a last day", "a range with either day empty"],
    ["Boolean", "yes or no", "true or false"],
  ] as const,
  states: "States",
  statesNote:
    "Filters applied from the start with icons in the menu, a filter that is listed but refused, and a bar with every filter applied, whose add button is disabled.",
  applied: "Applied from the start",
  appliedSearch: "Search the applied orders",
  disabled: "A disabled filter",
  disabledSearch: "Search the orders with a disabled filter",
  disabledNote: "Total is listed in the menu but cannot be added.",
  allApplied: "Every filter applied",
  allAppliedSearch: "Search the orders with every filter applied",
  live: "Try it",
  liveNote:
    "Twelve orders on the page. Search and filters narrow them at once; the count is read out politely and the query is shown as the bar holds it.",
  liveSearch: "Search the live orders",
  livePlaceholder: "Try ada, grace or an order number",
  results: "Matching orders",
  count: (total: number) => (total === 1 ? "1 order matches." : `${total} orders match.`),
  none: "No order matches. Clear a filter to see more.",
  query: (text: string) => `Query: ${text}`,
  nothing: "none",
} as const;

/** The filters of the samples: one of every kind. */
const FILTERS: readonly FilterDefinition[] = [
  {
    id: "status",
    label: "Status",
    kind: "select",
    options: [
      { id: "paid", label: "Paid" },
      { id: "shipped", label: "Shipped" },
      { id: "refunded", label: "Refunded" },
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
  {
    id: "total",
    label: "Total",
    kind: "number",
    minValue: 0,
    step: 10,
    formatOptions: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
  },
  { id: "placed", label: "Placed", kind: "date-range" },
  {
    id: "gift",
    label: "Gift order",
    kind: "boolean",
    trueLabel: "A gift",
    falseLabel: "Not a gift",
  },
];

/** The same filters with an icon each, and Total refused. */
const ICON_FILTERS: readonly FilterDefinition[] = FILTERS.map((filter) => ({
  ...filter,
  ...(filter.id === "status" ? { icon: "check" as const } : {}),
  ...(filter.id === "customer" ? { icon: "search" as const } : {}),
  ...(filter.id === "gift" ? { icon: "heart" as const } : {}),
  ...(filter.id === "total" ? { isDisabled: true } : {}),
}));

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = Object.freeze({ search: "", filterValues: {}, sort: null });

/** Filters applied from the start: a choice, several choices and a number range. */
const APPLIED_QUERY: ResourceQuery = Object.freeze({
  search: "",
  filterValues: {
    status: "paid",
    region: ["eu", "us"],
    total: { min: 20, max: null },
  },
  sort: null,
});

/** Every filter but the day range, which takes a date library to build; the sample says so. */
const ALL_APPLIED_QUERY: ResourceQuery = Object.freeze({
  search: "",
  filterValues: {
    status: "shipped",
    region: ["apac"],
    customer: "ada",
    total: { min: 10, max: 90 },
    gift: false,
  },
  sort: null,
});

/** One order of the live example. */
interface Order {
  readonly id: string;
  readonly order: string;
  readonly customer: string;
  readonly status: "paid" | "shipped" | "refunded";
  readonly region: "eu" | "us" | "apac";
  readonly isGift: boolean;
  readonly total: number;
  /** The day it was placed, as ISO text: it sorts as a date does. */
  readonly placed: string;
}

const CUSTOMERS = ["Ada Lovelace", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton"] as const;
const STATUSES = ["paid", "shipped", "refunded"] as const;
const REGIONS = ["eu", "us", "apac"] as const;

/** A fixed list of orders: the same rows on every load, so the sample and its tests agree. */
const ORDERS: readonly Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: `ord-${1001 + index}`,
  order: `#${1001 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length] ?? "",
  status: STATUSES[index % STATUSES.length] ?? "paid",
  region: REGIONS[index % REGIONS.length] ?? "eu",
  isGift: index % 4 === 0,
  total: ((index * 37) % 90) + 10,
  placed: `2026-${String(index + 1).padStart(2, "0")}-15`,
}));

/** Fixed to US dollars in English, so the total reads the same in both reading directions. */
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** The grid that lays the samples out in a column. */
const COLUMN = "grid gap-3";

/** Writes a filter value as short text: lists joined, ranges as `min..max`, days as ISO text. */
function textOf(value: FilterValue): string {
  if (typeof value === "string" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.join(",");
  if ("min" in value) return `${value.min ?? ""}..${value.max ?? ""}`;
  if ("start" in value) return `${value.start?.toString() ?? ""}..${value.end?.toString() ?? ""}`;
  return "";
}

/** Writes the query as the bar holds it, for the readout under a sample. */
function describe(query: ResourceQuery): string {
  const parts = [
    ...(query.search === "" ? [] : [`search=${query.search}`]),
    ...Object.entries(query.filterValues).map(([id, value]) => `${id}=${textOf(value)}`),
  ];
  return STRINGS.query(parts.length === 0 ? STRINGS.nothing : parts.join("; "));
}

/**
 * The server: the orders the query matches. A bar is only given the query to edit, so applying it is the page's job.
 * A range is read by the shape of its value, as the bar's own functions do.
 */
function ordersFor(query: ResourceQuery): readonly Order[] {
  const needle = query.search.trim().toLowerCase();
  const { status, region, customer, total, placed, gift } = query.filterValues;
  return ORDERS.filter((order) => {
    if (
      needle !== "" &&
      !order.order.toLowerCase().includes(needle) &&
      !order.customer.toLowerCase().includes(needle)
    )
      return false;
    if (typeof status === "string" && order.status !== status) return false;
    if (Array.isArray(region) && !region.includes(order.region)) return false;
    if (
      typeof customer === "string" &&
      !order.customer.toLowerCase().includes(customer.toLowerCase())
    )
      return false;
    if (typeof gift === "boolean" && order.isGift !== gift) return false;
    if (typeof total === "object" && "min" in total) {
      if (total.min !== null && order.total < total.min) return false;
      if (total.max !== null && order.total > total.max) return false;
    }
    if (typeof placed === "object" && "start" in placed) {
      if (placed.start !== null && order.placed < placed.start.toString()) return false;
      if (placed.end !== null && order.placed > placed.end.toString()) return false;
    }
    return true;
  });
}

/** Props of {@link BarExample}. */
interface BarExampleProps {
  /** The accessible name of the search box, unique on the page. */
  readonly searchLabel: string;
  /** The filters the bar offers. */
  readonly filters: readonly FilterDefinition[];
  /** The query the sample starts with. */
  readonly initial?: ResourceQuery;
  /** Hint text for the search box. */
  readonly placeholder?: string;
  /** The id the readout is found by in tests. */
  readonly testId: string;
}

/** A bar over its own query, with the query written under it. */
function BarExample({
  searchLabel,
  filters,
  initial = NO_QUERY,
  placeholder,
  testId,
}: BarExampleProps) {
  const [query, setQuery] = useState(initial);
  return (
    <div className={COLUMN}>
      <UiFilterBar
        searchLabel={searchLabel}
        filters={filters}
        query={query}
        onQueryChange={setQuery}
        {...(placeholder === undefined ? {} : { searchPlaceholder: placeholder })}
      />
      <Text data-testid={testId} tone="muted">
        <bdi>{describe(query)}</bdi>
      </Text>
    </div>
  );
}

/** The live example: a bar and the orders its query leaves. */
function LiveExample() {
  const [query, setQuery] = useState(NO_QUERY);
  const rows = ordersFor(query);
  return (
    <div className={COLUMN}>
      <UiFilterBar
        searchLabel={STRINGS.liveSearch}
        searchPlaceholder={STRINGS.livePlaceholder}
        filters={FILTERS}
        query={query}
        onQueryChange={setQuery}
      />
      <Text data-testid="filter-bar-live-query" tone="muted">
        <bdi>{describe(query)}</bdi>
      </Text>
      <Text role="status" tone="muted">
        {rows.length === 0 ? STRINGS.none : STRINGS.count(rows.length)}
      </Text>
      <ul aria-label={STRINGS.results} className="grid gap-1">
        {rows.map((order) => (
          <li key={order.id}>
            <Text>
              <bdi>
                {order.order} · {order.customer} · {MONEY.format(order.total)} · {order.placed}
              </bdi>
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The FilterBar page. */
export function FilterBar() {
  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{FilterBarRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="filter-bar-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <BarExample
          searchLabel={STRINGS.basicsSearch}
          placeholder={STRINGS.basicsPlaceholder}
          filters={FILTERS}
          testId="filter-bar-basics-query"
        />
      </PageSection>

      <PageSection id="filter-bar-kinds" title={STRINGS.kinds} note={STRINGS.kindsNote}>
        <ul aria-label={STRINGS.kindsList} className="grid gap-1">
          {STRINGS.kindRows.map(([kind, editor, value]) => (
            <li key={kind}>
              <Text>
                <bdi>{STRINGS.kindLine(kind, editor, value)}</bdi>
              </Text>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="filter-bar-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <Heading level={3}>{STRINGS.applied}</Heading>
        <BarExample
          searchLabel={STRINGS.appliedSearch}
          filters={ICON_FILTERS}
          initial={APPLIED_QUERY}
          testId="filter-bar-applied-query"
        />
        <Heading level={3}>{STRINGS.disabled}</Heading>
        <Text tone="muted">
          <bdi>{STRINGS.disabledNote}</bdi>
        </Text>
        <BarExample
          searchLabel={STRINGS.disabledSearch}
          filters={ICON_FILTERS}
          testId="filter-bar-disabled-query"
        />
        <Heading level={3}>{STRINGS.allApplied}</Heading>
        <BarExample
          searchLabel={STRINGS.allAppliedSearch}
          filters={FILTERS.filter((filter) => filter.id !== "placed")}
          initial={ALL_APPLIED_QUERY}
          testId="filter-bar-all-applied-query"
        />
      </PageSection>

      <PageSection id="filter-bar-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <LiveExample />
      </PageSection>
    </article>
  );
}
