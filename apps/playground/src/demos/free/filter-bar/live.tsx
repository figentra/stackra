/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Filter bar: twelve orders on the page. Search and filters narrow them at once (the
 *          engine applies them in client mode); the count is read out politely and the filter is shown as the bar
 *          holds it.
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
    {
      id: "total",
      label: t(K.sample.total),
      type: "number",
      min: 0,
      filter: {
        step: 10,
        formatOptions: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
      },
    },
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

/** The live example: a bar and the orders its engine leaves. */
function LiveExample() {
  const t = useCatalogueText(MESSAGES.en);
  const columns = useOrderColumns();
  const collection = useCollection({ columns, items: ORDERS });
  const rows = collection.rows;
  return (
    <div className="grid gap-3">
      <UiFilterBar
        collection={collection}
        searchLabel={t(K.live_search)}
        searchPlaceholder={t(K.live_placeholder)}
      />
      <Text data-testid="filter-bar-live-query" tone="muted">
        <bdi>{describe(t, collection.state)}</bdi>
      </Text>
      <Text role="status" tone="muted">
        {rows.length === 0 ? t(K.none) : t(K.count, { total: rows.length })}
      </Text>
      <ul aria-label={t(K.results)} className="grid gap-1">
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

/** Filter bar: Try it. */
export default function Live() {
  return <LiveExample />;
}
