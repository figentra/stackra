/**
 * Stackra file contract:
 * Purpose: `GridCellError`, why a DataGrid cell is invalid: empty while required, under the minimum, over the
 *          maximum, not of the column's kind, or the app's own message.
 * Boundary: types only; each runtime words the first four from the `ui` catalogue.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid validation).
 */

/** Why a DataGrid cell is invalid. */
export type GridCellError =
  | { readonly kind: "required" | "type" }
  | { readonly kind: "min" | "max"; readonly limit: number }
  | { readonly kind: "custom"; readonly message: string };
