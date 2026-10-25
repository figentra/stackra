/**
 * Stackra file contract:
 * Purpose: how the root runway packs the service members of one environment into process allocations of the one
 *          generated Encore application.
 * Boundary: an `Enum.of` value plus the type of the same name; placement rules per mode are `checkPlacement`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 2 and 3), ADR 0289 (decision 5: one Encore app), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per topology mode. */
export const TopologyMode = Enum.of({
  /** Every member in one process allocation. */
  Monolith: "monolith",
  /** Members packed into the named groups; every member is placed in exactly one group. */
  Grouped: "grouped",
  /** One process allocation per member. */
  Split: "split",
});

/** One of the codes above. */
export type TopologyMode = Enum.Value<typeof TopologyMode>;
