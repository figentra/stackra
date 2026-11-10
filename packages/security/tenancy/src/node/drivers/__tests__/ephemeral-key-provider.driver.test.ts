/**
 * Stackra file contract:
 * Purpose: unit tests of `EphemeralKeyProviderDriver`: each tenant gets its own random 256-bit `k1` on its first seal,
 *          a rotation makes `k2` current while `k1` still opens, an unknown id is refused, and a platform call is
 *          refused.
 * Boundary: test only; the tenant is the `ACTIVE_TENANT` storage `withTenant` sets.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0188 (2026-11-09 amendment).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { EphemeralKeyProviderDriver } from "#node/drivers/ephemeral-key-provider.driver";

const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId<"scp">;
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1" as PublicId<"scp">;

describe(EphemeralKeyProviderDriver, () => {
  it("keeps each tenant's keys apart, rotates, and refuses an unknown id and a platform call", async () => {
    const keys = new EphemeralKeyProviderDriver();
    const a1 = await ACTIVE_TENANT.run(TENANT_A, () => keys.current());
    const b1 = await ACTIVE_TENANT.run(TENANT_B, () => keys.current());
    expect([a1.id, b1.id]).toEqual(["k1", "k1"]);
    expect(a1.key).toHaveLength(32);
    expect(b1.key).not.toEqual(a1.key);
    const a2 = await ACTIVE_TENANT.run(TENANT_A, () => keys.rotate());
    expect(a2.id).toBe("k2");
    expect(await ACTIVE_TENANT.run(TENANT_A, () => keys.current())).toEqual(a2);
    expect(await ACTIVE_TENANT.run(TENANT_A, () => keys.byId("k1"))).toEqual(a1);
    await expect(ACTIVE_TENANT.run(TENANT_B, () => keys.byId("k2"))).rejects.toThrow(
      /No data key has the id k2/,
    );
    await expect(keys.current()).rejects.toThrow(/needs a tenant call/);
  });
});
