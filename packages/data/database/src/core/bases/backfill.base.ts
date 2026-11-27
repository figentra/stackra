/**
 * Stackra file contract:
 * Purpose: `Backfill`, the kind base of a data backfill in `database/backfills/`: `class X extends Backfill({ key,
 *          table, pending, set? })`, run in batches by `runBackfill` (a queue job, ADR 0159 d3), resumable through
 *          `database.backfill_runs`, and awaited by a contract step's `schema.requireBackfill(key, ...)`.
 * Boundary: called form only, made with `createKind`; the reader checks every option when the class is declared and
 *           records it frozen. Its SQL parts are literals over the table's own columns, one line each, with no `;` or
 *           `$$`. A backfill writes data; a migration never does (ADR 0334 rule 4).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs); ADR 0334 (rule 4); ADR 0294 (decision 25:
 *                     kind bases).
 */
import { createKind } from "@stackra/container";

import { BackfillBase } from "#core/bases/backfill-base.base";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { BackfillClass } from "#core/types/backfill-class.type";
import type { BackfillOptions } from "#core/types/backfill-options.type";

/** A backfill key: `<module>.<snake name>`. */
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** The largest batch. */
const MAX_BATCH = 10_000;

/** The longest pause, in milliseconds. */
const MAX_PAUSE = 60_000;

/** A backfill instance. */
export type Backfill = BackfillBase;

/**
 * Refuses a SQL part that is blank, spans lines, or holds `;` or `$$`.
 *
 * @throws TypeError naming the option.
 */
function fragment(key: string, option: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "" || /[\r\n;]|\$\$/.test(value))
    throw new TypeError(`Backfill ${key}: ${option} is one line of SQL without ; or $$`);
  return value.trim();
}

/** Checks the options of the called form. */
function read(options: BackfillOptions): Readonly<Record<string, unknown>> {
  const key = options?.key;
  if (typeof key !== "string" || !KEY.test(key))
    throw new TypeError(
      `Backfill({ key }) is <module>.<snake name>, such as "orders.fill_totals", got ${JSON.stringify(key)}`,
    );
  const [schema = "", table = "", ...rest] =
    typeof options.table === "string" ? options.table.split(".") : [];
  if (rest.length > 0 || table === "")
    throw new TypeError(`Backfill ${key}: table is schema-qualified, such as "orders.orders"`);
  quoteIdentifier(schema);
  quoteIdentifier(table);
  const by = options.by ?? "id";
  quoteIdentifier(by);
  const batch = options.batch ?? 500;
  if (!Number.isInteger(batch) || batch < 1 || batch > MAX_BATCH)
    throw new RangeError(`Backfill ${key}: batch is a whole number from 1 to ${MAX_BATCH}`);
  const pause = options.pause ?? 0;
  if (!Number.isInteger(pause) || pause < 0 || pause > MAX_PAUSE)
    throw new RangeError(`Backfill ${key}: pause is whole milliseconds from 0 to ${MAX_PAUSE}`);
  return Object.freeze({
    key,
    schema,
    table,
    by,
    pending: fragment(key, "pending", options.pending),
    set: options.set === undefined ? undefined : fragment(key, "set", options.set),
    batch,
    pause,
  });
}

/**
 * The backfill kind base.
 *
 * @example
 * export class FillOrderTotalsBackfill extends Backfill({
 *   key: "orders.fill_totals",
 *   table: "orders.orders",
 *   pending: "total_minor is null",
 *   set: "total_minor = subtotal_minor + tax_minor",
 * }) {}
 */
export const Backfill = createKind("backfill", BackfillBase, read) as unknown as (
  options: BackfillOptions,
) => BackfillClass;
