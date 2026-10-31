/**
 * Stackra file contract:
 * Purpose: the web `Code`: a short piece of code inside a sentence, a `code` element in the monospaced face, a little
 *          smaller than the text around it, on a soft fill with the inner control radius.
 * Boundary: inline only (CodeBlock is the block). Always left to right, so a command keeps its order in an Arabic
 *           sentence. The MarkdownViewer draws its inline code with it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { CodeProps } from "#react/code/code.props";

/** Inline code. */
export function Code({ children, className }: CodeProps): ReactElement {
  return (
    <code
      dir="ltr"
      data-slot="code"
      className={cn(
        "rounded-[var(--radius-control-inner)] bg-default/60 px-1 font-mono text-[0.9em]",
        className,
      )}
    >
      {children}
    </code>
  );
}
