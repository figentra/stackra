/**
 * Stackra file contract:
 * Purpose: unit tests of `partitionKey`: the principal always, the active scope's id only under
 *          `active_scope` and only when a scope is active, and `anonymous` for a signed-out partition.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0059; R-59.
 */
import { describe, expect, it } from "@stackra/testing";

import { QueryScope } from "#core/enums/query-scope.enum";
import { partitionKey } from "#core/functions/partition-key.function";

const SCOPED = { principal: "usr_1", scope: { id: "scp_wsp2", path: "platform.wsp2" } } as const;

describe("partitionKey", () => {
  it("keys by principal and active scope under active_scope", () => {
    expect(partitionKey(QueryScope.ActiveScope, SCOPED)).toBe("usr_1.scp_wsp2");
    expect(partitionKey(QueryScope.ActiveScope, { principal: "usr_1", scope: null })).toBe("usr_1");
  });

  it("keys by principal alone under principal", () => {
    expect(partitionKey(QueryScope.Principal, SCOPED)).toBe("usr_1");
  });

  it("keys a signed-out partition as anonymous, apart from every principal", () => {
    expect(partitionKey(QueryScope.ActiveScope, { principal: null, scope: null })).toBe(
      "anonymous",
    );
    expect(partitionKey(QueryScope.Principal, { principal: "usr_2", scope: null })).not.toBe(
      partitionKey(QueryScope.Principal, SCOPED),
    );
  });
});
