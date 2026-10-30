/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Filter bar: A filter of every kind. Add one from the menu, change it in its
 *          popover, remove it with its button. The query the bar holds is shown under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decisions 1 to 3); ADR 0060 (light, dark, RTL).
 */
import type { FilterDefinition, FilterValue, ResourceQuery } from "@stackra/ui/contracts";
import { FilterBar as UiFilterBar, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_KEYS } from "#src/demos/free/filter-bar/filter-bar-keys.constant";

/** The demo's keys. */
const K = FILTER_BAR_KEYS.filter_bar;

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = Object.freeze({ search: "", filterValues: {}, sort: null });

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

/** Filter bar: Basics. */
export default function Basics() {
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
  return (
    <BarExample
      searchLabel={t(K.basics_search)}
      placeholder={t(K.basics_placeholder)}
      filters={FILTERS}
      testId="filter-bar-basics-query"
    />
  );
}
