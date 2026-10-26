/**
 * Stackra file contract:
 * Purpose: `CodeBlockCopyButtonProps`, props of the copy button: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { CodeBlockCopyButtonProps as HeroCodeBlockCopyButtonProps } from "@heroui-pro/react/code-block";

import type { CodeBlockCopyButtonContractProps } from "#contracts/types/code-block-copy-button-contract-props.type";

/** Props of the copy button: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type CodeBlockCopyButtonProps = CodeBlockCopyButtonContractProps &
  Omit<HeroCodeBlockCopyButtonProps, keyof CodeBlockCopyButtonContractProps | "aria-label">;
