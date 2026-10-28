/**
 * Stackra file contract:
 * Purpose: `SearchNeighbours`, a driver's did-you-mean answer: per asked word, the indexed words closest in spelling.
 * Boundary: a type only. A word is never its own neighbour; a word with none has no entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); data-layer gap se13 (stackra-326).
 */

/** The neighbours of each word, best first. */
export type SearchNeighbours = Readonly<Record<string, readonly string[]>>;
