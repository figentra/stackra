/**
 * Stackra file contract:
 * Purpose: `Disposal`, the way a record is about to be disposed of, which the `HoldRegistry` is told so the refused
 *          attempt on a held record is logged with it: a unit-of-work delete, a bulk purge, a retention job, or an edit
 *          that overwrites a record whose history a hold freezes.
 * Boundary: an `Enum.of` value plus the type of the same name. A soft delete or an archive keeps the row and is not a
 *           disposal. No write path asks with `Edit` by itself: a service whose edits a hold freezes (a comment kept
 *           with its revisions) asks `disposableIds(model, [id], Disposal.Edit)` before it writes.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (decisions 3 and 4, and its 2026-10-24 amendment); ADR 0189 (decision 4); STA-1241
 *                     (`Edit`).
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
  /** An edit that overwrites a record a hold freezes, so its earlier content would be lost. */
  Edit: "edit",
});

/** One of the codes above. */
export type Disposal = Enum.Value<typeof Disposal>;
