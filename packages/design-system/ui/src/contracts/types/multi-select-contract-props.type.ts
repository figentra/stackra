/**
 * Stackra file contract:
 * Purpose: the props every runtime's `MultiSelect` takes: the field contract over the chosen ids, the options it filters
 *          as the user types, and the words of the chips' remove buttons and the empty list.
 * Boundary: types only. The options are known up front and filtered on the device; a list a server searches is
 *           EntityPicker's job.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 4 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0303
 *          (decision 7); ADR 0055 (forms: one field contract).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/** Props shared by the web and native `MultiSelect`. */
export interface MultiSelectContractProps extends FieldContractProps<readonly string[]> {
  /** Every option; the typed text narrows them by label. */
  readonly items: readonly SelectItem[];
  /** Hint text drawn inside the empty input. */
  readonly placeholder?: string | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
  /** The spoken name of a chip's remove button. Defaults to the `ui` catalogue's "Remove {label}". */
  readonly removeLabel?: ((label: string) => string) | undefined;
  /** What the list says when nothing matches the text. Defaults to the `ui` catalogue's words. */
  readonly emptyMessage?: string | undefined;
  /** True to put "Select all" (and "Clear all" once everything is chosen) at the top of the list. */
  readonly hasSelectAll?: boolean | undefined;
  /** The most chips shown in the field; the rest fold into one "+N" chip that names them. Left out, all show. */
  readonly maxVisible?: number | undefined;
}
