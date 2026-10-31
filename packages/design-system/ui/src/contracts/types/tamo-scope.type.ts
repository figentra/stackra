/**
 * Stackra file contract:
 * Purpose: `TamoScope`, where a slot asks whether Tamo is on: the field's key, and the screen when a part knows it better than
 *          the provider.
 * Boundary: a type only; the answer is the AI module's (workspace, screen and field settings, lockable).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
/** Where a Tamo slot sits. */
export interface TamoScope {
  /** The field's key (its `name`), for a per-field setting. */
  readonly field?: string | undefined;
  /** The screen's key; left out, the provider's current screen. */
  readonly screen?: string | undefined;
}
