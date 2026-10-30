/**
 * Stackra file contract:
 * Purpose: `nextPadValue(current, key, options)`, the value a NumberPad holds after one key: a digit appends, `.`
 *          appends one separator (after a 0 when nothing is typed), `delete` drops the last character; `undefined` when
 *          the key changes nothing (a second separator, the length limit, delete on an empty value).
 * Boundary: pure; shared by the web and native NumberPad.
 * Runtime: isomorphic
 * Governing contract: wave 3c mobile interactions (owner approval 2026-10-28); ADR 0302 (decision 3).
 */

/** The value after `key` (a digit, `.` or `delete`), or `undefined` when the key is refused. */
export function nextPadValue(
  current: string,
  key: string,
  options: { readonly maxLength?: number | undefined; readonly hasDecimal?: boolean | undefined },
): string | undefined {
  if (key === "delete") return current === "" ? undefined : current.slice(0, -1);
  if (key === ".") {
    if (!options.hasDecimal || current.includes(".")) return undefined;
  } else if (!/^\d$/.test(key)) return undefined;
  const next = key === "." && current === "" ? "0." : current + key;
  return options.maxLength !== undefined && next.length > options.maxLength ? undefined : next;
}
