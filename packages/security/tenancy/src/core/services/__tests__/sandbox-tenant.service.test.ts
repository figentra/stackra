/**
 * Stackra file contract:
 * Purpose: unit tests of `SandboxTenantService` over `MemorySandboxTenantsDriver`: a sandbox is registered from a live
 *          tenant (never from itself, another sandbox or twice, never already lapsed); in-use lists skip retired and
 *          lapsed sandboxes; the environment and the live tenant are answered; retiring is idempotent and refuses a
 *          sandbox of another tenant.
 * Boundary: test only; a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0280 (decisions 1 to 3 and 5); ADR 0210 (decision 8).
 */
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { MemorySandboxTenantsDriver } from "#core/drivers/memory-sandbox-tenants.driver";
import { TenantEnvironment } from "#core/enums/tenant-environment.enum";
import { SandboxNotFoundError } from "#core/errors/sandbox-not-found.error";
import { SandboxTenantService } from "#core/services/sandbox-tenant.service";

/** A clock the test moves. */
class MovableClockDriver extends Driver(Clock) {
  at = new Date("2026-10-25T09:00:00Z");

  now(): Date {
    return new Date(this.at);
  }
}

const ACME = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1";
const GLOBEX = "scp_01j9z3k4m5n6p7q8r9s0t1v2w2";
const [SANDBOX_1, SANDBOX_2] = [
  "scp_01j9z3k4m5n6p7q8r9s0t1v2s1",
  "scp_01j9z3k4m5n6p7q8r9s0t1v2s2",
] as const;

describe("SandboxTenantService", () => {
  let clock: MovableClockDriver;
  let sandboxes: SandboxTenantService;

  beforeEach(() => {
    clock = new MovableClockDriver();
    sandboxes = new SandboxTenantService(new MemorySandboxTenantsDriver(), clock);
  });

  it("registers a sandbox of a live tenant and tells the environments apart", async () => {
    const sandbox = await sandboxes.register({ id: SANDBOX_1, live: ACME, name: "Redesign" });
    expect(sandbox.createdAt).toEqual(clock.at);
    expect(await sandboxes.environmentOf(SANDBOX_1)).toBe(TenantEnvironment.Sandbox);
    expect(await sandboxes.environmentOf(ACME)).toBe(TenantEnvironment.Live);
    expect(await sandboxes.liveOf(SANDBOX_1)).toBe(ACME);
    await expect(sandboxes.liveOf(ACME)).rejects.toBeInstanceOf(SandboxNotFoundError);
  });

  it("refuses a sandbox of itself, of a sandbox, twice, or already lapsed", async () => {
    await sandboxes.register({ id: SANDBOX_1, live: ACME, name: "One" });
    await expect(sandboxes.register({ id: ACME, live: ACME, name: "x" })).rejects.toThrow(
      RangeError,
    );
    await expect(sandboxes.register({ id: SANDBOX_2, live: SANDBOX_1, name: "x" })).rejects.toThrow(
      RangeError,
    );
    await expect(sandboxes.register({ id: SANDBOX_1, live: ACME, name: "x" })).rejects.toThrow(
      RangeError,
    );
    await expect(
      sandboxes.register({ id: SANDBOX_2, live: ACME, name: "x", expiresAt: clock.at }),
    ).rejects.toThrow(RangeError);
  });

  it("lists the sandboxes in use and retires one", async () => {
    await sandboxes.register({
      id: SANDBOX_1,
      live: ACME,
      name: "Short",
      expiresAt: new Date("2026-10-26T09:00:00Z"),
    });
    await sandboxes.register({ id: SANDBOX_2, live: ACME, name: "Long" });
    expect((await sandboxes.inUse(ACME)).map((s) => s.id)).toEqual([SANDBOX_1, SANDBOX_2]);
    clock.at = new Date("2026-10-27T09:00:00Z");
    expect((await sandboxes.inUse(ACME)).map((s) => s.id)).toEqual([SANDBOX_2]);
    const retired = await sandboxes.retire(ACME, SANDBOX_2);
    expect(retired.retiredAt).toEqual(clock.at);
    expect(await sandboxes.retire(ACME, SANDBOX_2)).toEqual(retired);
    expect(await sandboxes.inUse(ACME)).toEqual([]);
    await expect(sandboxes.retire(GLOBEX, SANDBOX_1)).rejects.toBeInstanceOf(SandboxNotFoundError);
  });
});
