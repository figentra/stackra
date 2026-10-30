/**
 * Stackra file contract:
 * Purpose: `useOrderActions`, the row and bulk actions the native DataTable demos share: one that works, one that
 *          takes a moment, one refused with its reason, one that fails.
 * Boundary: a hook over the active catalogue, in a `.ts` file so the demo tooling never takes it for a demo.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0305 (one declaration per file).
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import { useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import type { Order } from "#src/demos/free/data-table/order.type";

/** The keys of the actions. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table.actions;

/** How long a pretend action takes, so a busy state can be seen. */
const DELAY = 700;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The row actions of an order and the bulk actions of a selection; each reports what happened. */
export function useOrderActions(report: (text: string) => void): {
  readonly rowActions: (order: Order) => readonly ResourceAction[];
  readonly bulkActions: (clear: () => void) => readonly ResourceAction[];
} {
  const t = useCatalogueText(MESSAGES.en);
  return {
    rowActions: (order) => [
      { id: "open", label: t(K.open), onPress: () => report(t(K.opened, { order: order.order })) },
      {
        id: "archive",
        label: t(K.archive),
        onPress: async () => {
          await delay(DELAY);
          report(t(K.archived, { order: order.order }));
        },
      },
      {
        id: "refund",
        label: t(K.refund),
        isDisabled: order.status !== "paid",
        disabledReason: t(K.refund_reason),
        onPress: () => report(t(K.refunded, { order: order.order })),
      },
      {
        id: "delete",
        label: t(K.delete),
        tone: "danger",
        onPress: async () => {
          await delay(DELAY);
          report(t(K.delete_failed, { order: order.order }));
          throw new Error(t(K.failure));
        },
      },
    ],
    bulkActions: (clear) => [
      {
        id: "archive",
        label: t(K.archive),
        onPress: async () => {
          await delay(DELAY);
          report(t(K.bulk_archived));
          clear();
        },
      },
      {
        id: "delete",
        label: t(K.delete),
        tone: "danger",
        onPress: async () => {
          await delay(DELAY);
          report(t(K.bulk_delete_failed));
          throw new Error(t(K.failure));
        },
      },
    ],
  };
}
