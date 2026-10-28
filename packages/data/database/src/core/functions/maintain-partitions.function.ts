/**
 * Stackra file contract:
 * Purpose: `maintainPartitions(model, now)`, the upkeep of a `Partitioned` model's range-partitioned table: creates the
 *          current partition and `premake` ahead (`<table>_p<yyyymmdd>`), and detaches and drops every partition whose
 *          span ended more than `retain` ago, unless a legal hold covers one of its rows.
 * Boundary: runs on the connected `Database` (the maintenance job's system call); DDL needs the service role to own
 *           the table. Asks the connected `HoldRegistry` through `disposableIds` with `Disposal.Retention` and the
 *           rows' registered subject links, as every bulk disposal does; a held partition stays whole and is reported.
 *           The held check reads the expired partition directly, since the parent's forced row-level security hides
 *           every row from a system run. Only dated partitions are dropped, never `<table>_default`. shortcut: a held check reads every id of the
 *           expired partition; batch it when a partition outgrows memory.
 * Runtime: node
 * Governing contract: data-layer gaps db12, cdc6, sc4 (native partitioning, no extension); ADR 0134 (2026-10-24
 *                     amendment: every disposal path consults the registry); ADR 0160 (raw SQL with a reason).
 */
import type { AnyClass } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { traitsOf } from "@stackra/model";
import type { PartitionedOptions } from "@stackra/model";

import { HOLD_LINK_FIELDS } from "#core/constants/hold-link-fields.constant";
import { columnOf } from "#core/functions/column-of.function";
import { disposableIds } from "#core/functions/disposable-ids.function";
import { holdLinksOf } from "#core/functions/hold-links-of.function";
import { partitionStart } from "#core/functions/partition-start.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { Database } from "#core/ports/database.port";
import type { PartitionReport } from "#core/types/partition-report.type";
import { Disposal } from "#contracts/enums/disposal.enum";

/** A dated partition's name: the table, `_p`, and its start as `yyyymmdd`. */
const DATED = /_p(\d{4})(\d{2})(\d{2})$/;

/** `yyyymmdd` of a UTC instant. */
function stamp(instant: Date): string {
  return instant.toISOString().slice(0, 10).replaceAll("-", "");
}

/**
 * Keeps `model`'s partitions current.
 *
 * @throws TypeError when the model is not `Partitioned` or not a registered entity.
 * @example
 * const report = await maintainPartitions(MeterEvent, new Date());
 */
export async function maintainPartitions(model: AnyClass, now: Date): Promise<PartitionReport> {
  const options = traitsOf(model).find((trait) => trait.name === "partitioned")?.options as
    | (PartitionedOptions & { readonly premake: number })
    | undefined;
  if (options === undefined) throw new TypeError(`${model.name} is not Partitioned`);
  const em = Database.current().em();
  const meta = em.getMetadata(model);
  const schema = meta.schema ?? "public";
  const table = meta.tableName;
  const parent = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  const created: string[] = [];
  for (let offset = 0; offset <= options.premake; offset += 1) {
    const start = partitionStart(now, options.interval, offset);
    const end = partitionStart(start, options.interval, 1);
    const name = `${table}_p${stamp(start)}`;
    // raw-sql: partition DDL has no ORM form; the bounds are ISO instants computed here, never input
    const result = await em.execute<{ created: boolean }[]>(
      `select to_regclass(?) is null as created`,
      [`${schema}.${name}`],
    );
    if (result[0]?.created !== true) continue;
    await em.execute(
      `create table if not exists ${quoteIdentifier(schema)}.${quoteIdentifier(name)} partition of ${parent} for values from ('${start.toISOString()}') to ('${end.toISOString()}')`,
    );
    created.push(name);
  }
  const dropped: string[] = [];
  const held: string[] = [];
  if (options.retain !== undefined) {
    const cutoff = new Date(now.getTime() - Duration.toMilliseconds(options.retain));
    // raw-sql: the catalog lists the parent's partitions; schema and table are parameters
    const children = await em.execute<{ name: string }[]>(
      "select c.relname as name from pg_inherits i join pg_class c on c.oid = i.inhrelid join pg_class p on p.oid = i.inhparent join pg_namespace n on n.oid = p.relnamespace where n.nspname = ? and p.relname = ?",
      [schema, table],
    );
    const [key = "id"] = meta.primaryKeys;
    const fields = [key, ...(HOLD_LINK_FIELDS.get(model) ?? [])];
    for (const { name } of children) {
      const match = DATED.exec(name);
      if (match === null) continue;
      const start = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      const end = partitionStart(start, options.interval, 1);
      if (end > cutoff) continue;
      const child = `${quoteIdentifier(schema)}.${quoteIdentifier(name)}`;
      // raw-sql: read the partition itself, which the parent's forced row-level security does not filter, so a system
      // run sees every row a hold may cover; columns are aliased back to the model's field names for the hold links
      const rows = await em.execute<Record<string, unknown>[]>(
        `select ${fields.map((field) => `${quoteIdentifier(columnOf(meta, field))} as ${quoteIdentifier(field)}`).join(", ")} from ${child}`,
      );
      const ids = rows.map((row) => String(row[key]));
      const free = await disposableIds(
        model,
        ids,
        Disposal.Retention,
        holdLinksOf(model, rows, key),
      );
      if (free.length < ids.length) {
        held.push(name);
        continue;
      }
      // raw-sql: detaching then dropping a whole expired partition is the retention step
      await em.execute(`alter table ${parent} detach partition ${child}`);
      await em.execute(`drop table ${child}`);
      dropped.push(name);
    }
  }
  return { table: `${schema}.${table}`, created, dropped, held };
}
