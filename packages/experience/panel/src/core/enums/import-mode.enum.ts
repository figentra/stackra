/**
 * Stackra file contract:
 * Purpose: `ImportMode`, what a resource import does with each row of the file.
 * Boundary: an enum (`Enum.of`) written in `a.import({ mode, match })`; every row runs the full action pipeline, and
 *           failed rows are written to a file the user downloads.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 10: import is a placement over an Action); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * How an import treats a row.
 *
 * @example
 * a.import({ mode: ImportMode.Upsert, match: "slug", maxRows: 10_000 })
 */
export const ImportMode = Enum.of({
  /** Every row creates a record. */
  Create: "create",
  /** Every row updates the record its `match` key finds. */
  Update: "update",
  /** A row updates the record its `match` key finds, or creates one. */
  Upsert: "upsert",
});

/** One of the codes above. */
export type ImportMode = Enum.Value<typeof ImportMode>;
