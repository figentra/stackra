/**
 * Stackra file contract:
 * Purpose: `StreamMarkdownProps`, props of the web StreamMarkdown: the shared contract plus HeroUI Pro's own, passed
 *          through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { StreamMarkdownProps as HeroStreamMarkdownProps } from "@heroui-pro/react/markdown";

import type { StreamMarkdownContractProps } from "#contracts/types/stream-markdown-contract-props.type";

/** Props of the web StreamMarkdown: the shared contract plus HeroUI Pro's own, passed through. */
export type StreamMarkdownProps = StreamMarkdownContractProps &
  Omit<HeroStreamMarkdownProps, keyof StreamMarkdownContractProps>;
