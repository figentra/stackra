/**
 * Stackra file contract:
 * Purpose: `fillPlaceholders`, template text with each `{{path}}` replaced by its value, as parts that keep wording and
 *          values apart (values are bidi-isolated by the renderers).
 * Boundary: internal to this package; not exported from the entry. A placeholder whose value is missing, `null` or has
 *           no text throws `DocumentValueError`: a document is never printed with a hole.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import { DocumentValueError } from "#core/errors/document-value.error";
import { formatValue } from "#core/functions/format-value.function";
import { readPath } from "#core/functions/read-path.function";
import type { TextPart } from "#core/types/text-part.type";

/** `{{ path }}`, spaces allowed inside the braces. */
const PLACEHOLDER = /\{\{\s*([\w$.-]+)\s*\}\}/gu;

/**
 * The parts of `text` with its placeholders filled from `data`.
 *
 * @throws DocumentValueError when a placeholder's value is missing or has no text.
 */
export function fillPlaceholders(text: string, data: unknown, locale: string): readonly TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const path = match[1] ?? "";
    if (match.index > last) parts.push({ text: text.slice(last, match.index), isValue: false });
    const value = readPath(data, path);
    if (value === undefined || value === null)
      throw DocumentValueError.create({ path, reason: "missing" });
    const formatted = formatValue(value, locale);
    if (formatted === undefined) throw DocumentValueError.create({ path, reason: "invalid" });
    parts.push({ text: formatted, isValue: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), isValue: false });
  return parts;
}
