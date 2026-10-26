/**
 * Stackra file contract:
 * Purpose: `PlanCatalogue`, the parsed rows of one `plan-catalogue:<product>` version: its tiers, seat kinds, modules
 *          and trials, plus the rows of any other record kind, untouched, for the service that owns that kind.
 * Boundary: a type only; `planCatalogueOf` builds it from a version's rows and checks every reference. `extras` is
 *           not parsed here: a `limit-policy` or service-specific row is read by the service that declares it.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2; stackra-117 (open catalogue records).
 */
import type { CatalogueModule } from "#core/types/catalogue-module.type";
import type { CatalogueRow } from "#core/types/catalogue-row.type";
import type { PlanTier } from "#core/types/plan-tier.type";
import type { SeatKind } from "#core/types/seat-kind.type";
import type { TrialTerms } from "#core/types/trial-terms.type";

/** One product's plan catalogue. */
export interface PlanCatalogue {
  /** Tiers, lowest rank first. */
  readonly tiers: readonly PlanTier[];

  /** The kinds of seat a plan sells. */
  readonly seatKinds: readonly SeatKind[];

  /** The modules sold on top of a tier. */
  readonly modules: readonly CatalogueModule[];

  /** The trials a scope can start. */
  readonly trials: readonly TrialTerms[];

  /** Rows of every other record kind (`limit_policy`), by that kind, in row order; empty when there are none. */
  readonly extras: Readonly<Record<string, readonly CatalogueRow[]>>;
}
