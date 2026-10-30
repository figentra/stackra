/**
 * Stackra file contract:
 * Purpose: the props every runtime's `InlineSelect` takes: one choice from a short list, drawn as a word inside a
 *          sentence ("Show [10] per page") that opens the list when pressed.
 * Boundary: types only; a Select without the field chrome, so it is named by `label` (spoken, not shown).
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { SelectItem } from "#contracts/types/select-item.type";

/** Props shared by the web and native `InlineSelect`. */
export interface InlineSelectContractProps {
  /** The choices the control offers. */
  readonly items: readonly SelectItem[];
  /** The spoken name of the control; it is not drawn, the sentence around it is. */
  readonly label: string;
  /** The chosen key, for a controlled select. */
  readonly value?: string | undefined;
  /** The starting key, for an uncontrolled select; defaults to the first choice. */
  readonly defaultValue?: string | undefined;
  /** Called with the key chosen. */
  readonly onChange?: ((value: string) => void) | undefined;
  /** True to refuse change. */
  readonly isDisabled?: boolean | undefined;
}
