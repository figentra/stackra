/**
 * Stackra file contract:
 * Purpose: `PromptInputProps`, props of the web PromptInput: the shared contract plus HeroUI Pro's own, with
 *          `isPending` renamed `isLoading`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { PromptInputProps as HeroPromptInputProps } from "@heroui-pro/react/prompt-input";

import type { PromptInputContractProps } from "#contracts/types/prompt-input-contract-props.type";

/** Props of the web PromptInput: the shared contract plus HeroUI Pro's own, with `isPending` renamed `isLoading`. */
export type PromptInputProps = PromptInputContractProps &
  Omit<HeroPromptInputProps, keyof PromptInputContractProps | "isPending">;
