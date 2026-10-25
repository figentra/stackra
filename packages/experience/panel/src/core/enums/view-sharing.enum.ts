/**
 * Stackra file contract:
 * Purpose: `ViewSharing`, who sees a saved view: its owner only, or everyone in the owner's scope who may read the
 *          resource.
 * Boundary: an enum (`Enum.of`). Sharing never widens what a viewer may read: the list query gates every row. Who may
 *           share is the `ViewStore` driver's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14: sharing); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A saved view's audience.
 *
 * @example
 * { sharing: ViewSharing.Scope }
 */
export const ViewSharing = Enum.of({
  /** The owner only. */
  Private: "private",
  /** Everyone in the owner's scope who may read the resource. */
  Scope: "scope",
});

/** One of the codes above. */
export type ViewSharing = Enum.Value<typeof ViewSharing>;
