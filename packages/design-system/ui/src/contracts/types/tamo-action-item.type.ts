/**
 * Stackra file contract:
 * Purpose: `TamoActionItem`, one action a module contributes to Tamo's action menu ("Write a product description").
 * Boundary: a type only; choosing it runs the slot's `transform` task with its id as the action, so the module's provider
 *           answers it.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
/** A contributed Tamo action. */
export interface TamoActionItem {
  /** The action's key, passed as `action` to the `transform` task. */
  readonly id: string;
  /** Its words in the active language. */
  readonly label: string;
  /** A second line: what it does. */
  readonly description?: string | undefined;
}
