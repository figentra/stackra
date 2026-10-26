/**
 * Stackra file contract:
 * Purpose: `CatalogueSeedRecord`, one plan-catalogue record as a product seed pack (`seed-pack:<product>`) holds it:
 *          its kind, its key and its rows.
 * Boundary: a type only, the structural form of the CLI's seed record (`stackra seed-pack` reads the YAML), so this
 *           package needs no Node reader. `PlanCatalogueService.seed` stores it as the record's first version.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 5); config-model section 6.
 */
import type { Json } from "@stackra/contracts";

/** One seeded record. */
export interface CatalogueSeedRecord {
  /** The record kind (`plan-catalogue`, `price-list`, `offer`). */
  readonly kind: string;

  /** The record key (`plan-catalogue:commerce`). */
  readonly key: string;

  /** The rows, in file order. */
  readonly rows: readonly Readonly<Record<string, Json>>[];
}
