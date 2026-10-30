/**
 * Stackra file contract:
 * Purpose: `codeTokensOf`, the small highlighter: `code` in `language` as lines of tokens, each with its syntax role,
 *          by trying the language's `CODE_GRAMMARS` rules at every position (the first match wins, an unmatched
 *          character is plain). Shared by the web and native CodeBlock, the markdown viewer's fences and the
 *          playground's code panels.
 * Boundary: pure; an unknown language is one plain token per line. A token never spans a line break.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one highlighter for web and native); STA-1371.
 */
import { CODE_GRAMMARS } from "#core/constants/code-grammars.constant";
import type { CodeToken } from "#core/types/code-token.type";

/** The highlighted lines of `code`. */
export function codeTokensOf(code: string, language?: string): CodeToken[][] {
  const rules = CODE_GRAMMARS[language?.toLowerCase() ?? ""];
  const lines: CodeToken[][] = [[]];
  const push = (text: string, role?: CodeToken["role"]) => {
    text.split("\n").forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part === "") return;
      const line = lines.at(-1) ?? [];
      const last = line.at(-1);
      if (last && last.role === role) line[line.length - 1] = { ...last, text: last.text + part };
      else line.push(role === undefined ? { text: part } : { text: part, role });
    });
  };
  if (!rules) {
    push(code);
    return lines;
  }
  let at = 0;
  scan: while (at < code.length) {
    for (const [pattern, kind] of rules) {
      pattern.lastIndex = at;
      const match = pattern.exec(code)?.[0];
      if (!match) continue;
      const role = typeof kind === "function" ? kind(match, code, at) : kind;
      if (role === null) continue;
      push(match, role === "plain" ? undefined : role);
      at += match.length;
      continue scan;
    }
    push(code[at] ?? "");
    at += 1;
  }
  return lines;
}
