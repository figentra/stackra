/**
 * Stackra file contract:
 * Purpose: the sixth migration of the outbox package (`outbox.0006_contract_outbox_tenancy`): makes `messages`,
 *          `deliveries`, `changes` (with every partition), `replica_changes`, `device_sequences` and
 *          `offline_cap_uses` tenant-owned in
 *          the platform form (ADR 0239 amendment, gap C), and gives the cross-tenant readers their system functions
 *          (gap A). Each table gets `tenant_id` (nullable, filled from `app.tenant_id` by default, so every writer stores
 *          the call's tenant and never one from input; a NULL row is the platform's) and the one permissive policy
 *          `pol_<table>_tenant_id` with the restrictive `_write_update` and `_write_delete`. The relay, the cross-app
 *          relay, the prune, the change log's readers and retention, and the operator's commands claim ids and tenants
 *          through a `schema.systemFunction` and load or change each row in its tenant's isolation.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the online indexes runs in one transaction: the column, the backfill, the
 *           pre-flight, then per table its policies and system access in one blueprint. The backfill reads only the
 *           row: tenants are recursive, so only a scope at `nlevel(scope_path) = 3` is certainly a tenant, whose
 *           `scope_id` becomes the row's tenant (a delivery reads its envelope's scope); a row with no scope or at the
 *           root or a product node stays a platform row. A row deeper than a tenant node is refused, naming each
 *           table's count and the remedy, so a refusal changes nothing. Policies are not inherited by partitions, so
 *           `changes_default` takes its own blueprint and every dated partition gets the parent's owner policies copied
 *           by `outbox.secure_change_partition`, which `ChangeFeed.maintain` calls on each partition it makes. `changes`
 *           is partitioned, so its tenant column has no index (an online index cannot be built on a partitioned table,
 *           and the log is read by position). A replica partition is shared across tenants and numbered globally, which a
 *           tenant session cannot see whole, so its head and oldest position are read through `outbox.replica_bounds`
 *           while its rows stay under the tenant's policy. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0347 (decisions 1 and 2); ADR 0327
 *                     (decisions 2 and 8: the tenant level); ADR 0159 (as amended: expand and contract); ADR 0078 and
 *                     ADR 0221 (2026-10-28 amendment: the partitioned change log).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The platform form of the tenant column. */
const PLATFORM = { setting: "app.tenant_id", match: "platform" } as const;

/** The owner column's comment. */
const OWNER =
  "The owning tenant, or NULL for a platform row; filled from the call's tenant, never from input.";

/** What an environment refused for messages or deliveries does first. */
const DRAIN =
  "A message or delivery below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Drain the relay first: deliver or dead-letter pending messages and deliveries, delete those dead letters, then migrate again.";

/** What an environment refused for change log entries does first. */
const CHANGES =
  "A change below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Let every change consumer pass those changes, delete them (or wait for the change log's retention to drop them), then migrate again.";

/** What an environment refused for device sequences does first. */
const DEVICES =
  "A device sequence below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Let those devices settle their offline queues, delete their rows, then migrate again.";

/** What an environment refused for replica changes does first. */
const REPLICAS =
  "A replica change below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Delete those replica changes (a device whose cursor falls below the oldest kept position fills again), then migrate again.";

