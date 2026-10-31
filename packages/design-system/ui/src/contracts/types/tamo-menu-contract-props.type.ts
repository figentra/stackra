/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoMenu` takes: the Tamo button that opens the text actions (rewrite, shorten,
 *          expand, fix grammar, translate, tone) plus the slot's contributed actions.
 * Boundary: types only; the menu reports the action chosen and runs nothing itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { Size } from "#contracts/enums/size.enum";
import type { TamoActionKind } from "#contracts/enums/tamo-action-kind.enum";
import type { TamoStatus } from "#contracts/enums/tamo-status.enum";
import type { TamoActionItem } from "#contracts/types/tamo-action-item.type";

/** Props shared by the web and native `TamoMenu`. */
export interface TamoMenuContractProps {
  /** Called with the chosen action: a `TamoActionKind`, `continue`, `draft` or a contributed action's id. */
  readonly onAction: (action: string) => void;
  /** The built-in actions offered, in order. Defaults to every `TamoActionKind`. */
  readonly kinds?: readonly TamoActionKind[] | undefined;
  /** More actions, after the built-in ones (a module's, through the slot). */
  readonly actions?: readonly TamoActionItem[] | undefined;
  /** True to offer "Continue writing" (ghost text). */
  readonly hasContinue?: boolean | undefined;
  /** The text the actions work on: empty, only "Draft with Tamo" is offered; Arabic letters turn Translate to English. */
  readonly text?: string | undefined;
  /** The trigger's words and name. Defaults to "Ask Tamo". */
  readonly label?: string | undefined;
  /** True to draw the trigger as the mark only. */
  readonly isIconOnly?: boolean | undefined;
  /** The trigger's size. */
  readonly size?: Size | undefined;
  /** The task's state, shown on the trigger. */
  readonly status?: TamoStatus | undefined;
}
