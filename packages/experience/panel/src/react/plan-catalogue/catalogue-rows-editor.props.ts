/**
 * Stackra file contract:
 * Purpose: `CatalogueRowsEditorProps`, the props of the plan-catalogue admin's rows editor: the rows of a record
 *          version, the change handler, and whether it only shows them.
 * Boundary: types only; the rows are untrusted data until the record kind's reader checks them.
 * Runtime: browser
 * Governing contract: ADR 0391 (decision 2); config-model section 2 (the catalogue is data).
 */
import type { CatalogueRow } from "@stackra/contracts";

/** Props of `CatalogueRowsEditor`. */
export interface CatalogueRowsEditorProps {
  /** The rows, in order. */
  readonly rows: readonly CatalogueRow[];
  /** Called with every row after any edit, row added or row removed. */
  readonly onChange?: ((rows: readonly CatalogueRow[]) => void) | undefined;
  /** True to show the rows without editing them (the version in force, a past version). */
  readonly isReadOnly?: boolean | undefined;
}
