/**
 * Stackra file contract:
 * Purpose: `parseRunway(kind, document, source?)`, the one check of a runway document against its format version 3
 *          schema: the root runway, or an app or service member runway. Returns the parsed document with defaults
 *          applied, typed for its kind.
 * Boundary: a parsed value in, a parsed value out; reading and YAML parsing are `readRunway`'s (`./node`). Topology
 *           placement needs the member list and is `checkPlacement`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1, 2 and 5, and enforcement), ADR 0227.
 */
import { RUNWAY_SCHEMAS } from "#core/constants/runway-schemas.constant";
import type { RunwayKind } from "#core/enums/runway-kind.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { RunwayDocument } from "#core/types/runway-document.type";

/**
 * The parsed runway of `kind`.
 *
 * @param kind - which runway the document is.
 * @param document - the parsed YAML (or JSON) value.
 * @param source - the file path or a description, for the error; defaults to `<kind> runway`.
 * @throws RunwayInvalidError naming every invalid path: an unknown or root-only key in a member runway, a dedicated
 *         resource without a reason, an engine ADR 0227 does not allow, a version other than 3, and so on.
 * @example
 * const commerce = parseRunway("service", parse(text), "services/commerce/runway.yaml");
 * commerce.requires?.cache?.engine; // "valkey"
 */
export function parseRunway<K extends RunwayKind>(
  kind: K,
  document: unknown,
  source = `${kind} runway`,
): RunwayDocument[K] {
  const result = RUNWAY_SCHEMAS[kind].safeParse(document);
  if (!result.success) throw new RunwayInvalidError(source, issuesOf(result.error));
  return result.data as RunwayDocument[K];
}
