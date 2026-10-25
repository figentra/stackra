/**
 * Stackra file contract:
 * Purpose: `DocumentLayout`, how a Page document lays out its blocks.
 * Boundary: an enum (`Enum.of`); a Dashboard has no layout option, because it is always the 12-column grid.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0110; ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A Page document's layout.
 *
 * @example
 * layout: DocumentLayout.Stack
 */
export const DocumentLayout = Enum.of({
  /** Blocks one under another at full width. */
  Stack: "stack",
  /** Blocks in one readable column. */
  SingleColumn: "single_column",
});

/** One of the codes above. */
export type DocumentLayout = Enum.Value<typeof DocumentLayout>;
