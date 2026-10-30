/**
 * Stackra file contract:
 * Purpose: `ListboxContractProps`, the props every runtime's `Listbox` takes: an always-visible list of options,
 *          one or several chosen, with checkmarks and optional titled sections.
 * Boundary: types only; the value is the chosen ids in either mode. For a closed list behind a button use Select.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { ListboxSection } from "#contracts/types/listbox-section.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/** Props shared by the web and native `Listbox`. */
export interface ListboxContractProps extends FieldContractProps<readonly string[]> {
  /** The options, when they are not in sections. */
  readonly items?: readonly SelectItem[] | undefined;
  /** The options in titled groups; used instead of `items`. */
  readonly sections?: readonly ListboxSection[] | undefined;
  /** `single` (the default) or `multiple`. */
  readonly selectionMode?: "single" | "multiple" | undefined;
  /** The list's spoken name when it has no visible label. */
  readonly ariaLabel?: string | undefined;
}
