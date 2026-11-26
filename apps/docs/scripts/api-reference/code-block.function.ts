/**
 * Stackra file contract:
 * Purpose: `codeBlock(code, lang)`, code as a fenced block its content cannot close.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0514 (Fumadocs MDX pages); STA-2857.
 */
import { longestRun } from "#scripts/api-reference/longest-run.function";

/**
 * Code as a fenced block whose fence the code cannot close.
 *
 * @param code - the code, any number of lines.
 * @param lang - the fence's language (`ts`).
 * @returns the fenced block, without a trailing newline.
 * @example
 * codeBlock("const a = 1;", "ts"); // "```ts\nconst a = 1;\n```"
 */
export function codeBlock(code: string, lang: string): string {
  const fence = "`".repeat(Math.max(3, longestRun(code, "`") + 1));
  return `${fence}${lang}\n${code}\n${fence}`;
}
