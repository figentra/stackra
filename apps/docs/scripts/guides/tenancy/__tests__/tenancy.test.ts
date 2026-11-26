/**
 * Stackra file contract:
 * Purpose: the tests of the "Tenancy in an app" guide's examples on PGlite: the migration compiles to the tenant column,
 *          its index, ENABLE and FORCE row-level security and the equality policy; as a role without BYPASSRLS, each
 *          tenant opens tickets that carry its own id, lists only its own, cannot resolve another tenant's
 *          (`not_found`), a platform call sees no tenant row, and an insert outside any tenant call is refused by
 *          Postgres.
 * Boundary: test only; the database is the memory driver started from the compiled migration, `support.entities.ts`
 *           stands in for gen's output, and `asTenant` runs the same `CallIsolationDriver` the action pipeline runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0239; ADR 0347 (decision 5); ADR 0495 (decision 5: `asTenant`); STA-2843.
 */
import "./support.entities";

import { isRefusal, NotFoundError } from "@stackra/errors";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { asTenant, fakeTenantId } from "@stackra/tenancy/testing";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { connectGuideDatabase } from "#scripts/guides/support/connect-guide-database";
import type { GuideDatabase } from "#scripts/guides/support/guide-database";
import { asServiceRole } from "#scripts/guides/support/as-service-role";
import { createServiceRole } from "#scripts/guides/support/create-service-role";
import { CreateTicketsMigration } from "../0001-create-tickets.migration";
import { TicketService } from "../ticket.service";

let guide: GuideDatabase;

beforeAll(async () => {
  guide = await connectGuideDatabase([
    { schema: "support", migrations: [CreateTicketsMigration], macros: [BelongsToTenantMacro] },
  ]);
  await createServiceRole("support");
}, 120_000);

afterAll(async () => {
  await guide.close();
});

describe("Tenancy in an app guide", { timeout: 60_000 }, () => {
  it("compiles the tenant column, its index and the equality policy, forced on the owner too", () => {
    const [create = ""] = Object.values(guide.sql);
    expect(create).toContain('"tenant_id" varchar(33)');
    expect(create).toContain("idx_tickets_tenant_id");
    expect(create).toContain('alter table "support"."tickets" enable row level security');
    expect(create).toContain('alter table "support"."tickets" force row level security');
    expect(create).toContain("pol_tickets_tenant_id");
    expect(create).toContain("current_setting('app.tenant_id', true)");
  });

  it("keeps each tenant to its own tickets", async () => {
    // #region two-tenants
    const tickets = new TicketService();
    const acme = fakeTenantId();
    const globex = fakeTenantId();

    const invoice = await asTenant(acme, () => asServiceRole(() => tickets.open("Bad invoice")));
    const login = await asTenant(globex, () => asServiceRole(() => tickets.open("Cannot sign in")));
    expect(invoice.tenantId).toBe(acme);
    expect(login.tenantId).toBe(globex);

    const seenByAcme = await asTenant(acme, () => asServiceRole(() => tickets.waiting()));
    expect(seenByAcme.map((ticket) => ticket.subject)).toEqual(["Bad invoice"]);
    // #endregion two-tenants

    // #region cross-tenant-write
    const crossWrite = asTenant(acme, () => asServiceRole(() => tickets.resolve(login.id)));
    await expect(crossWrite).rejects.toSatisfy((error: unknown) => isRefusal(error, NotFoundError));
    // #endregion cross-tenant-write

    // #region platform-call
    const seenByPlatform = await asTenant(undefined, () => asServiceRole(() => tickets.waiting()));
    expect(seenByPlatform).toEqual([]);
    // #endregion platform-call
  });

  it("refuses a ticket written outside any tenant call", async () => {
    const tickets = new TicketService();
    // #region no-tenant
    const orphan = guide.database.transaction(() => asServiceRole(() => tickets.open("Lost")));
    await expect(orphan).rejects.toThrow();
    // #endregion no-tenant
  });
});
