/**
 * Stackra file contract:
 * Purpose: `CodeBlockProps`, props of the web CodeBlock: the shared contract plus HeroUI Pro's own div props, passed
 *          through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { CodeBlockProps as HeroCodeBlockProps } from "@heroui-pro/react/code-block";

import type { CodeBlockContractProps } from "#contracts/types/code-block-contract-props.type";

/** Props of the web CodeBlock: the shared contract plus HeroUI Pro's own div props, passed through. */
export type CodeBlockProps = CodeBlockContractProps &
  Omit<HeroCodeBlockProps, keyof CodeBlockContractProps>;
