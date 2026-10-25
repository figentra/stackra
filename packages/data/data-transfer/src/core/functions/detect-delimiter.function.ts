/**
 * Stackra file contract:
 * Purpose: `detectDelimiter`, the CSV delimiter of a file from its first line: the candidate that appears most often
 *          outside quotes.
 * Boundary: pure; internal to the CSV reader. A tie, or a line with no candidate, goes to the first candidate.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2).
 */
import { DELIMITER_CANDIDATES } from "#core/constants/delimiter-candidates.constant";

/**
 * The delimiter `line` uses.
 *
 * @example
 * detectDelimiter("name;price"); // ";"
 */
export function detectDelimiter(line: string): string {
  const counts = new Map<string, number>();
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (!quoted && DELIMITER_CANDIDATES.includes(character))
      counts.set(character, (counts.get(character) ?? 0) + 1);
  }
  let best = DELIMITER_CANDIDATES[0] ?? ",";
  for (const candidate of DELIMITER_CANDIDATES)
    if ((counts.get(candidate) ?? 0) > (counts.get(best) ?? 0)) best = candidate;
  return best;
}
