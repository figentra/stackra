/**
 * Stackra file contract:
 * Purpose: `PromptSuggestionProps`, props of the web PromptSuggestion: the shared contract plus HeroUI Pro's own root
 *          props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { PromptSuggestionRootProps as HeroPromptSuggestionRootProps } from "@heroui-pro/react/prompt-suggestion";

import type { PromptSuggestionContractProps } from "#contracts/types/prompt-suggestion-contract-props.type";

/** Props of the web PromptSuggestion: the shared contract plus HeroUI Pro's own root props, passed through. */
export type PromptSuggestionProps = PromptSuggestionContractProps &
  Omit<HeroPromptSuggestionRootProps, keyof PromptSuggestionContractProps>;
