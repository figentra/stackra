/**
 * Stackra file contract:
 * Purpose: `ExportRequest`, what an `ExportDialog` hands `onExport`: the format, the columns, the scope of rows and
 *          the delivery the user chose.
 * Boundary: a type only; building and sending the file is the app's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 16 (owner decision 2026-10-28, P1 + P2 core).
 */
import type { ExportDelivery } from "#contracts/enums/export-delivery.enum";
import type { ExportScope } from "#contracts/enums/export-scope.enum";

/** The user's choices, as submitted. */
export interface ExportRequest {
  /** The `value` of the chosen format option. */
  readonly format: string;
  /** The `value`s of the chosen columns, in the order they are offered; empty when no columns were offered. */
  readonly columns: readonly string[];
  /** Which rows go into the file. */
  readonly scope: ExportScope;
  /** How the file reaches the user. */
  readonly delivery: ExportDelivery;
}
