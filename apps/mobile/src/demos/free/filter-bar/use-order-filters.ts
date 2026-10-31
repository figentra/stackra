/**
 * Stackra file contract:
 * Purpose: `useOrderFilters`, the translated columns of the native FilterBar demos (one of each type, each a filter of
 *          the bar) and `readout`, the engine's search and filter as the two lines a demo reads out.
 * Boundary: a hook over the active catalogue, in a `.ts` file so the demo tooling never takes it for a demo.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0505 (one filter model).
 */
import type { CollectionColumn, CollectionState, RuleCondition } from "@stackra/ui/contracts";
import { useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_DEMO_KEYS } from "#src/demos/free/filter-bar/filter-bar-demo-keys.constant";

/** The keys of the filters and the readout. */
const K = FILTER_BAR_DEMO_KEYS.demo_free.filter_bar;

/** The columns (text, number, choice, another choice, date, boolean) and the readout lines of the engine's state. */
export function useOrderFilters(): {
  readonly columns: readonly CollectionColumn[];
  readonly readout: (state: CollectionState) => {
    readonly search: string;
    readonly filters: string;
  };
} {
  const t = useCatalogueText(MESSAGES.en);
  const describe = ({ operator, value }: RuleCondition): string => {
    if (operator === "is_true" || operator === "is_false")
      return t(operator === "is_true" ? K.readout.yes : K.readout.no);
    if (typeof value === "string") return value;
    if (operator === "between")
      return t(K.readout.range, { from: value[0] || "…", to: value[1] || "…" });
    return value.join(", ");
  };
  return {
    columns: [
      { id: "customer", label: t(K.filters.customer) },
      { id: "total", label: t(K.filters.total), type: "number", min: 0, max: 1000 },
      {
        id: "status",
        label: t(K.filters.status),
        type: "choice",
        options: [
          { id: "paid", label: t(K.filters.paid) },
          { id: "pending", label: t(K.filters.pending) },
          { id: "refunded", label: t(K.filters.refunded) },
        ],
      },
      {
        id: "channels",
        label: t(K.filters.channels),
        type: "choice",
        options: [
          { id: "web", label: t(K.filters.web) },
          { id: "store", label: t(K.filters.store) },
          { id: "phone", label: t(K.filters.phone) },
        ],
      },
      { id: "placed", label: t(K.filters.placed), type: "date" },
      { id: "gift", label: t(K.filters.gift), type: "boolean" },
    ],
    readout: ({ search, filter }) => {
      const filters = filter.conditions
        .map((condition) => `${condition.field}: ${describe(condition)}`)
        .join("; ");
      return {
        search: search === "" ? t(K.readout.no_search) : t(K.readout.search, { text: search }),
        filters: filters === "" ? t(K.readout.no_filters) : t(K.readout.filters, { filters }),
      };
    },
  };
}
