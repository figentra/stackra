/**
 * Stackra file contract:
 * Purpose: `ProviderCatalogueEntry`, one row of the provider catalogue: a provider of a category, offered in a market
 *          pack with a status (`live` where the driver is built and certified, `planned` otherwise) and the sources a
 *          tenant may connect it as.
 * Boundary: a type only; the rows are seed data (`PROVIDER_CATALOGUE_SEEDS`) a market pack's provider lists cite. A
 *           `planned` row is shown and never served.
 * Runtime: isomorphic
 * Governing contract: R4-4; R3-SO-04; US-35; US-43; config-model section 6.
 */
import type { ProviderSource } from "#contracts/enums/provider-source.enum";

/**
 * A catalogue row.
 *
 * @example
 * const live = PROVIDER_CATALOGUE_SEEDS.filter((row) => row.pack === market && row.status === "live");
 */
export interface ProviderCatalogueEntry {
  /** The Integration's provider code. */
  readonly provider: string;

  /** The provider category's name. */
  readonly category: string;

  /** The market pack it is offered in. */
  readonly pack: string;

  /** Whether it may be connected now. */
  readonly status: "live" | "planned";

  /** The sources a tenant may connect it as. */
  readonly sources: readonly ProviderSource[];

  /** The owner decisions behind the row. */
  readonly decisions: readonly string[];
}
