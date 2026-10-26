/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./node` entry of @stackra/scope: the model, its service, the Postgres tree driver
 *          and the depth entitlement; the migration is found by path and not re-exported.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0327 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { ScopeDepthEntitlement } from "#node/access/scope-depth.entitlement";
import { PostgresScopeTreeDriver } from "#node/drivers/postgres-scope-tree.driver";
import { ScopeMoved } from "#node/events/scope-moved.event";
import * as node from "#node/index";
import { ScopeNode } from "#node/models/scope-node.model";
import { ScopeNodeService } from "#node/services/scope-node.service";

describe("@stackra/scope/node", () => {
  it("exports exactly the model, the service, the driver, the event and the entitlement", () => {
    expect(Object.keys(node).sort()).toEqual([
      "PostgresScopeTreeDriver",
      "ScopeDepthEntitlement",
      "ScopeMoved",
      "ScopeNode",
      "ScopeNodeService",
    ]);
    expect(node.PostgresScopeTreeDriver).toBe(PostgresScopeTreeDriver);
    expect(node.ScopeDepthEntitlement).toBe(ScopeDepthEntitlement);
    expect(node.ScopeMoved).toBe(ScopeMoved);
    expect(node.ScopeNode).toBe(ScopeNode);
    expect(node.ScopeNodeService).toBe(ScopeNodeService);
  });
});
