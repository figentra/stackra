/**
 * Stackra file contract:
 * Purpose: `PlanCatalogue`, the parsed rows of one `plan-catalogue:<product>` version: its tiers, seat kinds, modules
 *          and trials.
 * Boundary: a type only; `planCatalogueOf` builds it from a version's rows and checks every reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2.
 */
import type { CatalogueModule } from "#core/types/catalogue-module.type";
import type { PlanTier } from "#core/types/plan-tier.type";
import type { SeatKind } from "#core/types/seat-kind.type";
import type { TrialTerms } from "#core/types/trial-terms.type";

/** One product's plan catalogue. */
export interface PlanCatalogue {
  /** Tiers, lowest rank first. */
  readonly tiers: readonly PlanTier[];

  /** Seat kinds. */
  readonly seatKinds: readonly SeatKind[];

  /** Paid modules. */
  readonly modules: readonly CatalogueModule[];

  /** Trials. */
  readonly trials: readonly TrialTerms[];
}
