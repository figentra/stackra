/**
 * Stackra file contract:
 * Purpose: `DebitOutcome`, what a covered debit on the ledger did: written, already applied, or refused because the
 *          balance did not cover it.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry; returned by `LoyaltyLedger#debit`, so
 *           the port needs no refusal class (refusals live in core). `LoyaltyService` turns `uncovered` into
 *           `InsufficientPointsError`. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 20); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * Exactly one case per debit call; `duplicate` and `uncovered` change nothing.
 *
 * @example
 * if ((await ledger.debit(entry)) === DebitOutcome.Uncovered) throw InsufficientPointsError.create({ balance, requested });
 */
export const DebitOutcome = Enum.of({
  /** The debit was written now. */
  Written: "written",
  /** The reference was already applied; nothing changed. */
  Duplicate: "duplicate",
  /** The balance did not cover the debit; nothing changed. */
  Uncovered: "uncovered",
});

/** One of the codes above. */
export type DebitOutcome = Enum.Value<typeof DebitOutcome>;
