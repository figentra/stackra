/**
 * Stackra file contract:
 * Purpose: `PromptInputActionProps`, props of an icon action: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { PromptInputActionProps as HeroPromptInputActionProps } from "@heroui-pro/react/prompt-input";

import type { PromptInputActionContractProps } from "#contracts/types/prompt-input-action-contract-props.type";

/** Props of an icon action: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type PromptInputActionProps = PromptInputActionContractProps &
  Omit<HeroPromptInputActionProps, keyof PromptInputActionContractProps | "aria-label">;
