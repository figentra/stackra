/**
 * Stackra file contract:
 * Purpose: `metadataCache`: the Cache-Control of a packument or manifest of this scope.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { PRIVATE_NO_STORE } from "#src/constants/private-no-store.constant";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import type { ScopeRow } from "#src/interfaces/scope-row.interface";

/** The Cache-Control of a packument or manifest of this scope. */
export const metadataCache = (deps: RegistryDeps, scope: ScopeRow): string =>
  scope.read_rule === "open"
    ? `public, max-age=${deps.settings.openPackumentMaxAge}`
    : PRIVATE_NO_STORE;
