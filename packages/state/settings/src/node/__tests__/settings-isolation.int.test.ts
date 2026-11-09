/**
 * Stackra file contract:
 * Purpose: the isolation test of the settings tables on real Postgres, each hot path run as the NOBYPASSRLS service
 *          role over rows of two owners and the platform's. A tenant's read of a node chain takes the platform's root
 *          and product rows and its own node's, never another tenant's; a tenant's write lands in its own row, the
 *          platform's root row untouched; a platform session reads and writes only the platform's rows; a user's
 *          settings are kept per owner, so a tenant writes its own row beside the platform's row of the same user and
 *          never changes it. The scheduler's claim (`settings.claim_due_revisions`) reaches every owner's due revision
 *          while a session with no owner reads only the platform's directly.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the superuser seeds and checks, everything under test
 *           runs as the service role (`asService`). Tests share the database and run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0213 (decisions 1, 2 and 5); ADR 0182
 *                     (integration tier); ADR 0022; `.agents/rules/tenancy.md` (points 7 and 8).
 */
import type { ScopeRef } from "@stackra/contracts";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { asService, HOST, ownerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresSettingValueStoreDriver } from "#node/drivers/postgres-setting-value-store.driver";
import { StoredSettingService } from "#node/services/stored-setting.service";

/** The root, product alpha and two tenants under it, as scope refs. */
const ROOT: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w0", path: "platform" };
const ALPHA: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w1", path: "platform.alpha" };
const ACME: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w3", path: "platform.alpha.acme" };
const GLOBEX: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w4", path: "platform.alpha.globex" };

const USER = "usr_01jab3k4m5n6p7q8r9s0t1v2w6";

/** A value store over the running context's database. */
const store = () => new PostgresSettingValueStoreDriver(new StoredSettingService());

