/**
 * Stackra file contract:
 * Purpose: `ImportField`, one field an import can fill: its key, its label, whether it is required and other names a
 *          file's column may use for it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** A field an import maps a column to. */
export interface ImportField {
  readonly key: string;
  readonly label: string;
  readonly isRequired?: boolean | undefined;
  /** Other column names that mean this field: "e-mail", "البريد". */
  readonly aliases?: readonly string[] | undefined;
}
