/**
 * Stackra file contract:
 * Purpose: `parseRunwayFacts(document, source)`, the check of a resolved runway facts document (the dev ports file or
 *          the injected bundle facts), with defaults applied.
 * Boundary: internal; the readers and `definesFor` call it.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5).
 */
import { RUNWAY_FACTS_SCHEMA } from "#core/constants/runway-facts-schema.constant";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { RunwayFacts } from "#core/types/runway-facts.type";

/**
 * The parsed facts.
 *
 * @throws RunwayInvalidError naming every invalid path.
 * @example
 * parseRunwayFacts({ version: 1, members: { console: { url: "http://localhost:5173", port: 5173, host: "localhost" } } }, "ports.json");
 */
export function parseRunwayFacts(document: unknown, source: string): RunwayFacts {
  const result = RUNWAY_FACTS_SCHEMA.safeParse(document);
  if (!result.success) throw new RunwayInvalidError(source, issuesOf(result.error));
  return result.data;
}
