/**
 * Stackra file contract:
 * Purpose: the isolation test of the settings runner (`settings:apply`) on real Postgres, connected as a NOBYPASSRLS
 *          login role in the service role: applied at a tenant node (`nlevel` 3), it writes that node's row and its
 *          revision as the tenant's (`withTenant` inside `withScope`, one transaction), so the tenant's own session can
 *          then update the row; applied at a product node (`nlevel` 2), it writes them as the platform's (`tenant_id`
 *          NULL); asked for a node below a tenant node, it refuses before connecting and writes nothing.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the runner connects through `DATABASE_URL`, set for the
 *           file to a login role of its own that is a member of the service role; the superuser checks, and the
 *           tenant's update runs as the service role (`asService`). Its own file, since the runner closes the
 *           connection it made the running database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap C); ADR 0327 (decision 8: the tenant level); ADR 0213
 *                     (decision 4); ADR 0182 (integration tier); `.agents/rules/tenancy.md` (points 7 and 8).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { asService, HOST, ownerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { SettingType } from "#core/enums/setting-type.enum";
import { settingKeys } from "#core/functions/setting-keys.function";
import { settingsApply } from "#node/functions/settings-apply.function";

/** Product alpha (the platform's), a tenant under it, and a node below that. */
const ALPHA: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w4", path: "platform.alpha" };
const ACME: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w3", path: "platform.alpha.acme" };
const NORTH: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w5", path: "platform.alpha.acme.north" };

const PACK = "groups:\n  runner_orders:\n    values:\n      a: 1\n";

// the group the pack writes, registered as gen registers a member's keys, so the fail-closed floor guard knows it
settingKeys({
  runner_orders: {
    a: {
      type: SettingType.Integer,
      default: 0,
      scopes: ["platform", "tenant"],
      label: "runner_orders::settings.a.label" as I18nKey,
    },
  },
});

describe.skipIf(HOST === undefined)("settings runner row security on Postgres", () => {
  let postgres: OwnerPostgres;
  const previous = process.env["DATABASE_URL"];

  beforeAll(async () => {
    postgres = await ownerPostgres();
    const login = `cli_${postgres.role}`;
    // raw-sql: the runner's login role, unprivileged, holding the service role's rights
    await postgres.database
      .em()
      .execute(`create role "${login}" login nobypassrls in role "${postgres.role}"`);
    process.env["DATABASE_URL"] = postgres.urlAs(login);
  }, 120_000);

  afterAll(async () => {
    if (previous === undefined) delete process.env["DATABASE_URL"];
    else process.env["DATABASE_URL"] = previous;
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  it("applies at a tenant node as that tenant, so the tenant's own session can update the row", async () => {
    const { revisions } = await settingsApply({
      cwd: process.cwd(),
      environment: "dev",
      scope: ACME,
      yaml: PACK,
      author: "usr_01jab3k4m5n6p7q8r9s0t1v2w6",
    });
    expect(revisions).toHaveLength(1);
    expect(
      await superuser(
        'select tenant_id, "values" from settings.stored_settings where scope_id = ?',
        [ACME.id],
      ),
    ).toEqual([{ tenant_id: ACME.id, values: { a: 1 } }]);
    expect(
      await superuser(
        "select tenant_id from settings.stored_setting_revisions where scope_id = ?",
        [ACME.id],
      ),
    ).toEqual([{ tenant_id: ACME.id }]);
    expect(
      await asService(postgres, ACME.id, () =>
        postgres.database
          .em()
          .execute(
            `update settings.stored_settings set "values" = "values" || '{"b": 2}'::jsonb where scope_id = ? returning id`,
            [ACME.id],
          ),
      ),
    ).toHaveLength(1);
    expect(
      await superuser('select "values" from settings.stored_settings where scope_id = ?', [
        ACME.id,
      ]),
    ).toEqual([{ values: { a: 1, b: 2 } }]);
  });

  it("applies at a product node as the platform, with no tenant", async () => {
    const { revisions } = await settingsApply({
      cwd: process.cwd(),
      environment: "dev",
      scope: ALPHA,
      yaml: PACK,
      author: "usr_01jab3k4m5n6p7q8r9s0t1v2w6",
    });
    expect(revisions).toHaveLength(1);
    expect(
      await superuser(
        'select tenant_id, "values" from settings.stored_settings where scope_id = ?',
        [ALPHA.id],
      ),
    ).toEqual([{ tenant_id: null, values: { a: 1 } }]);
    expect(
      await superuser(
        "select tenant_id from settings.stored_setting_revisions where scope_id = ?",
        [ALPHA.id],
      ),
    ).toEqual([{ tenant_id: null }]);
  });

  it("refuses a node below a tenant node before connecting, and writes nothing", async () => {
    await expect(
      settingsApply({
        cwd: process.cwd(),
        environment: "dev",
        scope: NORTH,
        yaml: PACK,
        author: "usr_01jab3k4m5n6p7q8r9s0t1v2w6",
      }),
    ).rejects.toThrow(/cannot resolve the tenant of platform\.alpha\.acme\.north yet/);
    expect(
      await superuser("select 1 from settings.stored_settings where scope_id = ?", [NORTH.id]),
    ).toEqual([]);
    expect(
      await superuser("select 1 from settings.stored_setting_revisions where scope_id = ?", [
        NORTH.id,
      ]),
    ).toEqual([]);
  });
});
