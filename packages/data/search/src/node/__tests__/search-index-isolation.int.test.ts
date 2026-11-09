/**
 * Stackra file contract:
 * Purpose: the isolation test of the index registry (`search.indexes`) on real Postgres, its hot paths run as the
 *          NOBYPASSRLS service role over indexes of two owners and the platform's. A reindex job records its run in its
 *          call's own row (a tenant's, or the platform's outside a tenant), each owner's platform-wide index of one
 *          model kept apart, and never touches another owner's; a session with no owner reads only the platform's rows
 *          directly, while `search:status` (`SearchIndexRegistry.list`, through `search.index_statuses`) reads every
 *          owner's, each with its owner. For one release the previous release's writes still land: its `-` key and its
 *          upsert on `(model, scope_key)` beside the new key.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the superuser checks, everything under test runs as the
 *           service role (`asService`). Tests share the database and run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0404 (decision 3); ADR 0182 (integration
 *                     tier); ADR 0022; `.agents/rules/tenancy.md` (points 7 and 8).
 */
import type { ScopeRef } from "@stackra/contracts";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { SearchIndexState } from "#core/enums/search-index-state.enum";
import { asService, HOST, ownerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { SearchIndexRegistry } from "#node/services/search-index-registry.service";

/** Two tenants under product alpha, as scope refs. */
const ACME: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w3", path: "platform.alpha.acme" };
const GLOBEX: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w4", path: "platform.alpha.globex" };

describe.skipIf(HOST === undefined)("search index registry row security on Postgres", () => {
  let postgres: OwnerPostgres;

  beforeAll(async () => {
    postgres = await ownerPostgres();
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  const registry = () => new SearchIndexRegistry(postgres.database);

  /** Runs a whole rebuild of `model` in `scope` as `owner` (none: the platform), ending with `count` documents. */
  const rebuild = (owner: string | undefined, scope: ScopeRef | undefined, count: number) =>
    asService(postgres, owner, async () => {
      await registry().begin("Product", scope, "abc");
      await registry().progress("Product", scope, `prd_${count}`, count);
      await registry().finish("Product", scope, count);
    });

  it("records each owner's run in its own row, platform-wide indexes of one model kept apart", async () => {
    await rebuild(undefined, undefined, 1);
    await rebuild(ACME.id, undefined, 2);
    await rebuild(ACME.id, ACME, 3);
    await rebuild(GLOBEX.id, GLOBEX, 4);
    await rebuild(GLOBEX.id, undefined, 5);
    expect(
      await postgres.database
        .em()
        .execute("select tenant_id, scope_key, doc_count from search.indexes order by doc_count"),
    ).toEqual([
      { tenant_id: null, scope_key: null, doc_count: 1 },
      { tenant_id: ACME.id, scope_key: null, doc_count: 2 },
      { tenant_id: ACME.id, scope_key: ACME.id, doc_count: 3 },
      { tenant_id: GLOBEX.id, scope_key: GLOBEX.id, doc_count: 4 },
      { tenant_id: GLOBEX.id, scope_key: null, doc_count: 5 },
    ]);
  });

  it("never changes another owner's row: a rerun touches only the call's own", async () => {
    await asService(postgres, ACME.id, () => registry().finish("Product", undefined, 20));
    await asService(postgres, ACME.id, () => registry().finish("Product", GLOBEX, 40));
    expect(
      await postgres.database
        .em()
        .execute(
          "select tenant_id, doc_count from search.indexes where scope_key is null order by doc_count",
        ),
    ).toEqual([
      { tenant_id: null, doc_count: 1 },
      { tenant_id: GLOBEX.id, doc_count: 5 },
      { tenant_id: ACME.id, doc_count: 20 },
    ]);
    expect(
      await postgres.database
        .em()
        .execute("select doc_count from search.indexes where scope_key = ?", [GLOBEX.id]),
    ).toEqual([{ doc_count: 4 }]);
  });

  it("shows a session with no owner only the platform's rows, and search:status every owner's", async () => {
    expect(
      await asService(postgres, undefined, () =>
        postgres.database.em().execute("select doc_count from search.indexes"),
      ),
    ).toEqual([{ doc_count: 1 }]);
    const statuses = await asService(postgres, undefined, () => registry().list());
    expect(statuses.map((status) => [status.ownerId, status.scope?.id, status.docCount])).toEqual([
      [undefined, undefined, 1],
      [ACME.id, undefined, 20],
      [ACME.id, ACME.id, 3],
      [GLOBEX.id, undefined, 5],
      [GLOBEX.id, GLOBEX.id, 4],
    ]);
    expect(statuses.every((status) => status.state === SearchIndexState.Valid)).toBe(true);
  });
  it("accepts the previous release's writes for one release: its - key and its upsert on (model, scope_key)", async () => {
    // the previous release's begin and finish, verbatim but for the model
    const oldBegin = (scope: ScopeRef | undefined) =>
      postgres.database
        .em()
        .execute(
          "insert into search.indexes as idx (model, scope_key, scope_id, scope_path, state, facet_hash, doc_count, version) " +
            "values ('Order', ?, ?, ?, 'rebuilding', 'abc', 0, null) on conflict (model, scope_key) do update set " +
            "state = 'rebuilding', updated_at = now() returning cursor, doc_count",
          [scope?.id ?? "-", scope?.id ?? null, scope?.path ?? null],
        );
    const oldFinish = (scope: ScopeRef | undefined) =>
      postgres.database
        .em()
        .execute(
          "update search.indexes set state = 'valid', doc_count = ?, updated_at = now() where model = 'Order' and scope_key = ?",
          [7, scope?.id ?? "-"],
        );
    for (const [owner, scope] of [
      [undefined, undefined],
      [ACME.id, ACME],
    ] as const)
      await asService(postgres, owner, async () => {
        await oldBegin(scope);
        await oldBegin(scope);
        await oldFinish(scope);
      });
    await asService(postgres, undefined, () => registry().begin("Order", undefined, "abc"));
    await asService(postgres, ACME.id, () => registry().begin("Order", ACME, "abc"));
    expect(
      await postgres.database
        .em()
        .execute(
          "select tenant_id, scope_key, state, doc_count from search.indexes where model = 'Order' order by tenant_id nulls first, scope_key nulls first",
        ),
    ).toEqual([
      { tenant_id: null, scope_key: null, state: "rebuilding", doc_count: 0 },
      { tenant_id: null, scope_key: "-", state: "valid", doc_count: 7 },
      { tenant_id: ACME.id, scope_key: ACME.id, state: "rebuilding", doc_count: 0 },
    ]);
  });
});
