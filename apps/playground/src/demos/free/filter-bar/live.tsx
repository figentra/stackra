/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Filter bar: Twelve orders on the page. Search and filters narrow them at once;
 *          the count is read out politely and the query is shown as the bar holds it.
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
function describe(t: ReturnType<typeof useCatalogueText>, query: ResourceQuery): string {
  const parts = [
    ...(query.search === "" ? [] : [`search=${query.search}`]),
    ...Object.entries(query.filterValues).map(([id, value]) => `${id}=${textOf(value)}`),
  ];
  return t(K.query, { text: parts.length === 0 ? t(K.nothing) : parts.join("; ") });
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

/** The live example: a bar and the orders its query leaves. */
function LiveExample() {
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

  const [query, setQuery] = useState(NO_QUERY);
  const rows = ordersFor(query);
  return (
    <div className={COLUMN}>
      <UiFilterBar
        searchLabel={t(K.live_search)}
        searchPlaceholder={t(K.live_placeholder)}
        filters={FILTERS}
        query={query}
        onQueryChange={setQuery}
      />
      <Text data-testid="filter-bar-live-query" tone="muted">
        <bdi>{describe(t, query)}</bdi>
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
