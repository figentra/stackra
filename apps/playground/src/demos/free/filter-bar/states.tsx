/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Filter bar: filters applied from the start, a filter that is listed but refused
 *          (the column's `filter.isDisabled`), a bar with every filter applied, whose add button is disabled, and a
 *          condition the data source cannot apply, drawn as a warning chip (`unappliedIds`).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0505 (one filter model); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn, CollectionState } from "@stackra/ui/contracts";
import {
  FilterBar as UiFilterBar,
  Heading,
  Text,
  useCatalogueText,
  useCollection,
} from "@stackra/ui/react";
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
  /** The conditions the data source does not apply, drawn as warning chips. */
  readonly unappliedIds?: readonly string[];
}

/** A bar over its own engine, with the filter written under it. */
function BarExample({
  searchLabel,
  columns,
  initial,
  placeholder,
  testId,
  unappliedIds,
}: BarExampleProps) {
  const t = useCatalogueText(MESSAGES.en);
  const collection = useCollection({ columns, initialState: initial });
  return (
    <div className="grid gap-3">
      <UiFilterBar
        collection={collection}
        searchLabel={searchLabel}
        {...(placeholder === undefined ? {} : { searchPlaceholder: placeholder })}
        {...(unappliedIds === undefined ? {} : { unappliedIds })}
      />
      <Text data-testid={testId} tone="muted">
        <bdi>{describe(t, collection.state)}</bdi>
      </Text>
    </div>
  );
}

/**
 * Filters applied from the start: a choice, several choices and a number range. Each is the top-level condition a
 * quick filter keeps for its column (id `filter:<column>`), so the bar edits it as a chip.
 */
const APPLIED: Partial<CollectionState> = {
  filter: {
    match: "all",
    conditions: [
      { id: "filter:status", field: "status", operator: "in", value: ["paid"] },
      { id: "filter:region", field: "region", operator: "in", value: ["eu", "us"] },
      { id: "filter:total", field: "total", operator: "between", value: ["20", ""] },
    ],
  },
};

/**
 * A quick filter and a condition from Advanced that the data source cannot read (a server with no "does not contain"):
 * the app names it in `unappliedIds`, and its chip is drawn as a warning.
 */
const UNAPPLIED: Partial<CollectionState> = {
  filter: {
    match: "all",
    conditions: [
      { id: "filter:status", field: "status", operator: "in", value: ["paid"] },
      { id: "customer-not-ada", field: "customer", operator: "not_contains", value: "ada" },
    ],
  },
};

/** Every filter of the columns given to the last sample (all but the day range). */
const ALL_APPLIED: Partial<CollectionState> = {
  filter: {
    match: "all",
    conditions: [
      { id: "filter:status", field: "status", operator: "in", value: ["shipped"] },
      { id: "filter:region", field: "region", operator: "in", value: ["apac"] },
      { id: "filter:customer", field: "customer", operator: "contains", value: "ada" },
      { id: "filter:total", field: "total", operator: "between", value: ["10", "90"] },
      { id: "filter:isGift", field: "isGift", operator: "is_false", value: "" },
    ],
  },
};

/** Filter bar: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const columns = useOrderColumns();
  return (
    <div className="grid gap-6">
      <Heading level={3}>{t(K.applied)}</Heading>
      <BarExample
        searchLabel={t(K.applied_search)}
        columns={columns}
        initial={APPLIED}
        testId="filter-bar-applied-query"
      />
      <Heading level={3}>{t(K.disabled)}</Heading>
      <Text tone="muted">
        <bdi>{t(K.disabled_note)}</bdi>
      </Text>
      <BarExample
        searchLabel={t(K.disabled_search)}
        columns={columns.map((column) =>
          column.id === "total" ? { ...column, filter: { isDisabled: true } } : column,
        )}
        testId="filter-bar-disabled-query"
      />
      <Heading level={3}>{t(K.all_applied)}</Heading>
      <BarExample
        searchLabel={t(K.all_applied_search)}
        columns={columns.filter((column) => column.id !== "placed")}
        initial={ALL_APPLIED}
        testId="filter-bar-all-applied-query"
      />
      <Heading level={3}>{t(K.unapplied)}</Heading>
      <Text tone="muted">
        <bdi>{t(K.unapplied_note)}</bdi>
      </Text>
      <BarExample
        searchLabel={t(K.unapplied_search)}
        columns={columns}
        initial={UNAPPLIED}
        unappliedIds={["customer-not-ada"]}
        testId="filter-bar-unapplied-query"
      />
    </div>
  );
}