describe.skipIf(HOST === undefined)("settings row security on Postgres", () => {
  let postgres: OwnerPostgres;

  beforeAll(async () => {
    postgres = await ownerPostgres();
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** The holders of the layers `target` reads in `owner` (none: no owner). */
  const holdersAs = async (owner: string | undefined, target: ScopeRef) =>
    (await asService(postgres, owner, () => store().layers("orders", { scope: target }))).map(
      (layer) => [layer.holder, layer.values],
    );

  it("writes each node's row in its owner: the platform's at the root and product, a tenant's at its node", async () => {
    await asService(postgres, undefined, () => store().write("orders", { scope: ROOT }, { a: 1 }));
    await asService(postgres, undefined, () => store().write("orders", { scope: ALPHA }, { b: 1 }));
    await asService(postgres, ACME.id, () => store().write("orders", { scope: ACME }, { c: 1 }));
    await asService(postgres, GLOBEX.id, () =>
      store().write("orders", { scope: GLOBEX }, { c: 2 }),
    );
    expect(
      await superuser(
        "select scope_path::text as path, tenant_id from settings.stored_settings order by scope_path",
      ),
    ).toEqual([
      { path: "platform", tenant_id: null },
      { path: "platform.alpha", tenant_id: null },
      { path: "platform.alpha.acme", tenant_id: ACME.id },
      { path: "platform.alpha.globex", tenant_id: GLOBEX.id },
    ]);
  });

  it("reads a tenant's chain with the platform's rows and its own, never another tenant's", async () => {
    expect(await holdersAs(ACME.id, ACME)).toEqual([
      ["platform", { a: 1 }],
      ["platform.alpha", { b: 1 }],
      ["platform.alpha.acme", { c: 1 }],
    ]);
    // acme's session cannot read globex's node row even when it names it
    expect(await holdersAs(ACME.id, GLOBEX)).toEqual([
      ["platform", { a: 1 }],
      ["platform.alpha", { b: 1 }],
    ]);
    // a session with no owner reads only the platform's rows
    expect(await holdersAs(undefined, ACME)).toEqual([
      ["platform", { a: 1 }],
      ["platform.alpha", { b: 1 }],
    ]);
  });

  it("keeps a tenant off the platform's rows and a platform session off a tenant's", async () => {
    // acme reads the root's row but its update matches nothing; the platform cannot see acme's row, so its insert of
    // a second row at acme's node hits the node key
    await asService(postgres, ACME.id, () =>
      store().write("orders", { scope: ROOT }, { a: 9 }),
    ).catch(() => undefined);
    await expect(
      asService(postgres, undefined, () => store().write("orders", { scope: ACME }, { c: 9 })),
    ).rejects.toThrow();
    expect(
      await superuser(
        "select scope_path::text as path, \"values\" from settings.stored_settings where scope_path in ('platform', 'platform.alpha.acme') order by scope_path",
      ),
    ).toEqual([
      { path: "platform", values: { a: 1 } },
      { path: "platform.alpha.acme", values: { c: 1 } },
    ]);
  });

  it("keeps a user's settings per owner: a tenant writes its own row beside the platform's", async () => {
    await asService(postgres, undefined, () => store().write("orders", { user: USER }, { d: 1 }));
    await asService(postgres, ACME.id, () => store().write("orders", { user: USER }, { d: 2 }));
    await asService(postgres, ACME.id, () => store().write("orders", { user: USER }, { e: 2 }));
    expect(
      await superuser(
        'select tenant_id, "values" from settings.stored_settings where user_id is not null order by tenant_id nulls first',
      ),
    ).toEqual([
      { tenant_id: null, values: { d: 1 } },
      { tenant_id: ACME.id, values: { d: 2, e: 2 } },
    ]);
    const userLayer = async (owner: string | undefined) =>
      (await asService(postgres, owner, () => store().layers("orders", { user: USER }))).at(-1);
    expect(await userLayer(ACME.id)).toMatchObject({ values: { d: 2, e: 2 } });
    expect(await userLayer(undefined)).toMatchObject({ values: { d: 1 } });
    expect(await userLayer(GLOBEX.id)).toBeUndefined();
    await asService(postgres, ACME.id, () => store().remove("orders", { user: USER }, ["d"]));
    expect(
      await superuser(
        'select tenant_id, "values" from settings.stored_settings where user_id is not null order by tenant_id nulls first',
      ),
    ).toEqual([
      { tenant_id: null, values: { d: 1 } },
      { tenant_id: ACME.id, values: { e: 2 } },
    ]);
  });

  it("claims every owner's due revision while a session with no owner reads only the platform's", async () => {
    await superuser(
      `insert into settings.stored_setting_revisions
         (id, created_at, updated_at, group_key, scope_id, scope_path, author, environment, status, effective_at, tenant_id)
         values ('ssr_acme', now(), now(), 'orders', ?, ?::ltree, 'usr_a', 'live', 'scheduled', now() - interval '2 minutes', ?),
                ('ssr_globex', now(), now(), 'orders', ?, ?::ltree, 'usr_a', 'live', 'scheduled', now() - interval '1 minute', ?),
                ('ssr_root', now(), now(), 'orders', ?, ?::ltree, 'usr_a', 'live', 'scheduled', now() - interval '3 minutes', null),
                ('ssr_later', now(), now(), 'orders', ?, ?::ltree, 'usr_a', 'live', 'scheduled', now() + interval '1 day', ?),
                ('ssr_done', now(), now(), 'orders', ?, ?::ltree, 'usr_a', 'live', 'applied', now() - interval '1 day', ?)`,
      [
        ACME.id,
        ACME.path,
        ACME.id,
        GLOBEX.id,
        GLOBEX.path,
        GLOBEX.id,
        ROOT.id,
        ROOT.path,
        ACME.id,
        ACME.path,
        ACME.id,
        ACME.id,
        ACME.path,
        ACME.id,
      ],
    );
    expect(
      await asService(postgres, undefined, () =>
        postgres.database
          .em()
          .execute("select id from settings.stored_setting_revisions order by id"),
      ),
    ).toEqual([{ id: "ssr_root" }]);
    expect(
      await asService(postgres, undefined, () =>
        postgres.database
          .em()
          .execute("select id, tenant_id from settings.claim_due_revisions(now(), 10)"),
      ),
    ).toEqual([
      { id: "ssr_root", tenant_id: null },
      { id: "ssr_acme", tenant_id: ACME.id },
      { id: "ssr_globex", tenant_id: GLOBEX.id },
    ]);
    expect(
      await asService(postgres, undefined, () =>
        postgres.database.em().execute("select id from settings.claim_due_revisions(now(), 1)"),
      ),
    ).toEqual([{ id: "ssr_root" }]);
  });
});
