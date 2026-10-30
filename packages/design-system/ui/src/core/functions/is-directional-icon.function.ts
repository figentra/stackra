/**
 * Stackra file contract:
 * Purpose: `isDirectionalIcon`: whether a Lucide icon points the reading way (arrows, chevrons, carets, panel sides,
 *          the external-link arrow, log in and out, reply, undo and redo), so web and native `Icon` mirror it in
 *          right-to-left text by default and no caller has to remember `isMirroredInRtl`.
 * Boundary: pure; reads the name only. A caller still overrides it with `isMirroredInRtl={false}` (a play button, a
 *           brand mark) or `true` (a custom icon this list cannot know).
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (right-to-left: icons that point the reading way mirror).
 */

/** A name with a horizontal side in it: `arrow-left`, `chevrons-right`, `arrow-up-right`, `panel-left-open`. */
const SIDED = /(^|-)(left|right)(-|$)/;

/** Directional names with no side in them. */
const DIRECTIONAL = new Set([
  "external-link",
  "square-arrow-out-up-right",
  "log-in",
  "log-out",
  "reply",
  "reply-all",
  "forward",
  "undo",
  "undo-2",
  "redo",
  "redo-2",
  "list-indent-increase",
  "list-indent-decrease",
  "indent-increase",
  "indent-decrease",
  "send",
  "send-horizontal",
]);

/** Sided names that are not directions: alignment and layout glyphs keep their own sides. */
const NOT_DIRECTIONAL =
  /^(align|text-align|between|align-horizontal|align-vertical|flip|rotate|scan|ear|hand|footprints)/;

/**
 * Whether `name` should be drawn mirrored in right-to-left text.
 * @param name - the icon's name, a Lucide name or a namespaced custom one
 * @returns true for an icon that points the reading way
 */
export function isDirectionalIcon(name: string): boolean {
  if (name.includes(":")) return false;
  return DIRECTIONAL.has(name) || (SIDED.test(name) && !NOT_DIRECTIONAL.test(name));
}
