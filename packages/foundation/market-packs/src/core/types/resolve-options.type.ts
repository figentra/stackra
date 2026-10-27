/**
 * Stackra file contract:
 * Purpose: `ResolveOptions`, what `resolvePack` needs beyond the market: the tenant's pins, the statuses it accepts
 *          and the product sections to include.
 * Boundary: a type only. A pin is a major line (`"2"`) or, for a rollback, one exact version (`"2.1.0"`), per market
 *           code in the overlay chain; an unpinned market takes its highest accepted version. Sections follow the
 *           major line of their base pack (or the market's pin, then the highest, when it has no base pack).
 *           `statuses` defaults to `live` only. `requireBase` defaults to true.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 4 and 7); ADR 0455 (decision 3).
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
  /**
   * Whether every market in the chain needs a base pack; when false, a market without one answers with its sections
   * and nests under its code's parent (`eu-de` under `eu`). True when left out.
   */
  readonly requireBase?: boolean;
};
