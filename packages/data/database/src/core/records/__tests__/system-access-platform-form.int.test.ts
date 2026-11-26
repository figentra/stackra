/**
 * Stackra file contract:
 * Purpose: integration tests of system access on a platform-form table on a real Postgres (ADR 0239 amendment, gaps A
 *          and C): a nullable tenant column under the `platform` match, whose restrictive `_write_update` binds every
 *          role, with `t.systemAccess` update columns and a `schema.systemFunction` claim (`FOR UPDATE SKIP LOCKED`
 *          and a lease update). Run with no tenant, the claim takes the due rows of both tenants and the platform's
 *          NULL row, not only the NULL row; the service role (`svc`, NOBYPASSRLS) is still held by both write
 *          policies: a tenant session changes only its own rows, never a NULL row or another tenant's, and a session
 *          with no tenant changes only NULL rows. The catalogue's policies pass `policyGaps` with system update, so
 *          the audit's expected suffix is the one Postgres prints.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's superuser creates `svc` and
 *           seeds the rows; everything else runs as `svc` with `set local session authorization`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0182 (integration tier); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { policyGaps } from "#testing/functions/policy-gaps.function";
import type { PolicyRow } from "#testing/types/policy-row.type";
import { usePostgres } from "#testing/use-postgres";

const ACME = "scp_acme";
const GLOBEX = "scp_globex";

class CreateMessagesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("messages", (t: Blueprint) => {
      t.hasPublicId("msg");
      t.string("tenant_id", 33)
        .nullable()
        .comment("The owning tenant, or NULL for the platform's.");
      t.string("body").notNull().comment("The message.");
      t.timestamp("due_at").notNull().comment("When the message is due.");
      t.timestamp("leased_until").nullable().comment("When the claim's lease ends.");
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "platform" });
      t.systemAccess({
        select: ["id", "tenant_id", "due_at", "leased_until"],
        update: ["leased_until"],
        reason: "the relay claims due messages across tenants",
      });
    });
    schema.systemFunction({
      name: "claim_due_messages",
      args: { max_messages: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)" },
      sql: [
        "with due as (",
        "  select m.id from relay.messages m",
        "  where m.due_at <= pg_catalog.now() and m.leased_until is null",
        "  order by m.due_at limit max_messages for update skip locked",
        ")",
        "update relay.messages m set leased_until = pg_catalog.now() + interval '5 minutes'",
        "from due where m.id = due.id returning m.id, m.tenant_id",
      ].join("\n"),
      reason: "the relay claims due messages across tenants",
    });
  }
}

const migration = compileMigration(CreateMessagesMigration, {
  schema: "relay",
  createsSchema: true,
});

const postgres = usePostgres({
  migrations: [
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            "create role svc nologin createrole nobypassrls",
            "do $$ begin execute format('grant create on database %I to svc', current_database()); end $$",
          ],
        },
      ],
    },
    {
      ...migration,
      steps: migration.steps.map((step) => ({
        ...step,
        sql: ["begin", "set local role svc", ...step.sql, "commit"],
      })),
    },
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            `insert into relay.messages (id, tenant_id, body, due_at) values
              ('msg_a1', '${ACME}', 'acme', now() - interval '3 minutes'),
              ('msg_b1', '${GLOBEX}', 'globex', now() - interval '2 minutes'),
              ('msg_p1', null, 'platform', now() - interval '1 minute'),
              ('msg_a2', '${ACME}', 'acme later', now() + interval '1 day')`,
          ],
        },
      ],
    },
  ],
});

/** Runs `statement` as `role` (with `app.tenant_id` set to `scopeId`) in its own transaction, which it commits. */
function as(
  role: string,
  statement: string,
  params: readonly unknown[] = [],
  scopeId = "",
): Promise<Record<string, unknown>[]> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em();
    await em.execute("select set_config('app.tenant_id', ?, true)", [scopeId]);
    await em.execute(`set local session authorization ${role}`);
    return (await em.execute(statement, [...params])) as Record<string, unknown>[];
  });
}

/** The `body` update of message `id`, as `svc` in `scopeId`: the ids it changed. */
const touch = async (id: string, scopeId: string): Promise<string[]> =>
  (
    await as(
      "svc",
      "update relay.messages set body = body where id = ? returning id",
      [id],
      scopeId,
    )
  ).map((row) => String(row.id));

describe("system access on a platform-form table", () => {
  it("claims the due rows of every tenant and the platform's with no tenant set, not only the NULL row", async () => {
    const claimed = await as("svc", "select * from relay.claim_due_messages(?) order by id", [10]);
    expect(claimed).toEqual([
      { id: "msg_a1", tenant_id: ACME },
      { id: "msg_b1", tenant_id: GLOBEX },
      { id: "msg_p1", tenant_id: null },
    ]);
    const leased = (await postgres.database
      .em()
      .execute("select id from relay.messages where leased_until is not null order by id")) as {
      id: string;
    }[];
    expect(leased.map((row) => row.id)).toEqual(["msg_a1", "msg_b1", "msg_p1"]);
  });

  it("still keeps the NOBYPASSRLS service role's writes on its own rows", async () => {
    expect(await touch("msg_a1", ACME)).toEqual(["msg_a1"]);
    expect(await touch("msg_p1", ACME)).toEqual([]);
    expect(await touch("msg_b1", ACME)).toEqual([]);
    expect(await touch("msg_p1", "")).toEqual(["msg_p1"]);
    expect(await touch("msg_a1", "")).toEqual([]);
    expect(
      await as("svc", "delete from relay.messages where id = 'msg_p1' returning id", [], ACME),
    ).toEqual([]);
  });

  it("prints the policies the audit expects for a table with system update", async () => {
    const policies = (await postgres.database.em().execute(
      `select p.polname as name, p.polpermissive as permissive, p.polcmd::text as command,
         coalesce(pg_get_expr(p.polqual, p.polrelid), '') as "using",
         coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') as "check"
       from pg_policy p where p.polrelid = 'relay.messages'::regclass and p.polname not like '%system_access%'`,
    )) as PolicyRow[];
    const columns = ["id", "tenant_id", "body", "due_at", "leased_until"];
    const audit = (systemUpdate: boolean) =>
      policyGaps(
        "relay.messages",
        "messages",
        "tenant_id",
        "app.tenant_id",
        policies,
        columns,
        systemUpdate,
      );
    expect(audit(true)).toEqual([]);
    expect(audit(false)).toHaveLength(1);
  });
});
