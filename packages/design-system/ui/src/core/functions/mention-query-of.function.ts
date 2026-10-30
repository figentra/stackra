/**
 * Stackra file contract:
 * Purpose: `mentionQueryOf`, the name being typed after an `@` at the end of a draft (what the people list filters
 *          by), or null when the draft does not end in a mention.
 * Boundary: pure. An `@` counts only at the start or after a space, so an e-mail address is not a mention.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (comments); STA-1371.
 */

/** The open mention at the end of `draft`, without its `@`. */
export function mentionQueryOf(draft: string): string | null {
  const match = /(?:^|\s)@([^\s@]*)$/u.exec(draft);
  return match ? (match[1] ?? "") : null;
}
