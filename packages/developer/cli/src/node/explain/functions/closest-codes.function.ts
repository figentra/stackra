/**
 * Stackra file contract:
 * Purpose: `closestCodes(typed, codes)`, up to five codes to suggest for one `stackra explain` does not know: codes
 *          that contain what was typed (`number` finds `shape_number_kind`) first, then codes within three edits of it,
 *          nearest first. Case and `-` / `_` are ignored, so `shape-number-kind` finds `shape_number_kind`, and so is
 *          a check finding's tool prefix: `repo-checks/import` is read as `import` and finds `imports`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: STA-2891.
 */

/** The most codes suggested at once. */
const LIMIT = 5;

/** The most edits a suggested code may be away from what was typed. */
const MAX_EDITS = 3;

/** `text` lower-cased with `-` read as `_`. */
const fold = (text: string) => text.trim().toLowerCase().replaceAll("-", "_");

/** What was typed without a `<tool>/` prefix: no code contains `/`, `stackra check` prints `<tool>/<rule>`. */
const rule = (typed: string) => typed.slice(typed.lastIndexOf("/") + 1);

/** The Levenshtein distance between `a` and `b`. */
function edits(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++)
      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/**
 * The codes to suggest for `typed`.
 *
 * @param typed - what was typed.
 * @param codes - every known code.
 * @returns up to five codes, those containing `typed` first, then the nearest.
 * @example
 * closestCodes("shape_numbr_kind", ["shape_number_kind", "kind_path"]); // ["shape_number_kind"]
 */
export function closestCodes(typed: string, codes: readonly string[]): string[] {
  const wanted = fold(rule(typed));
  if (wanted === "") return [];
  const containing = codes.filter((code) => fold(code).includes(wanted));
  const near = codes
    .filter((code) => !containing.includes(code))
    .map((code) => ({ code, cost: edits(wanted, fold(code)) }))
    .filter(({ cost }) => cost <= MAX_EDITS)
    .toSorted((a, b) => a.cost - b.cost || a.code.localeCompare(b.code))
    .map(({ code }) => code);
  return [
    ...containing.toSorted((a, b) => a.length - b.length || a.localeCompare(b)),
    ...near,
  ].slice(0, LIMIT);
}
