/**
 * Stackra file contract:
 * Purpose: unit tests of `IAM_TESTING_PLUGIN`: it connects the policies to the compiled app, loads "everyone is owner
 *          at the root" into a memory policy source (so every principal holds every non-system permission), leaves
 *          any other source alone, and adds no app member.
 * Boundary: test only; the apps are plain objects of the `TestingApp` shape the plugin reads (`has`, `get`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import type { AnyClass } from "@stackra/container";
import type { TestingApp } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import { PolicySource } from "#contracts/index";
import { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
import { SystemRole } from "#core/enums/system-role.enum";
import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import { actors } from "#testing/constants/actors.constant";
import { IAM_TESTING_PLUGIN } from "#testing/constants/iam-testing-plugin.constant";

/** An app that binds `bindings` only. */
function appWith(bindings: Map<AnyClass, object>): TestingApp {
  return {
    has: (token: AnyClass) => bindings.has(token),
    get: (token: AnyClass) => bindings.get(token),
  } as unknown as TestingApp;
}

describe("IAM_TESTING_PLUGIN", () => {
  it("connects the policies and opens the memory source to everyone as owner", async () => {
    const source = new MemoryPolicySourceDriver();
    const app = appWith(new Map([[PolicySource, source]]));

    expect(IAM_TESTING_PLUGIN.app?.(app)).toEqual({});
    expect(POLICY_REGISTRY.resolver).toBe(app);
    const snapshot = await source.snapshot(actors.customer());
    expect(snapshot.grants.map((grant) => grant.role)).toEqual([SystemRole.Owner]);
    expect(snapshot.roles).toEqual({ owner: ["*"] });
  });

  it("leaves an app without a memory source alone", () => {
    expect(IAM_TESTING_PLUGIN.app?.(appWith(new Map()))).toEqual({});
    expect(IAM_TESTING_PLUGIN.name).toBe("@stackra/iam");
  });
});
