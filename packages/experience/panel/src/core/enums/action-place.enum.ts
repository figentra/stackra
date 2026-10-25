/**
 * Stackra file contract:
 * Purpose: `ActionPlace`, the places on a resource's pages where a placed action's button can sit.
 * Boundary: an enum (`Enum.of`) read by `.in(...)` on a placement and by the renderer; the default places follow the
 *           action's input, which gen reads (ADR 0307 rule 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3: places follow the input); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * Where an action's button sits.
 *
 * @example
 * a.run(AttachProductImageAction).in(ActionPlace.View, ActionPlace.Edit)
 */
export const ActionPlace = Enum.of({
  /** On each row of the list, in its overflow menu. */
  Row: "row",
  /** In the View page's header. */
  View: "view",
  /** In the Edit page's header. */
  Edit: "edit",
  /** In the bulk bar of a selection; fanned out with the policy per record. */
  Bulk: "bulk",
  /** In the list's header. */
  ListHeader: "list_header",
  /** In the list's empty state. */
  Empty: "empty",
});

/** One of the codes above. */
export type ActionPlace = Enum.Value<typeof ActionPlace>;
