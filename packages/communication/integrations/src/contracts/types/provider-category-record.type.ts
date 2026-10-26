/**
 * Stackra file contract:
 * Purpose: `ProviderCategoryRecord`, the `provider-category:<name>` record of the X2-36 registry: which sources a
 *          provider category offers (managed, bring-your-own or both), the price record a managed resource is billed on
 *          (a rate card or a fee schedule), the BYO fee's rate card, and the workflow template that provisions a
 *          managed resource.
 * Boundary: a type only; the records are seed data the registry loads (`PROVIDER_CATEGORY_SEEDS`) and an operator
 *           edits. Which of the offered sources a Market allows is market-pack data; prices are on the rate cards.
 * Runtime: isomorphic
 * Governing contract: R3-CE-13; R3-SO-03; M3-4; M3-13; X2-36; config-model sections 2 and 6.
 */
import type { ProviderSource } from "#contracts/enums/provider-source.enum";

/**
 * A provider category.
 *
 * @example
 * const payments = PROVIDER_CATEGORY_SEEDS.find((record) => record.key === "provider-category:payments");
 */
export interface ProviderCategoryRecord {
  /** The record key, `provider-category:<name>`. */
  readonly key: `provider-category:${string}`;

  /** The category's name (`payments`, `tenant-verification`). */
  readonly name: string;

  /** The sources it offers, preferred first. */
  readonly sources: readonly ProviderSource[];

  /**
   * The managed source: the price record it is billed on (`rate-card:<name>` or `fee-schedule:<name>`) and the workflow
   * template that provisions a resource.
   */
  readonly managed?: {
    readonly pricing: `${"rate-card" | "fee-schedule"}:${string}`;
    readonly provisioning: `workflow-template:os:managed-provisioning:${string}`;
  };

  /** The BYO source's fee rate card; absent when bringing your own is free. */
  readonly byoPricing?: `rate-card:${string}`;

  /** The owner decisions behind the record. */
  readonly decisions: readonly string[];
}
