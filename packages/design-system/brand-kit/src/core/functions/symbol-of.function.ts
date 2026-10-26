/**
 * Stackra file contract:
 * Purpose: `symbolOf(svg, source)`, reads the kit's symbol SVG: its square `viewBox` and its inner markup, ready to nest
 *          in every icon, splash and favicon canvas.
 * Boundary: pure. The symbol is drawn with `currentColor`, so the canvas colours it from the theme. Refused: no
 *           `viewBox`, a non-square one, live `<text>` (outline it), and active content (`<script>`, `<foreignObject>`,
 *           `on*` handlers), because `favicon.svg` is served from the product's own origin.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5); ADR 0340 decision 10 (no live text in a logo file).
 */
import { InvalidKitError } from "#core/errors/invalid-kit.error";

/** Active content an SVG served from a web origin must not carry. */
const ACTIVE = /<script[\s>]|<foreignObject[\s>]|\son[a-z]+\s*=/iu;

/**
 * The symbol's square `viewBox` numbers and its inner markup.
 *
 * @param svg - the symbol file's text.
 * @param source - the file, for the error.
 * @throws InvalidKitError when the symbol breaks a rule above.
 * @example
 * symbolOf('<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0h24v24z"/></svg>', "marks/symbol.svg");
 * // { viewBox: [0, 0, 24, 24], body: '<path fill="currentColor" d="M0 0h24v24z"/>' }
 */
export function symbolOf(
  svg: string,
  source: string,
): { readonly viewBox: readonly [number, number, number, number]; readonly body: string } {
  const open = /<svg\b[^>]*>/iu.exec(svg);
  const viewBox =
    open === null ? undefined : /\bviewBox\s*=\s*["']([^"']+)["']/iu.exec(open[0])?.[1];
  const numbers = (viewBox ?? "")
    .trim()
    .split(/[\s,]+/u)
    .map(Number);
  const problems: string[] = [];
  if (open === null || numbers.length !== 4 || numbers.some((n) => !Number.isFinite(n)))
    problems.push("no usable viewBox on the <svg> element");
  else if (numbers[2] !== numbers[3] || (numbers[2] ?? 0) <= 0)
    problems.push("the viewBox is not square");
  if (/<text[\s>]/iu.test(svg)) problems.push("live <text> in the symbol (outline it)");
  if (ACTIVE.test(svg)) problems.push("active content (script, foreignObject or an on* handler)");
  if (problems.length > 0 || open === null) throw new InvalidKitError(source, problems);
  const start = open.index + open[0].length;
  const end = svg.lastIndexOf("</svg>");
  const [x = 0, y = 0, width = 0, height = 0] = numbers;
  return {
    viewBox: [x, y, width, height],
    body: svg.slice(start, end < start ? undefined : end).trim(),
  };
}
