/**
 * Stackra file contract:
 * Purpose: `Disposal`, the way a record is about to be disposed of, which the `HoldRegistry` is told so the refused
 *          attempt on a held record is logged with it: a unit-of-work delete, a bulk purge or a retention job.
 * Boundary: an `Enum.of` value plus the type of the same name. A soft delete or an archive keeps the row and is not a
 *           disposal.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (decisions 3 and 4, and its 2026-10-24 amendment); ADR 0189 (decision 4).
 */
import { Enum } from "@stackra/contracts";

/** How a record would leave the database. */
export const Disposal = Enum.of({
  /** A unit-of-work delete of one loaded row (`em.remove` then flush). */
  Delete: "delete",
  /** A bulk delete by filter (`CrudService.purge`). */
  Purge: "purge",
  /** A scheduled retention job pruning rows past their retention. */
  Retention: "retention",
});

/** One of the codes above. */
export type Disposal = Enum.Value<typeof Disposal>;
