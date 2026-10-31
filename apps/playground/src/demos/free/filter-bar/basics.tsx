/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Filter bar: a filter for every column type. Add one from the menu, change it in its
 *          popover, remove it with its button. The engine's search and filter are shown under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0505 (one filter model); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn, CollectionState } from "@stackra/ui/contracts";
import { FilterBar as UiFilterBar, Text, useCatalogueText, useCollection } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_KEYS } from "#src/demos/free/filter-bar/filter-bar-keys.constant";

/** The demo's keys. */
const K = FILTER_BAR_KEYS.filter_bar;

/** The columns of the samples, one of every type: each filterable column is a filter of the bar. */
function useOrderColumns(): readonly CollectionColumn[] {
  const t = useCatalogueText(MESSAGES.en);
  return [
    {
      id: "status",
      label: t(K.sample.status),
      type: "choice",
      options: [
        { id: "paid", label: t(K.sample.paid) },
        { id: "shipped", label: t(K.sample.shipped) },
        { id: "refunded", label: t(K.sample.refunded) },
      ],
    },
    {
      id: "region",
      label: t(K.sample.region),
      type: "choice",
      options: [
        { id: "eu", label: t(K.sample.europe) },
        { id: "us", label: t(K.sample.united_states) },
        { id: "apac", label: t(K.sample.asia_pacific) },
      ],
    },
    { id: "customer", label: t(K.sample.customer) },
    { id: "total", label: t(K.sample.total), type: "number", min: 0 },
    { id: "placed", label: t(K.sample.placed), type: "date" },
    { id: "isGift", label: t(K.sample.gift_order), type: "boolean" },
  ];
}

/** Writes the engine's search and filter as the bar holds them, for the readout under a sample. */
function describe(
  t: ReturnType<typeof useCatalogueText>,
  { search, filter }: CollectionState,
): string {
  const parts = [
    ...(search === "" ? [] : [`search=${search}`]),
    ...filter.conditions.map((condition) => {
      const { field, operator, value } = condition;
      if (operator === "is_true" || operator === "is_false")
        return `${field}=${operator === "is_true"}`;
      return `${field}=${typeof value === "string" ? value : value.join(operator === "between" ? ".." : ",")}`;
    }),
  ];
  return t(K.query, { text: parts.length === 0 ? t(K.nothing) : parts.join("; ") });
}

/** Props of {@link BarExample}. */
interface BarExampleProps {
  /** The accessible name of the search box, unique on the page. */
  readonly searchLabel: string;
  /** The columns the filters derive from. */
  readonly columns: readonly CollectionColumn[];
  /** The search and filter the sample starts with. */
  readonly initial?: Partial<CollectionState>;
  /** Hint text for the search box. */
  readonly placeholder?: string;
  /** The id the readout is found by in tests. */
  readonly testId: string;
}

/** A bar over its own engine, with the filter written under it. */
function BarExample({ searchLabel, columns, initial, placeholder, testId }: BarExampleProps) {
  const t = useCatalogueText(MESSAGES.en);
  const collection = useCollection({ columns, initialState: initial });
  return (
    <div className="grid gap-3">
      <UiFilterBar
        collection={collection}
        searchLabel={searchLabel}
        {...(placeholder === undefined ? {} : { searchPlaceholder: placeholder })}
      />
      <Text data-testid={testId} tone="muted">
        <bdi>{describe(t, collection.state)}</bdi>
      </Text>
    </div>
  );
}

/** Filter bar: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const columns = useOrderColumns();
  return (
    <BarExample
      searchLabel={t(K.basics_search)}
      placeholder={t(K.basics_placeholder)}
      columns={columns}
      testId="filter-bar-basics-query"
    />
  );
}
