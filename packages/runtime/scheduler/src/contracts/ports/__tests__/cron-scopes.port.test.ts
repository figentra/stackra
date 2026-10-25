/**
 * Stackra file contract:
 * Purpose: unit tests of the `CronScopes` port: a driver extends it, it is keyed `scheduler.CronScopes`, and it lists
 *          `ScopeRef`s.
 * Boundary: test only; a fixed driver stands in for the one @stackra/tenancy binds.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0323.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CronScopes } from "#contracts/ports/cron-scopes.port";

const scope: ScopeRef = { id: "scp_1", path: "platform.acme" };

class FixedCronScopesDriver extends Driver(CronScopes) {
  async list(): Promise<readonly ScopeRef[]> {
    return [scope];
  }
}

describe("CronScopes", () => {
  it("is a port a driver implements", async () => {
    const driver: CronScopes = new FixedCronScopesDriver();
    expect(driver).toBeInstanceOf(CronScopes);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.list()).resolves.toEqual([scope]);
  });

  it("is keyed scheduler.CronScopes", () => {
    expectTypeOf<CronScopes["~key"]>().toEqualTypeOf<"scheduler.CronScopes">();
  });
});
