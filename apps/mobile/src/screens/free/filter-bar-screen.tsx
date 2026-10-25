/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `FilterBar` (@stackra/ui): a search box over a row with an
 *          add-filter button and a chip for each applied filter, offering every kind of filter (text, number, one
 *          choice, several choices, a range of days and a yes or no), a bar that starts with filters applied, and a
 *          filter that is shown but refused; each bar reads its query out.
 * Boundary: presentation and local demo state only; the bar is @stackra/ui's, nothing here is styled by hand. The bar
 *          holds no query: the page owns it and each change hands back the whole next query. The days are
 *          `CalendarDate`s from `@internationalized/date`, counted from today so the samples stay in range.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { getLocalTimeZone, startOfMonth, today } from "@internationalized/date";
import type { FilterDefinition, FilterValue, ResourceQuery } from "@stackra/ui/contracts";
import { FilterBar, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  kinds: {
    title: "Every kind of filter",
    description:
      "Add a filter from the list: text, a number range, one choice, several choices, a range of days and a yes or no. Each opens its own editor in one sheet, and its chip edits or removes it.",
    searchLabel: "Search the orders",
    searchPlaceholder: "Search the orders…",
  },
  applied: {
    title: "Applied from the start",
    description:
      "The query can start with filters set: each one is a chip, and Clear all removes them together.",
  },
  refused: {
    title: "A refused filter",
    description:
      "`isDisabled` lists a filter but refuses adding it, for example while its options load: Region is listed and cannot be added.",
  },
  readout: {
    search: (text: string) => `Search: ${text === "" ? "none" : text}`,
    filters: (filters: string) => `Filters: ${filters === "" ? "none" : filters}`,
    range: (from: string | undefined, to: string | undefined) => `${from ?? "…"} to ${to ?? "…"}`,
    yes: "yes",
    no: "no",
  },
  filters: {
    customer: "Customer",
    customerHint: "Part of a name",
    total: "Total",
    status: "Status",
    channels: "Channel",
    placed: "Placed on",
    gift: "Gift order",
    giftYes: "Is a gift",
    giftNo: "Is not a gift",
    region: "Region",
  },
} as const;

/** Today, and the first day of this month, which the date filter is bounded and prefilled by. */
const TODAY = today(getLocalTimeZone());
const FIRST_OF_MONTH = startOfMonth(TODAY);

/** The filters of the first sample: one of each kind. */
const FILTERS: readonly FilterDefinition[] = [
  {
    id: "customer",
    kind: "text",
    label: STRINGS.filters.customer,
    placeholder: STRINGS.filters.customerHint,
  },
  {
    id: "total",
    kind: "number",
    label: STRINGS.filters.total,
    minValue: 0,
    maxValue: 1000,
    step: 10,
    formatOptions: { style: "currency", currency: "USD" },
  },
  {
    id: "status",
    kind: "select",
    label: STRINGS.filters.status,
    options: [
      { id: "paid", label: "Paid" },
      { id: "pending", label: "Pending" },
      { id: "refunded", label: "Refunded" },
    ],
  },
  {
    id: "channels",
    kind: "multi-select",
    label: STRINGS.filters.channels,
    options: [
      { id: "web", label: "Web" },
      { id: "store", label: "Store" },
      { id: "phone", label: "Phone" },
    ],
  },
  {
    id: "placed",
    kind: "date-range",
    label: STRINGS.filters.placed,
    maxValue: TODAY,
  },
  {
    id: "gift",
    kind: "boolean",
    label: STRINGS.filters.gift,
    trueLabel: STRINGS.filters.giftYes,
    falseLabel: STRINGS.filters.giftNo,
  },
];

/** The filters of the last sample: the first three, then one that is refused. */
const WITH_REFUSED: readonly FilterDefinition[] = [
  ...FILTERS.slice(0, 3),
  {
    id: "region",
    kind: "select",
    label: STRINGS.filters.region,
    isDisabled: true,
    options: [{ id: "emea", label: "EMEA" }],
  },
];

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = Object.freeze({ search: "", filterValues: {}, sort: null });

/** A query that starts with a filter of every kind applied. */
const APPLIED_QUERY: ResourceQuery = Object.freeze({
  search: "",
  sort: null,
  filterValues: {
    customer: "Ada",
    total: { min: 100, max: null },
    status: "paid",
    channels: ["web", "store"],
    placed: { start: FIRST_OF_MONTH, end: TODAY },
    gift: true,
  },
});

/** A filter's value as a short phrase for the readout. */
function describeValue(value: FilterValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? STRINGS.readout.yes : STRINGS.readout.no;
  if ("min" in value) return STRINGS.readout.range(value.min?.toString(), value.max?.toString());
  if ("start" in value) {
    return STRINGS.readout.range(value.start?.toString(), value.end?.toString());
  }
  return value.join(", ");
}

/** The query as two lines the page reads out: the search text, and the applied filters. */
function QueryReadout({ query }: { readonly query: ResourceQuery }) {
  const filters = Object.entries(query.filterValues)
    .map(([id, value]) => `${id}: ${describeValue(value)}`)
    .join("; ");
  return (
    <>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.readout.search(query.search)}
      </Text>
      <Text tone="muted">{STRINGS.readout.filters(filters)}</Text>
    </>
  );
}

/** A filter bar over the filters it is given, with a readout of the query it edits. */
function Sample({
  filters,
  initial,
}: {
  readonly filters: readonly FilterDefinition[];
  readonly initial: ResourceQuery;
}) {
  const [query, setQuery] = useState<ResourceQuery>(initial);
  return (
    <>
      <FilterBar
        filters={filters}
        query={query}
        onQueryChange={setQuery}
        searchLabel={STRINGS.kinds.searchLabel}
        searchPlaceholder={STRINGS.kinds.searchPlaceholder}
      />
      <QueryReadout query={query} />
    </>
  );
}

/** The FilterBar page: one section per option, in a scrollable screen. */
export function FilterBarScreen() {
  return (
    <Screen>
      <Section title={STRINGS.kinds.title} description={STRINGS.kinds.description}>
        <Sample filters={FILTERS} initial={NO_QUERY} />
      </Section>

      <Section title={STRINGS.applied.title} description={STRINGS.applied.description}>
        <Sample filters={FILTERS} initial={APPLIED_QUERY} />
      </Section>

      <Section title={STRINGS.refused.title} description={STRINGS.refused.description}>
        <Sample filters={WITH_REFUSED} initial={NO_QUERY} />
      </Section>
    </Screen>
  );
}
