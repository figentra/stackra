/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresApprovalBindingStoreDriver` on real Postgres, through `CallIsolationDriver` and
 *          as a role that is neither the owner nor `BYPASSRLS`: it passes the `ApprovalBindingStore` conformance suite,
 *          another tenant's binding is invisible to a read and untouched by the prune, an insert for another tenant
 *          fails the policy, a second insert of an id rejects, and no session can UPDATE a binding.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so each call starts with `set local role stackra_probe`, as the isolation tests
 *           do; the role is created once with only the table rights an app session has (no UPDATE). Each call of the
 *           store runs in a `CallIsolation` run of the tenant under test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0509 (the binding, B1, N7; SC-004); ADR 0495 (decisions 1 and 3); ADR 0239; ADR 0182 (integration
 *                     tier); ADR 0022; ADR 0269.
 */
import { ApprovalBindingStore } from "@stackra/actions/contracts";
import type { ApprovalBinding } from "@stackra/actions/contracts";
import { describeApprovalBindingStoreConformance } from "@stackra/actions/testing";
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { CreateApprovalBindingsMigration } from "#node/database/migrations/0001-create-approval-bindings.migration";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import { PostgresApprovalBindingStoreDriver } from "#node/drivers/postgres-approval-binding-store.driver";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { tenantActor } from "#testing/functions/tenant-actor.function";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateApprovalBindingsMigration, {
      schema: "tenancy",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

/** The role every call runs as: no login, no `BYPASSRLS`, not the table's owner, no UPDATE. */
const ROLE = "stackra_probe";

/** The tenant the conformance suite's bindings belong to. */
const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1";
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1";

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema "tenancy" to ${ROLE}`);
  await em.execute(`grant select, insert, delete on all tables in schema "tenancy" to ${ROLE}`);
});

/** The real driver, run as the probe role. */
class ProbedStore extends PostgresApprovalBindingStoreDriver {
  override async insert(binding: ApprovalBinding): Promise<void> {
    await postgres.database.em().execute(`set local role ${ROLE}`);
    return super.insert(binding);
  }

  override async find(approvalId: string): Promise<ApprovalBinding | undefined> {
    await postgres.database.em().execute(`set local role ${ROLE}`);
    return super.find(approvalId);
  }

  override async prune(cutoff: Date): Promise<number> {
    await postgres.database.em().execute(`set local role ${ROLE}`);
    return super.prune(cutoff);
  }
}

/** The isolation of the test database. */
const isolation = () =>
  new CallIsolationDriver(
    postgres.database,
    new TenantIsolationService(postgres.database),
    new MemoryScopeTreeDriver(),
  );

/** `store`, with every call in `tenant`'s isolation run. */
class IsolatedStore extends Driver(ApprovalBindingStore) {
  private readonly tenant: PublicId<"scp">;

  private readonly store: ApprovalBindingStore;

  constructor(tenant: PublicId<"scp">, store: ApprovalBindingStore) {
    super();
    this.tenant = tenant;
    this.store = store;
  }

  insert(binding: ApprovalBinding): Promise<void> {
    return this.within(() => this.store.insert(binding));
  }

  find(approvalId: string): Promise<ApprovalBinding | undefined> {
    return this.within(() => this.store.find(approvalId));
  }

  prune(cutoff: Date): Promise<number> {
    return this.within(() => this.store.prune(cutoff));
  }

  private within<T>(work: () => Promise<T>): Promise<T> {
    return isolation().run(tenantActor(this.tenant), undefined, work, { readOnly: false });
  }
}

/** The store as `tenant`'s session. */
const as = (tenant: PublicId<"scp">) =>
  new IsolatedStore(tenant, new ProbedStore(postgres.database));

/** A binding of `tenant`, requested at 09:00 and expiring at `expiresAt`. */
const binding = (tenant: PublicId<"scp">, id: string, expiresAt: Date): ApprovalBinding => ({
  approvalId: id as ApprovalBinding["approvalId"],
  scopeId: tenant as ApprovalBinding["scopeId"],
  requester: tenantActor(tenant),
  key: "billing.coupon.update@1",
  inputHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  requestedAt: new Date("2026-11-01T09:00:00.000Z"),
  expiresAt,
  approvals: 1,
  permission: "billing.coupon.approve",
  confirm: false,
  execute: "on_grant",
});

describeApprovalBindingStoreConformance("PostgresApprovalBindingStoreDriver", () => as(TENANT_A));

describe(PostgresApprovalBindingStoreDriver, () => {
  it("shows another tenant's binding to nobody but its tenant, and prunes only the running tenant's", async () => {
    const id = "apr_01j9z3k4m5n6p7q8r9s0t1v2b1";
    const old = new Date("2026-01-01T00:00:00.000Z");
    await as(TENANT_B).insert(binding(TENANT_B, id, old));
    expect(await as(TENANT_A).find(id)).toBeUndefined();
    expect(await as(TENANT_B).find(id)).toMatchObject({ approvalId: id, scopeId: TENANT_B });
    await as(TENANT_A).prune(new Date("2026-06-01T00:00:00.000Z"));
    expect(await as(TENANT_B).find(id)).toBeDefined();
    await as(TENANT_B).prune(new Date("2026-06-01T00:00:00.000Z"));
    expect(await as(TENANT_B).find(id)).toBeUndefined();
  });

  it("refuses an insert for another tenant, and a second insert of an id", async () => {
    const id = "apr_01j9z3k4m5n6p7q8r9s0t1v2b2";
    const future = new Date("2027-01-01T00:00:00.000Z");
    await expect(as(TENANT_A).insert(binding(TENANT_B, id, future))).rejects.toThrow(
      /row-level security/i,
    );
    await as(TENANT_A).insert(binding(TENANT_A, id, future));
    await expect(as(TENANT_A).insert(binding(TENANT_A, id, future))).rejects.toThrow();
  });

  it("lets no session update a binding", async () => {
    const id = "apr_01j9z3k4m5n6p7q8r9s0t1v2b3";
    await as(TENANT_A).insert(binding(TENANT_A, id, new Date("2027-01-01T00:00:00.000Z")));
    await expect(
      isolation().run(
        tenantActor(TENANT_A),
        undefined,
        async () => {
          const em = postgres.database.em();
          await em.execute(`set local role ${ROLE}`);
          await em.execute('update "tenancy"."approval_bindings" set input_hash = ? where id = ?', [
            "tampered",
            id,
          ]);
        },
        { readOnly: false },
      ),
    ).rejects.toThrow(/permission denied/i);
    expect((await as(TENANT_A).find(id))?.inputHash).toBe(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    );
  });
});
