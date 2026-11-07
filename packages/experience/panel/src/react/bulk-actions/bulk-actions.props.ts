/**
 * Stackra file contract:
 * Purpose: `BulkActionsProps`, what a host hands BulkActions: the `BulkActionsSpec` (the actions, the bar's words and
 *          variant, the run mode, select-all-matching and the export), the selection and its clear, and what an action
 *          and the export do.
 * Boundary: a type in its own file beside the component (ADR 0305). The host resolves each spec's `action` key and runs
 *           it; `onAction` is called once per selected id (`per-record`) or once with them all (`once`). The export
 *           button needs both `onExport` and the host's `exportLabel`. Spec text fields are words or i18n keys.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3: bulk fans out per record); ADR 0504; the SDUI catalogue case `bulkActions`
 *                     (STA-1981).
 */
import type { AllMatchingSelectionContractProps } from "@stackra/ui/contracts";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";
import type { BulkActionsSpec } from "#core/types/bulk-actions-spec.type";

/**
 * The bulk bar and what its buttons do.
 *
 * @example
 * <BulkActions actions={specs} selectedKeys={selected} onClearSelection={clear} onAction={(spec, ids) => runSpec(spec, ids)} />
 */
export interface BulkActionsProps extends BulkActionsSpec, AllMatchingSelectionContractProps {
  /** The ids of the selected records, in order. */
  readonly selectedKeys: readonly string[];
  /** Called when the user clears the selection; the host empties it. */
  readonly onClearSelection: () => void;
  /** True when every record on screen is selected; "Select all N" is offered only then. */
  readonly isPageSelected?: boolean | undefined;
  /** Called with a chosen action's spec and the ids it runs over. */
  readonly onAction: (action: ActionButtonSpec, ids: readonly string[]) => void | Promise<void>;
  /** Called with the selected ids when the export is chosen. */
  readonly onExport?: ((ids: readonly string[]) => void | Promise<void>) | undefined;
  /** The export button's words; the host's. */
  readonly exportLabel?: string | undefined;
}
