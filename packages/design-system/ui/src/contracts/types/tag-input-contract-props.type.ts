/**
 * Stackra file contract:
 * Purpose: `TagInputContractProps`, the props every runtime's `TagInput` takes: free-text tags typed or pasted into
 *          one field, split on commas and line breaks, each checked, up to a maximum.
 * Boundary: types only; the value is the tags in order. For choosing from a known list use MultiSelect.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `TagInput`. */
export interface TagInputContractProps extends FieldContractProps<readonly string[]> {
  /** Hint text in the empty input; it never replaces the label. */
  readonly placeholder?: string | undefined;
  /** The most tags; past it, new ones are refused with a message. Left out, no limit. */
  readonly maxTags?: number | undefined;
  /** Checks one tag; return the words to show for a bad one, or nothing to accept it. */
  readonly validate?: ((tag: string) => string | undefined) | undefined;
  /** True to accept the same tag twice. Defaults to false (compared ignoring case). */
  readonly allowDuplicates?: boolean | undefined;
}
