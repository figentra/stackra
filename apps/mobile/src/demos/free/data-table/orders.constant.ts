/**
 * Stackra file contract:
 * Purpose: `ORDERS`, the twelve pretend orders every native DataTable demo lists: the same rows on every load.
 * Boundary: sample data only.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0305 (one declaration per file).
 */
import type { Order } from "#src/demos/free/data-table/order.type";

const CUSTOMERS = ["Ada Lovelace", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton"] as const;
const STATUSES = ["paid", "pending", "refunded"] as const;

/** Twelve orders, `#1001` to `#1012`. */
export const ORDERS: readonly Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: `ord-${1001 + index}`,
  order: `#${1001 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length] ?? "",
  status: STATUSES[index % STATUSES.length] ?? "paid",
  total: ((index * 37) % 90) + 10,
}));
