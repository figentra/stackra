/**
 * Stackra file contract:
 * Purpose: `ProviderMode`, whose Connection serves one entry of a resolved failover list: `own` (the caller's own
 *          Connection, found in the caller's scope) or `managed` (the Market's platform Connection, run by the
 *          deployment).
 * Boundary: an `Enum.of` value plus the type of the same name. It answers which Connection served, so a delivery
 *           records its mode and a caller applies its own policy (an own Connection serving alone, without falling
 *           back to managed, is the caller's rule, never the resolver's). It is not `ProviderSource`, which says whose
 *           account an own Connection acts on.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4 and 7); ADR 0422 (decision 3).
 */
import { Enum } from "@stackra/contracts";

/**
 * Own or managed.
 *
 * @example
 * if (candidate.mode === ProviderMode.Own) record.mode = "own";
 */
export const ProviderMode = Enum.of({
  /** The caller's own Connection. */
  Own: "own",
  /** The Market's platform Connection. */
  Managed: "managed",
});

/** One of the codes above. */
export type ProviderMode = Enum.Value<typeof ProviderMode>;
