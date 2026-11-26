/**
 * Stackra file contract:
 * Purpose: `prose(text)`, TSDoc text as safe MDX: `{@link}` as code; braces, `<` and a line-start `import`/`export`
 *          escaped outside code.
 * Boundary: pure string work. Code spans and fenced blocks pass through untouched; only plain text is escaped.
 * Runtime: node
 * Governing contract: ADR 0514 (Fumadocs MDX pages); STA-2857.
 */
import { inlineCode } from "#scripts/api-reference/inline-code.function";

/** `{@link Name}`, `{@linkcode Name}`, `{@link Name | label}`. */
const LINK = /\{@link(?:code|plain)?\s+([^}|\s]+)(?:\s*\|\s*([^}]*))?\s*\}/g;

/** Escapes MDX syntax in plain text: braces, `<` (as `&lt;`), and a line that would start an ESM block. */
function escapePlain(text: string): string {
  return (
    text
      .replaceAll(/[{}]/g, (char) => `\\${char}`)
      // `&lt;`, not `\<`: gen's component scan (docs_component_unknown) reads `\<Port>` as a tag
      .replaceAll("<", "&lt;")
      .replaceAll(
        /^(\s*)(import|export)\b/gm,
        (_match, space: string, word: string) =>
          `${space}&#${word.codePointAt(0)};${word.slice(1)}`,
      )
  );
}

/** Splits markdown into code (fenced blocks and code spans) and plain segments, in order. */
function segments(text: string): { code: boolean; text: string }[] {
  const out: { code: boolean; text: string }[] = [];
  const pattern =
    /(^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\2[ \t]*$)|(`+)([\s\S]*?[^`])\3(?!`)/gm;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) out.push({ code: false, text: text.slice(last, start) });
    out.push({ code: true, text: match[0] });
    last = start + match[0].length;
  }
  if (last < text.length) out.push({ code: false, text: text.slice(last) });
  return out;
}

/**
 * TSDoc text as MDX that renders as written.
 *
 * @param text - summary, remarks or tag text from a TSDoc comment (markdown).
 * @returns the text with `{@link X}` as `` `X` `` (or its label) and MDX syntax escaped outside code.
 * @example
 * prose("Returns a {@link Money} for `{ a }` or <b>"); // "Returns a `Money` for `{ a }` or &lt;b>"
 */
export function prose(text: string): string {
  const linked = text.replace(LINK, (_match, target: string, label: string | undefined) =>
    label !== undefined && label.trim() !== "" ? label.trim() : inlineCode(target),
  );
  return segments(linked)
    .map((segment) => (segment.code ? segment.text : escapePlain(segment.text)))
    .join("");
}
