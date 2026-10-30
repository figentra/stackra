/**
 * Stackra file contract:
 * Purpose: `MIRROR_ORDERS`, the made-up orders the mirror hero's card lists: who (a `brand::hero.mirror.person_*` key), the
 *          order's code, its status and its amount in US cents.
 * Boundary: data only; the words are the catalogue's, the amounts are formatted in the card's locale.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept C).
 */

/** The orders, newest first. */
export const MIRROR_ORDERS = [
  { person: "person_1", sku: "SKU-104-B", status: "paid", cents: 24_800 },
  { person: "person_2", sku: "SKU-221-A", status: "pending", cents: 9250 },
  { person: "person_3", sku: "SKU-087-C", status: "shipped", cents: 131_000 },
] as const;
