/**
 * Stackra file contract:
 * Purpose: `TABLE_ORDERS`, the four rows every native Table demo lists.
 * Boundary: sample data only.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { TableOrder } from "#src/demos/free/table/table-order.type";

/** Four orders. */
export const TABLE_ORDERS: readonly TableOrder[] = [
  { id: "ord-1001", order: "#1001", customer: "Ada Lovelace", status: "paid", total: 124.5 },
  { id: "ord-1002", order: "#1002", customer: "Grace Hopper", status: "pending", total: 38 },
  { id: "ord-1003", order: "#1003", customer: "Linus Torvalds", status: "refunded", total: 76.25 },
  { id: "ord-1004", order: "#1004", customer: "Margaret Hamilton", status: "paid", total: 210 },
];
