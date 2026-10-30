/**
 * Stackra file contract:
 * Purpose: `PromptSuggestionsContractProps`, the props every runtime's `PromptSuggestions` takes: the suggested
 *          prompts, what choosing one does, and whether they wrap or scroll sideways.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { PromptSuggestion } from "#contracts/types/prompt-suggestion.type";

/** Props shared by the web and native `PromptSuggestions`. */
export interface PromptSuggestionsContractProps {
  /** The suggestions, in order. */
  readonly suggestions: readonly PromptSuggestion[];
  /** Called with the suggestion chosen. */
  readonly onSelect: (suggestion: PromptSuggestion) => void;
  /** `wrap` (the default) flows them onto more lines; `scroll` keeps one line that scrolls sideways. */
  readonly layout?: "wrap" | "scroll" | undefined;
  /** The set's accessible name. Defaults to the catalogue's "Suggested prompts". */
  readonly label?: string | undefined;
  /** True to show them but refuse choosing, for example while an answer is being written. */
  readonly isDisabled?: boolean | undefined;
}
