/**
 * Stackra file contract:
 * Purpose: pins the exports of the `.` entry of @stackra/scope: the configuration and its schema, the header name, the
 *          resolver steps and chain, the memory tree, the refusals, the path functions and the active scope service;
 *          no port (they are `./contracts`'), no `ScopeOptions` and no `ScopeRef`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0327 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { ScopeConfig } from "#config/scope.config";
import * as core from "#core/index";
import { ChainScopeResolverDriver } from "#core/drivers/chain-scope-resolver.driver";
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";
import { ScopeUnresolvedError } from "#core/errors/scope-unresolved.error";
import { childLevelsOf } from "#core/functions/child-levels-of.function";
import { ActiveScopeService } from "#core/services/active-scope.service";

describe("@stackra/scope", () => {
  it("exports exactly the configuration, the drivers, the refusals, the functions and the service", () => {
    expect(Object.keys(core).sort()).toEqual([
      "ActiveScopeService",
      "ChainScopeResolverDriver",
      "ClaimScopeResolverDriver",
      "HeaderScopeResolverDriver",
      "MemoryScopeTreeDriver",
      "RootScopeResolverDriver",
      "SCOPE_PATH_HEADER",
      "ScopeConfig",
      "ScopeConfig$",
      "ScopeLabelInvalidError",
      "ScopeLevelInvalidError",
      "ScopeUnresolvedError",
      "childLevelsOf",
      "isScopePath",
      "isWithinScope",
      "scopeLevelLabel",
    ]);
  });

  it("re-exports the declaring files' symbols", () => {
    expect(core.ScopeConfig).toBe(ScopeConfig);
    expect(core.ChainScopeResolverDriver).toBe(ChainScopeResolverDriver);
    expect(core.MemoryScopeTreeDriver).toBe(MemoryScopeTreeDriver);
    expect(core.ScopeUnresolvedError).toBe(ScopeUnresolvedError);
    expect(core.childLevelsOf).toBe(childLevelsOf);
    expect(core.ActiveScopeService).toBe(ActiveScopeService);
  });
});
