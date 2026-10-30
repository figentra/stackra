/**
 * Stackra file contract:
 * Purpose: `tagList`, the hero tags of a catalogue line ("Accessible · Haptics") as a list.
 * Boundary: a pure function; the separator is the middle dot in every locale.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28).
 */

/** The trimmed, non-empty tags of `line`. */
export function tagList(line: string): string[] {
  return line
    .split("·")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
