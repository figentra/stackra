/**
 * Stackra file contract:
 * Purpose: the native `Code`: a short piece of code inside a sentence, nested Text in the monospaced face on a soft
 *          fill with the inner control radius.
 * Boundary: inline only (CodeBlock is the block); nest it inside a Text. The MarkdownViewer draws its inline code
 *           with it.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { ReactElement } from "react";

import type { CodeProps } from "#native/code/code.props";
import { Text } from "#native/text/text";

/** Inline code. */
export function Code({ children, className }: CodeProps): ReactElement {
  return (
    <Text
      className={`rounded-[var(--radius-control-inner)] bg-default/60 font-mono ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}
