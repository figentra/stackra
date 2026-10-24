/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/scope (the configuration with its shipped schema, the header
 *          name, the path functions, the resolver steps and chain, the memory tree, the client's active scope and the
 *          refusals) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `ScopeConfig` lives in the `src/config/` entry folder;
 *           `ScopeOptions` stays internal. Isomorphic: nothing here touches a database, a DOM or a Node API.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0327 (decision 10); the STA-347 stand-in barrel decision.
 */
export { ScopeConfig } from "#config/scope.config";
export { ScopeConfig$ } from "#core/constants/scope-config-schema.constant";
export { SCOPE_PATH_HEADER } from "#core/constants/scope-path-header.constant";
export { ChainScopeResolverDriver } from "#core/drivers/chain-scope-resolver.driver";
export { ClaimScopeResolverDriver } from "#core/drivers/claim-scope-resolver.driver";
export { HeaderScopeResolverDriver } from "#core/drivers/header-scope-resolver.driver";
export { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";
export { RootScopeResolverDriver } from "#core/drivers/root-scope-resolver.driver";
export { ScopeLabelInvalidError } from "#core/errors/scope-label-invalid.error";
export { ScopeLevelInvalidError } from "#core/errors/scope-level-invalid.error";
export { ScopeUnresolvedError } from "#core/errors/scope-unresolved.error";
export { childLevelsOf } from "#core/functions/child-levels-of.function";
export { isScopePath } from "#core/functions/is-scope-path.function";
export { isWithinScope } from "#core/functions/is-within-scope.function";
export { scopeLevelLabel } from "#core/functions/scope-level-label.function";
export { ActiveScopeService } from "#core/services/active-scope.service";
