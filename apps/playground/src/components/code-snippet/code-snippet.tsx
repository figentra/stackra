/**
 * Stackra file contract:
 * Purpose: `CodeSnippet`, the playground's code panel for the import line, anatomy and demo source of a component
 *          page: @stackra/ui's `CodeBlock` with the TSX highlighter, a header (title and copy button) and the
 *          component's collapse after 30 lines, so a long source shows in full behind "Show all" instead of a
 *          scrolled box.
 * Boundary: presentation only; the highlighter and the colours are @stackra/ui's and the theme's (`--syntax-<role>`).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0461 (replaces the Pro CodeBlock in core);
 *          STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

import type { CodeSnippetProps } from "#src/components/code-snippet/code-snippet.props";

/** A highlighted TSX panel. */
export function CodeSnippet({ code, title, copyLabel }: CodeSnippetProps) {
  return (
    <CodeBlock
      code={code}
      language="tsx"
      title={title}
      isCopyable={copyLabel !== undefined}
      copyLabel={copyLabel}
      className="code-snippet"
    />
  );
}
