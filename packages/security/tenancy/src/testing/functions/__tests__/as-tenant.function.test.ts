/**
 * Stackra file contract:
 * Purpose: unit tests of `asTenant`: it runs the work through the isolation on `Database.current()` with the tenant's
 *          `app.tenant_id` (a platform call with `''`), the options' scope and read-only flag, new `BelongsToTenant` rows
 *          taking the tenant, and the work's result passing through; with no database it fails.
 * Boundary: test only; a fake `Database` records the statements, so no database runs. The real settings and the rows
 *           they hide are proven on Postgres in `call-isolation.driver.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495 (decision 5).
 */
import type { ScopeRef } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";
import { asTenant } from "#testing/functions/as-tenant.function";
import { fakeTenantId } from "#testing/functions/fake-tenant-id.function";

/** A tenant-owned model. */
class Ticket extends Model.with(HasPublicId("tkt"), BelongsToTenant) {}

/** A fake current database that records its statements, scopes and transactions. */
function connect(running = false) {
  const statements: unknown[][] = [];
  const scopes: unknown[] = [];
  const transactions: unknown[] = [];
  const database = {
    em: () => ({
      isInTransaction: () => running,
      execute: async (...args: unknown[]) => void statements.push(args),
    }),
    transaction: async (work: () => Promise<unknown>, options?: unknown) => {
      transactions.push(options);
      return work();
    },
    withScope: async (scope: unknown, work: () => Promise<unknown>) => {
      scopes.push(scope);
      return work();
    },
  } as unknown as Database;
  const current = vi.spyOn(Database, "current").mockReturnValue(database);
  return { statements, scopes, transactions, restore: () => current.mockRestore() };
}

describe(asTenant, () => {
  it("sets the tenant for the work, and new rows take it", async () => {
    const { statements, scopes, restore } = connect();
    try {
      const tenantId = fakeTenantId();
      const ticket = await asTenant(tenantId, async () => new Ticket());
      expect(statements).toContainEqual([
        "select set_config(?, ?, true)",
        ["app.tenant_id", tenantId],
      ]);
      expect(scopes).toEqual([[]]);
      expect(ticket.tenantId).toBe(tenantId);
    } finally {
      restore();
    }
  });

  it("runs a platform call with no tenant", async () => {
    const { statements, restore } = connect();
    try {
      const ticket = await asTenant(undefined, async () => new Ticket());
      expect(statements).toContainEqual(["select set_config(?, ?, true)", ["app.tenant_id", ""]]);
      expect(ticket.tenantId).toBeUndefined();
    } finally {
      restore();
    }
  });

  it("takes the scope and the read-only flag from its options", async () => {
    const { scopes, transactions, restore } = connect();
    try {
      const scope: ScopeRef = { id: fakeTenantId(), path: "platform.acme" };
      await expect(
        asTenant(scope.id as never, async () => 42, { scope, readOnly: true }),
      ).resolves.toBe(42);
      expect(scopes).toEqual([scope]);
      expect(transactions[0]).toEqual({ readOnly: true });
    } finally {
      restore();
    }
  });

  it("fails with no database connected", () => {
    const current = vi.spyOn(Database, "current").mockImplementation(() => {
      throw new Error("No database is connected");
    });
    try {
      expect(() => asTenant(fakeTenantId(), async () => 1)).toThrow("No database is connected");
    } finally {
      current.mockRestore();
    }
  });
});
