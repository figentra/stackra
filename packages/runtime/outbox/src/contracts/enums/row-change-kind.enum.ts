/**
 * Stackra file contract:
 * Purpose: `RowChangeKind`, how a watched row changed in the flush that wrote it: created, updated or deleted.
 * Boundary: an `Enum.of` value plus the type of the same name, read by change consumers (search keeps or drops a
 *           document by it).
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5); ADR 0294 (decision 16); ADR 0231 (codes).
 */
import { Enum } from "@stackra/contracts";

/** The ways a row changes. */
export const RowChangeKind = Enum.of({
  /** The row was inserted. */
  Created: "created",
  /** Some of the row's fields were written. */
  Updated: "updated",
  /** The row was deleted. */
  Deleted: "deleted",
});

/** One of the codes above. */
export type RowChangeKind = Enum.Value<typeof RowChangeKind>;
