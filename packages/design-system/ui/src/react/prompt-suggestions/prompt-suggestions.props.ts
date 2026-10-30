/**
 * Stackra file contract:
 * Purpose: `PromptSuggestionsProps`, the props of the web `PromptSuggestions`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { PromptSuggestionsContractProps } from "#contracts/types/prompt-suggestions-contract-props.type";

/** Props of the web PromptSuggestions. */
export type PromptSuggestionsProps = PromptSuggestionsContractProps & {
  /** Styles the set. */
  readonly className?: string | undefined;
};
