/**
 * Stackra file contract:
 * Purpose: `codeRowsOf`, a code block's lines: highlighted (`codeTokensOf`), numbered, marked highlighted, and in diff
 *          mode split on their first character (`+` inserted, `-` deleted, anything else context), the marker taken off.
 * Boundary: pure; a trailing line break is dropped, Windows line breaks become `\n`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { codeTokensOf } from "#core/functions/code-tokens-of.function";
import { lineSetOf } from "#core/functions/line-set-of.function";
import type { CodeRow } from "#core/types/code-row.type";

/** The rows of a code block. */
export function codeRowsOf(
  code: string,
  options: {
    readonly language?: string | undefined;
    readonly isDiff?: boolean | undefined;
    readonly highlightLines?: readonly (number | string)[] | undefined;
  } = {},
): CodeRow[] {
  const raw = code.replaceAll(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  const changes = raw.map((line) =>
    !options.isDiff
      ? undefined
      : line.startsWith("+")
        ? "inserted"
        : line.startsWith("-")
          ? "deleted"
          : undefined,
  );
  const source = options.isDiff
    ? raw.map((line) => (/^[+\- ]/.test(line) ? line.slice(1) : line)).join("\n")
    : raw.join("\n");
  const highlighted = lineSetOf(options.highlightLines);
  return codeTokensOf(source, options.language).map((tokens, index) => ({
    tokens,
    number: index + 1,
    change: changes[index],
    isHighlighted: highlighted.has(index + 1),
  }));
}
