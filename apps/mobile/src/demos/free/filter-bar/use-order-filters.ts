/**
 * Stackra file contract:
 * Purpose: `useOrderFilters`, the translated filters of the native FilterBar demos (one of each kind) and `readout`,
 *          the query as the two lines a demo reads out.
 * Boundary: a hook over the active catalogue, in a `.ts` file so the demo tooling never takes it for a demo.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import { getLocalTimeZone, today } from "@internationalized/date";
import type { FilterDefinition, FilterValue, ResourceQuery } from "@stackra/ui/contracts";
import { useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_DEMO_KEYS } from "#src/demos/free/filter-bar/filter-bar-demo-keys.constant";

/** The keys of the filters and the readout. */
const K = FILTER_BAR_DEMO_KEYS.demo_free.filter_bar;

/** The filters (text, number, select, multi-select, date range, boolean) and the query's readout lines. */
export function useOrderFilters(): {
  readonly filters: readonly FilterDefinition[];
  readonly readout: (query: ResourceQuery) => { readonly search: string; readonly filters: string };
} {
  const t = useCatalogueText(MESSAGES.en);
  const describe = (value: FilterValue): string => {
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return t(value ? K.readout.yes : K.readout.no);
    if ("min" in value)
      return t(K.readout.range, {
        from: value.min?.toString() ?? "…",
        to: value.max?.toString() ?? "…",
      });
    if ("start" in value)
      return t(K.readout.range, {
        from: value.start?.toString() ?? "…",
        to: value.end?.toString() ?? "…",
      });
    return value.join(", ");
  };
  return {
    filters: [
      {
        id: "customer",
        kind: "text",
        label: t(K.filters.customer),
        placeholder: t(K.filters.customer_hint),
      },
      {
        id: "total",
        kind: "number",
        label: t(K.filters.total),
        minValue: 0,
        maxValue: 1000,
        step: 10,
        formatOptions: { style: "currency", currency: "USD" },
      },
      {
        id: "status",
        kind: "select",
        label: t(K.filters.status),
        options: [
          { id: "paid", label: t(K.filters.paid) },
          { id: "pending", label: t(K.filters.pending) },
          { id: "refunded", label: t(K.filters.refunded) },
        ],
      },
      {
        id: "channels",
        kind: "multi-select",
        label: t(K.filters.channels),
        options: [
          { id: "web", label: t(K.filters.web) },
          { id: "store", label: t(K.filters.store) },
          { id: "phone", label: t(K.filters.phone) },
        ],
      },
      {
        id: "placed",
        kind: "date-range",
        label: t(K.filters.placed),
        maxValue: today(getLocalTimeZone()),
      },
      {
        id: "gift",
        kind: "boolean",
        label: t(K.filters.gift),
        trueLabel: t(K.filters.gift_yes),
        falseLabel: t(K.filters.gift_no),
      },
    ],
    readout: (query) => {
      const filters = Object.entries(query.filterValues)
        .map(([id, value]) => `${id}: ${describe(value)}`)
        .join("; ");
      return {
        search:
          query.search === ""
            ? t(K.readout.no_search)
            : t(K.readout.search, { text: query.search }),
        filters: filters === "" ? t(K.readout.no_filters) : t(K.readout.filters, { filters }),
      };
    },
  };
}
