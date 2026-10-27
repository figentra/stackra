/**
 * Stackra file contract:
 * Purpose: `allDayCounts(tickets)`, the all-day counts of a kitchen board: how many of each item are still to make,
 *          summed over the lines that are neither done nor held, in the order each item first appears.
 * Boundary: internal; pure. Items are counted by name, as the kitchen reads them.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { KdsTicket } from "#contracts/types/kds-ticket.type";

/**
 * The pending quantity of each item name, held tickets and lines left out.
 *
 * @example
 * allDayCounts(tickets); // [["Burger", 5], ["Fries", 3]]
 */
export function allDayCounts(
  tickets: readonly KdsTicket[],
): ReadonlyArray<readonly [string, number]> {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    if (ticket.isHeld === true) continue;
    for (const item of ticket.items)
      if (item.isDone !== true && item.isHeld !== true)
        counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
  }
  return [...counts];
}
