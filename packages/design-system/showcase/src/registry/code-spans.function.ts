/**
 * Stackra file contract:
 * Purpose: `codeSpans`: splits a prop description at its backticks into prose and code runs, so a screen (web or native) can set each
 *          code run in mono inside a left-to-right isolate and keep its punctuation from jumping in Arabic.
 * Boundary: a pure function; no React.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (RTL; code stays left to right).
 */
import type { CodeSpan } from "#src/types/code-span.type";

/**
 * The runs of `text`; an unpaired backtick stays prose.
 * @param text - the description
 * @returns its prose and code runs in order, empty runs left out
 */
export function codeSpans(text: string): readonly CodeSpan[] {
  return text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((run) =>
      run.length > 2 && run.startsWith("`") && run.endsWith("`")
        ? { text: run.slice(1, -1), isCode: true }
        : { text: run, isCode: false },
    );
}
