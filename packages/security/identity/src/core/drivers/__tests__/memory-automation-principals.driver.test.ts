/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAutomationPrincipalsDriver`: it is the `AutomationPrincipals` port; minting is
 *          idempotent per automation and tenant and gives a `service` actor in the tenant; revoking ends it, and the
 *          next mint gives a new principal; an unknown id is ignored.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0153 (decision 2); STA-1264.
 */
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AutomationPrincipals } from "#contracts/index";
import { MemoryAutomationPrincipalsDriver } from "#core/drivers/memory-automation-principals.driver";

const WELCOME = { automationId: "aut_1", scopeId: "ten_1", name: "Welcome" } as const;

describe(MemoryAutomationPrincipalsDriver, () => {
  it("is the AutomationPrincipals port", () => {
    expect(new MemoryAutomationPrincipalsDriver()).toBeInstanceOf(AutomationPrincipals);
  });

  it("mints one service principal per automation and tenant", async () => {
    const principals = new MemoryAutomationPrincipalsDriver();
    const first = await principals.mint(WELCOME);
    expect(first).toMatchObject({ kind: ActorKind.Service, scopeId: "ten_1" });
    expect(first.id).toMatch(/^prn_/);
    expect(await principals.mint(WELCOME)).toBe(first);
    const other = await principals.mint({ ...WELCOME, scopeId: "ten_2" });
    expect(other.id).not.toBe(first.id);
    expect(
      (await principals.mint({ automationId: "aut_1", name: "Platform" })).scopeId,
    ).toBeUndefined();
  });

  it("revokes a principal so the next mint gives a new one", async () => {
    const principals = new MemoryAutomationPrincipalsDriver();
    const first = await principals.mint(WELCOME);
    await principals.revoke(first.id);
    await principals.revoke("prn_unknown");
    expect(principals.revoked).toEqual(new Set([first.id]));
    expect((await principals.mint(WELCOME)).id).not.toBe(first.id);
  });
});
