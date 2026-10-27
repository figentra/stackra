/**
 * Stackra file contract:
 * Purpose: `lineDiff(before, after)`, the lines that differ between an authored file and the text `stackra new` would
 *          write: `-` for a line only the authored file has, `+` for a line only the template has, in file order
 *          (longest common subsequence of lines; a removed line prints before its replacement). Empty when the two are equal.
 * Boundary: pure; no hunks or context lines, it is printed for a person to read, never applied as a patch.
 * Runtime: node
 * Governing contract: ADR 0282 (consequences: `new` moves into the CLI); STA-1210 (`stackra new --over`).
 */

/**
 * The changed lines between two texts.
 *
 * @param before - the authored text.
 * @param after - the template text.
 * @example
 * lineDiff("a\nb\n", "a\nc\n"); // "-b\n+c\n"
 */
export function lineDiff(before: string, after: string): string {
  const a = before.split("\n");
  const b = after.split("\n");
  // shortcut: O(n*m) table, fine for template-sized files; use a Myers diff if this ever reads large files.
  const width = b.length + 1;
  const lcs = new Int32Array((a.length + 1) * width);
  const at = (i: number, j: number): number => lcs[i * width + j] ?? 0;
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i * width + j] =
        a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
  let out = "";
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (i < a.length && (j === b.length || at(i + 1, j) >= at(i, j + 1)))
      out += `-${a[i++]}\n`;
    else out += `+${b[j++]}\n`;
  }
  return out;
}
