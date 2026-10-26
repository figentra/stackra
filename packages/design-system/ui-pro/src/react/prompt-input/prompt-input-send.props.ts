/**
 * Stackra file contract:
 * Purpose: `PromptInputSendProps`, props of the send button: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { PromptInputSendProps as HeroPromptInputSendProps } from "@heroui-pro/react/prompt-input";

import type { PromptInputSendContractProps } from "#contracts/types/prompt-input-send-contract-props.type";

/** Props of the send button: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type PromptInputSendProps = PromptInputSendContractProps &
  Omit<HeroPromptInputSendProps, keyof PromptInputSendContractProps | "aria-label" | "isPending">;
