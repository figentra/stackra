/**
 * Stackra file contract:
 * Purpose: `StackraTier`, the `stackra.tier` of a `package` item: the member's turbo tier tag without `tier:`
 *          (`lib` for `packages/<category>/*`, `config` for `packages/tooling/*`, `app` for apps and Workers,
 *          `service` for services).
 * Boundary: an `Enum.of` value plus the type of the same name; the set is ADR 0003's tiers.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0003 (tiers); ADR 0284 (Workers).
 */
import { Enum } from "@stackra/contracts";

/** One case per turbo tier. */
export const StackraTier = Enum.of({
  /** A library under `packages/<category>/<name>`. */
  Lib: "lib",
  /** An app under `apps/*`, or a Worker under `workers/*` (ADR 0284). */
  App: "app",
  /** A service under `services/*`. */
  Service: "service",
  /** A shared tool config under `packages/tooling/*`. */
  Config: "config",
});

/** One of the codes above. */
export type StackraTier = Enum.Value<typeof StackraTier>;
