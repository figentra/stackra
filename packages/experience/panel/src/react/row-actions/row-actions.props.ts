/**
 * Stackra file contract:
 * Purpose: `RowActionsProps`, what a host hands RowActions: the `RowActionsSpec` (the actions, their sections, the
 *          trigger's name, icon, variant and size, the hover buttons), the record the actions act on, and what choosing
 *          one does.
 * Boundary: a type in its own file beside the component (ADR 0305). The host resolves each spec's `action` key and runs
 *           it (with `useActionRunner`, passing the spec's `confirm`); a spec with `href` is a link and is never handed
 *           to `onAction`. Spec text fields are words or i18n keys.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3); ADR 0504; the SDUI catalogue case `rowActions` (STA-1981).
 */
import type { ActionButtonSpec } from "#core/types/action-button-spec.type";
import type { RowActionsSpec } from "#core/types/row-actions-spec.type";

/**
 * The row menu and what a choice does.
 *
 * @example
 * <RowActions label={labels.actionsFor(order.number)} actions={specs} record={order} onAction={(spec) => runSpec(spec, order)} />
 */
export interface RowActionsProps extends RowActionsSpec {
  /** The record the actions act on; each spec's `visibleWhen` reads it. */
  readonly record?: object | undefined;
  /** Called with the chosen action's spec; a returned promise is the host's to report. */
  readonly onAction: (action: ActionButtonSpec) => void | Promise<void>;
}
