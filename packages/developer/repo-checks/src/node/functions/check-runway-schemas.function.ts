/**
 * Stackra file contract:
 * Purpose: `checkRunwaySchemas(read)`, that each `packages/developer/runway/schema/<kind>.json` is a byte copy of the
 *          canonical `tools/schemas/runway-<kind>.schema.json`.
 * Boundary: pure apart from `read`, which returns a repository file's text or undefined when absent.
 * Runtime: node
 * Governing contract: ADR 0296.
 */
import { RUNWAY_SCHEMA_KINDS } from "#node/constants/runway-schema-kinds.constant";

/**
 * The drift findings of the shipped runway schemas.
 *
 * @param read - returns a repository file's text, or undefined when it is absent.
 * @example
 * checkRunwaySchemas((path) => files.get(path)); // [] when every copy matches
 */
export function checkRunwaySchemas(read: (path: string) => string | undefined): string[] {
  const out: string[] = [];
  for (const kind of RUNWAY_SCHEMA_KINDS) {
    const canonical = `tools/schemas/runway-${kind}.schema.json`;
    const copy = `packages/developer/runway/schema/${kind}.json`;
    if (read(copy) !== read(canonical))
      out.push(`${copy} differs from ${canonical}: run \`cp ${canonical} ${copy}\``);
  }
  return out;
}
