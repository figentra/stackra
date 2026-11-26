/**
 * Stackra file contract:
 * Purpose: `inlineCode(text)`, text as an inline code span its content cannot close.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0514 (Fumadocs MDX pages); STA-2857.
 */
import { longestRun } from "#scripts/api-reference/longest-run.function";

/**
 * Text as an inline code span whose delimiter the text cannot close.
 *
 * @param text - the code, on one line.
 * @returns the code between enough backticks, padded when it starts or ends with one.
 * @example
 * inlineCode("Money"); // "`Money`"
 */
export function inlineCode(text: string): string {
  const fence = "`".repeat(longestRun(text, "`") + 1);
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}
