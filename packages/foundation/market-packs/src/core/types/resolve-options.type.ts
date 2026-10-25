/**
 * Stackra file contract:
 * Purpose: `ResolveOptions`, what `resolvePack` needs beyond the market: the tenant's pins, the statuses it accepts
 *          and the product sections to include.
 * Boundary: a type only. A pin is a major line (`"2"`) or, for a rollback, one exact version (`"2.1.0"`), per market
 *           code in the overlay chain; an unpinned market takes its highest accepted version. Sections follow the
 *           major line of their base pack. `statuses` defaults to `live` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 4 and 7).
 */
import type { PackStatus } from "#core/enums/pack-status.enum";

/** Options of one resolution. */
export type ResolveOptions = {
  /** Market code to a major line or an exact version. */
  readonly pins?: Readonly<Record<string, string>>;
  /** The statuses a version may have; `live` only when left out. */
  readonly statuses?: readonly PackStatus[];
  /** The product sections to include beside each base pack. */
  readonly sections?: readonly string[];
};
