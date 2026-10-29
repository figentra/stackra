/**
 * Stackra file contract:
 * Purpose: `OnDelete`, what happens to a row when the row its many-to-one points at is deleted: deleted with it,
 *          its reference cleared, or the delete refused.
 * Boundary: an enum and its same-named type; gen writes it as the foreign key's `ON DELETE` rule. Without the option a
 *           foreign key refuses the delete (`restrict`). A link (`Link<T>`) has no foreign key, so the option does not
 *           apply to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 11, 16 Enum row and 28); ADR 0231 (snake_case codes, `fk_` names).
 */
import { Enum } from "@stackra/contracts";

/**
 * The delete rule of a same-module many-to-one.
 *
 * @example
 * ```ts
 * @ManyToOne(() => Order, { onDelete: OnDelete.Cascade })
 * order!: Ref<Order>;
 * ```
 */
export const OnDelete = Enum.of({
  /** Deleting the parent deletes its rows. */
  Cascade: "cascade",
  /** Deleting the parent sets the column to null. */
  SetNull: "set_null",
  /** Deleting a parent that still has rows fails. */
  Restrict: "restrict",
});

/** One of the delete rules. */
export type OnDelete = Enum.Value<typeof OnDelete>;
