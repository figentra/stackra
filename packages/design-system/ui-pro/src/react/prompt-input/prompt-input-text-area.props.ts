/**
 * Stackra file contract:
 * Purpose: `PromptInputTextAreaProps`, props of the text area: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { PromptInputTextAreaProps as HeroPromptInputTextAreaProps } from "@heroui-pro/react/prompt-input";

import type { PromptInputTextAreaContractProps } from "#contracts/types/prompt-input-text-area-contract-props.type";

/** Props of the text area: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type PromptInputTextAreaProps = PromptInputTextAreaContractProps &
  Omit<HeroPromptInputTextAreaProps, keyof PromptInputTextAreaContractProps | "aria-label">;
