/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Filter bar: Filters applied from the start with icons in the menu, a filter
 *          that is listed but refused, and a bar with every filter applied, whose add button is disabled.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decisions 1 to 3); ADR 0060 (light, dark, RTL).
 */
import type { FilterDefinition, FilterValue, ResourceQuery } from "@stackra/ui/contracts";
import { FilterBar as UiFilterBar, Heading, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_KEYS } from "#src/demos/free/filter-bar/filter-bar-keys.constant";

/** The demo's keys. */
const K = FILTER_BAR_KEYS.filter_bar;

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
function describe(t: ReturnType<typeof useCatalogueText>, query: ResourceQuery): string {
  const parts = [
    ...(query.search === "" ? [] : [`search=${query.search}`]),
    ...Object.entries(query.filterValues).map(([id, value]) => `${id}=${textOf(value)}`),
  ];
  return t(K.query, { text: parts.length === 0 ? t(K.nothing) : parts.join("; ") });
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
  const t = useCatalogueText(MESSAGES.en);

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
        <bdi>{describe(t, query)}</bdi>
      </Text>
    </div>
  );
}

/** Filter bar: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** The filters of the samples: one of every kind. */
  const FILTERS: readonly FilterDefinition[] = [
    {
      id: "status",
      label: t(K.sample.status),
      kind: "select",
      options: [
        { id: "paid", label: t(K.sample.paid) },
        { id: "shipped", label: t(K.sample.shipped) },
        { id: "refunded", label: t(K.sample.refunded) },
      ],
    },
    {
      id: "region",
      label: t(K.sample.region),
      kind: "multi-select",
      options: [
        { id: "eu", label: t(K.sample.europe) },
        { id: "us", label: t(K.sample.united_states) },
        { id: "apac", label: t(K.sample.asia_pacific) },
      ],
    },
    {
      id: "customer",
      label: t(K.sample.customer),
      kind: "text",
      placeholder: t(K.sample.name_contains),
    },
    {
      id: "total",
      label: t(K.sample.total),
      kind: "number",
      minValue: 0,
      step: 10,
      formatOptions: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
    },
    { id: "placed", label: t(K.sample.placed), kind: "date-range" },
    {
      id: "gift",
      label: t(K.sample.gift_order),
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
  return (
    <div className="grid gap-6">
      <Heading level={3}>{t(K.applied)}</Heading>
      <BarExample
        searchLabel={t(K.applied_search)}
        filters={ICON_FILTERS}
        initial={APPLIED_QUERY}
        testId="filter-bar-applied-query"
      />
      <Heading level={3}>{t(K.disabled)}</Heading>
      <Text tone="muted">
        <bdi>{t(K.disabled_note)}</bdi>
      </Text>
      <BarExample
        searchLabel={t(K.disabled_search)}
        filters={ICON_FILTERS}
        testId="filter-bar-disabled-query"
      />
      <Heading level={3}>{t(K.all_applied)}</Heading>
      <BarExample
        searchLabel={t(K.all_applied_search)}
        filters={FILTERS.filter((filter) => filter.id !== "placed")}
        initial={ALL_APPLIED_QUERY}
        testId="filter-bar-all-applied-query"
      />
    </div>
  );
}
