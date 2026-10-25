/**
 * Stackra file contract:
 * Purpose: `AWARD_RECIPIENTS`, the registry of recipient models awards may be granted to: model key to the `Rules` a
 *          kind's criteria over it may test.
 * Boundary: internal; filled by `registerAwardRecipients` when a consumer's module loads, read by the two services.
 *           Not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 1 and 4).
 */
import type { Rules } from "@stackra/rules";

/** Registered recipient models, by key. */
export const AWARD_RECIPIENTS = new Map<string, Rules>();
