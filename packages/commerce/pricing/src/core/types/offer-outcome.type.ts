/**
 * Stackra file contract:
 * Purpose: `OfferOutcome`, what applied offers give one billing period: the price after every percentage, the credit
 *          grants and modules in force, and whether the migration is free.
 * Boundary: a type only; `applyOffers` builds it and OS billing turns it into invoice lines, credit grants and
 *           module entitlements.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 2); owner M3-6.
 */
import type { Money } from "@stackra/money";

import type { OfferBenefit } from "#core/types/offer-benefit.type";

/** One period's offer outcome. */
export interface OfferOutcome {
  /** The price after every percentage in force. */
  readonly price: Money;

  /** The credit grants in force. */
  readonly credits: readonly Extract<OfferBenefit, { kind: "credit_grant" }>[];

  /** Module keys granted at no charge. */
  readonly modules: readonly string[];

  /** Whether any applied offer makes the migration free. */
  readonly freeMigration: boolean;
}
