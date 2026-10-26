/**
 * Stackra file contract:
 * Purpose: `MarkdownProps`, props of the web Markdown: the shared contract plus HeroUI Pro's own div props, passed
 *          through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { MarkdownProps as HeroMarkdownProps } from "@heroui-pro/react/markdown";

import type { MarkdownContractProps } from "#contracts/types/markdown-contract-props.type";

/** Props of the web Markdown: the shared contract plus HeroUI Pro's own div props, passed through. */
export type MarkdownProps = MarkdownContractProps &
  Omit<HeroMarkdownProps, keyof MarkdownContractProps>;
