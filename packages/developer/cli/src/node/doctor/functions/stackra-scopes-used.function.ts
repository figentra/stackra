/**
 * Stackra file contract:
 * Purpose: `stackraScopesUsed(manifests)`, the Stackra scopes (`ITEM_SCOPES`: `@stackra`, `@stackra-pro`) these
 *          package.json files read from a registry, in that order: the scopes whose `.npmrc` mapping the doctor checks.
 * Boundary: pure; a `workspace:` member is not read from a registry, so it does not count.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 10); STA-1952 spec FR-017.
 */
import { ITEM_SCOPES } from "#node/constants/item-scopes.constant";
import { publishedDependency } from "#node/doctor/functions/published-dependency.function";

/**
 * The Stackra scopes a workspace installs from a registry.
 *
 * @param manifests - parsed package.json files.
 * @example
 * stackraScopesUsed([{ dependencies: { "@stackra/app": "catalog:stackra" } }]); // ["@stackra"]
 */
export function stackraScopesUsed(manifests: readonly unknown[]): (typeof ITEM_SCOPES)[number][] {
  return ITEM_SCOPES.filter((scope) => publishedDependency(manifests, scope) !== undefined);
}