/** Makes the outbox tables tenant-owned in the platform form. */
export class ContractOutboxTenancyMigration extends Migration {
  /** The columns, the backfill, the pre-flight, the policies and system access, then the partitions and functions. */
  up(schema: SchemaBuilder): void {
    for (const table of [
      "messages",
      "deliveries",
      "replica_changes",
      "device_sequences",
      "offline_cap_uses",
    ])
      schema.table(table, (t: Blueprint) => {
        t.link("tenant_id").nullable().defaultSetting("app.tenant_id").comment(OWNER);
      });
    schema.table("changes", (t: Blueprint) => {
      t.string("tenant_id", 33).nullable().defaultSetting("app.tenant_id").comment(OWNER);
    });
    for (const table of ["messages", "changes", "replica_changes", "device_sequences"])
      schema.sql(
        `update "outbox"."${table}" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3`,
        { inverse: false },
      );
    schema.sql(
      `update "outbox"."deliveries" set "tenant_id" = "envelope" #>> '{scope,id}' where "tenant_id" is null and nlevel(("envelope" #>> '{scope,path}')::ltree) = 3`,
      { inverse: false },
    );
    schema.refuseNulls("tenant_id", ["messages"], DRAIN, { where: 'nlevel("scope_path") > 3' });
    schema.refuseNulls("tenant_id", ["deliveries"], DRAIN, {
      where: `nlevel(("envelope" #>> '{scope,path}')::ltree) > 3`,
    });
    schema.refuseNulls("tenant_id", ["changes"], CHANGES, { where: 'nlevel("scope_path") > 3' });
    schema.refuseNulls("tenant_id", ["replica_changes"], REPLICAS, {
      where: 'nlevel("scope_path") > 3',
    });
    schema.refuseNulls("tenant_id", ["device_sequences"], DEVICES, {
      where: 'nlevel("scope_path") > 3',
    });
    schema.table("messages", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["id", "tenant_id", "occurred_at", "available_at", "dead_at"],
        reason: "the relay claims due messages and the prune claims dead letters across tenants",
      });
    });
    schema.table("deliveries", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: [
          "id",
          "tenant_id",
          "subscriber",
          "attempts",
          "available_at",
          "dead_at",
          "created_at",
        ],
        update: ["available_at"],
        reason:
          "the cross-app relay leases due deliveries and the operator lists them across tenants",
      });
    });
    schema.table("changes", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["tx", "seq", "type", "occurred_at", "tenant_id"],
        reason:
          "the relay and the warehouse sink claim committed changes across tenants by position",
      });
    });
    schema.table("changes_default", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["tx", "seq", "occurred_at", "tenant_id"],
        reason:
          "the change log's retention claims expired rows of the default partition across tenants",
      });
    });
    schema.table("replica_changes", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["partition", "position", "tenant_id"],
        reason: "an append numbers a replica partition shared across tenants from its global head",
      });
    });
    schema.table("device_sequences", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
    });
    schema.table("offline_cap_uses", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
    });
    // A partition keeps no policy of its parent's, so one queried directly would be open; every dated partition gets
    // the parent's owner policies, enabled and forced, by name `pol_<partition>_tenant_id...`.
    schema.sql(
      [
        "create function outbox.secure_change_partition(partition_name text) returns void",
        "language plpgsql set search_path = pg_catalog, pg_temp as $secure$",
        "declare",
        "  pol record;",
        "begin",
        "  execute format('alter table outbox.%I enable row level security', partition_name);",
        "  execute format('alter table outbox.%I force row level security', partition_name);",
        "  for pol in",
        "    select p.polname, p.polpermissive, p.polcmd,",
        "      pg_get_expr(p.polqual, p.polrelid) as qual, pg_get_expr(p.polwithcheck, p.polrelid) as checked",
        "    from pg_policy p",
        "    where p.polrelid = 'outbox.changes'::regclass and p.polname like 'pol\\_changes\\_tenant\\_id%'",
        "  loop",
        "    execute format('drop policy if exists %I on outbox.%I',",
        "      'pol_' || partition_name || substr(pol.polname, 12), partition_name);",
        "    execute format('create policy %I on outbox.%I as %s for %s using (%s)',",
        "      'pol_' || partition_name || substr(pol.polname, 12), partition_name,",
        "      case when pol.polpermissive then 'permissive' else 'restrictive' end,",
        "      case pol.polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update'",
        "        when 'd' then 'delete' else 'all' end,",
        "      pol.qual)",
        "      || case when pol.checked is null then '' else format(' with check (%s)', pol.checked) end;",
        "  end loop;",
        "end",
        "$secure$",
      ].join("\n"),
      { inverse: "drop function if exists outbox.secure_change_partition(text)" },
    );
    schema.sql(
      [
        "do $$",
        "declare",
        "  child record;",
        "begin",
        "  for child in",
        "    select c.relname from pg_inherits i join pg_class c on c.oid = i.inhrelid",
        "    where i.inhparent = 'outbox.changes'::regclass and c.relname <> 'changes_default'",
        "  loop",
        "    perform outbox.secure_change_partition(child.relname);",
        "  end loop;",
        "end",
        "$$",
      ].join("\n"),
      { inverse: false },
    );
    schema.systemFunction({
      name: "replica_bounds",
      args: { replica_partition: "varchar(512)" },
      returns: { head: "bigint", oldest: "bigint" },
      sql: [
        "select coalesce(max(r.position), 0), coalesce(min(r.position), 1)",
        "from outbox.replica_changes r where r.partition = replica_partition",
      ].join("\n"),
      reason:
        "a replica partition's head and oldest position span every tenant's rows; positions stay global",
    });
    schema.systemFunction({
      name: "claim_due_messages",
      args: { due_at: "timestamptz", max_messages: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)", available_at: "timestamptz" },
      sql: [
        "select m.id, m.tenant_id, m.available_at from outbox.messages m",
        "where m.dead_at is null and m.available_at <= due_at",
        "order by m.occurred_at, m.id limit max_messages",
      ].join("\n"),
      reason:
        "the relay claims due messages of every tenant under its lock, then loads each in its tenant",
    });
    schema.systemFunction({
      name: "claim_dead_messages",
      args: { dead_before: "timestamptz", max_messages: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)", available_at: "timestamptz" },
      sql: [
        "select m.id, m.tenant_id, m.available_at from outbox.messages m",
        "where m.dead_at is not null and m.dead_at < dead_before",
        "order by m.dead_at, m.id limit max_messages",
      ].join("\n"),
      reason: "the prune claims old dead letters of every tenant, then deletes each in its tenant",
    });
    schema.systemFunction({
      name: "lease_due_deliveries",
      args: { due_at: "timestamptz", max_per_subscriber: "integer", lease_until: "timestamptz" },
      returns: {
        id: "varchar(33)",
        tenant_id: "varchar(33)",
        subscriber: "varchar(255)",
        attempts: "integer",
        dead_at: "timestamptz",
        created_at: "timestamptz",
      },
      sql: [
        "with due as (",
        "  select ranked.id from (",
        "    select d.id, row_number() over (partition by d.subscriber order by d.created_at, d.id) as rank",
        "    from outbox.deliveries d where d.dead_at is null and d.available_at <= due_at",
        "  ) as ranked where ranked.rank <= max_per_subscriber",
        ")",
        "update outbox.deliveries as d set available_at = lease_until from due where d.id = due.id",
        "returning d.id, d.tenant_id, d.subscriber, d.attempts, d.dead_at, d.created_at",
      ].join("\n"),
      reason:
        "the cross-app relay leases due deliveries of every tenant under its lock, then loads each in its tenant",
    });
    schema.systemFunction({
      name: "list_deliveries",
      args: {
        only_id: "varchar(33)",
        only_subscriber: "varchar(255)",
        only_state: "text",
        max_rows: "integer",
      },
      returns: {
        id: "varchar(33)",
        tenant_id: "varchar(33)",
        subscriber: "varchar(255)",
        attempts: "integer",
        dead_at: "timestamptz",
      },
      sql: [
        "select d.id, d.tenant_id, d.subscriber, d.attempts, d.dead_at from outbox.deliveries d",
        "where (only_id is null or d.id = only_id) and (only_subscriber is null or d.subscriber = only_subscriber)",
        "and (only_state is null",
        "  or (only_state = 'pending' and d.dead_at is null and d.attempts = 0)",
        "  or (only_state = 'failing' and d.dead_at is null and d.attempts > 0)",
        "  or (only_state = 'dead' and d.dead_at is not null))",
        "order by d.created_at, d.id limit max_rows",
      ].join("\n"),
      reason:
        "the platform operator's delivery commands list and replay deliveries of every tenant",
    });
    schema.systemFunction({
      name: "claim_changes",
      args: { after_tx: "xid8", after_seq: "bigint", models: "jsonb", max_rows: "integer" },
      returns: { tx: "xid8", seq: "bigint", tenant_id: "varchar(33)" },
      sql: [
        "select c.tx, c.seq, c.tenant_id from outbox.changes c",
        "where c.tx < pg_snapshot_xmin(pg_current_snapshot())",
        "and c.type in (select jsonb_array_elements_text(models))",
        "and (after_tx is null or (c.tx, c.seq) > (after_tx, after_seq))",
        "order by c.tx, c.seq limit max_rows",
      ].join("\n"),
      reason:
        "the relay and the warehouse sink claim committed changes of every tenant, then load them per tenant",
    });
    schema.systemFunction({
      name: "change_position_at",
      args: { at_or_after: "timestamptz" },
      returns: { tx: "xid8", seq: "bigint", latest: "boolean" },
      sql: [
        "(select c.tx, c.seq, false from outbox.changes c where c.occurred_at >= at_or_after",
        "  order by c.tx, c.seq limit 1)",
        "union all",
        "(select c.tx, c.seq, true from outbox.changes c order by c.tx desc, c.seq desc limit 1)",
      ].join("\n"),
      reason:
        "a replay moves a cursor to an instant of the whole log, every tenant's entries included",
    });
    schema.systemFunction({
      name: "claim_expired_changes",
      args: { expired_before: "timestamptz", max_rows: "integer" },
      returns: { tx: "xid8", seq: "bigint", tenant_id: "varchar(33)" },
      sql: [
        "select c.tx, c.seq, c.tenant_id from outbox.changes_default c",
        "where c.occurred_at < expired_before order by c.tx, c.seq limit max_rows",
      ].join("\n"),
      reason:
        "the change log's retention claims expired default-partition rows of every tenant, then deletes per tenant",
    });
  }
}
