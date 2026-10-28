/**
 * Stackra file contract:
 * Purpose: `PostgresHoldRegistryDriver`, the `HoldRegistry` of a product outside Figentra OS: it answers from the
 *          `privacy.legal_holds` store that `PlaceHoldAction` and `ReleaseHoldAction` keep, so the product's deletes,
 *          purges, retention jobs and frozen edits skip held records with no compliance service.
 * Boundary: a driver of @stackra/database's `HoldRegistry` port. A record is held when a live hold names its model and
 *           id, or names a public id one of its subject links holds (`registerHoldLinks`). It runs in the caller's
 *           transaction and names the session's tenant partition as well as the policy enforcing it, so a hold stays
 *           inside its tenant. Each refused disposal is logged to `privacy.legal_hold_refusals`, as the port asks.
 *           Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: a `HoldRegistry` port); ADR 0189 (decision 4); ADR 0263 (ports
 *                     and drivers); data-layer gap gov20 (stackra-332).
 */
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Database } from "@stackra/database";
import { HoldRegistry } from "@stackra/database/contracts";
import type { Disposal, HoldLinks } from "@stackra/database/contracts";

/** The holds table. */
const HOLDS = '"privacy"."legal_holds"';

/** The refusal log. */
const REFUSALS = '"privacy"."legal_hold_refusals"';

/** The session's partition, as the tables' policies read it. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/** A live hold's target. */
type HoldRow = { readonly model: string; readonly record_id: string };

/** `count` bound placeholders. */
const placeholders = (count: number): string => Array.from({ length: count }, () => "?").join(", ");

/**
 * Holds from the product's own Postgres store.
 *
 * @example
 * // generated wiring: { port: HoldRegistry, candidates: { postgres: … }, deps: { postgres: [Database] } }
 */
export class PostgresHoldRegistryDriver extends Driver(HoldRegistry) {
  /** The connected database; its entity manager is the running transaction's. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** See `HoldRegistry.heldAmong`; nothing is asked for no ids. */
  async heldAmong<M extends object>(
    model: AnyClass<M>,
    ids: readonly string[],
    disposal: Disposal,
    links?: HoldLinks,
  ): Promise<ReadonlySet<string>> {
    if (ids.length === 0) return new Set();
    const linked = new Set(ids.flatMap((id) => Object.values(links?.[id] ?? {})));
    const targets = [...new Set([...ids, ...linked])];
    const rows = (await this.sql().execute(
      // raw-sql: the live holds on the records or their linked subjects, in the session's partition
      `select model, record_id from ${HOLDS} where scope_id = ${PARTITION} and released_at is null ` +
        `and record_id in (${placeholders(targets.length)})`,
      targets,
    )) as readonly HoldRow[];
    const direct = new Set(
      rows.filter((row) => row.model === model.name).map((row) => row.record_id),
    );
    const subjects = new Set(rows.map((row) => row.record_id));
    const held = ids.filter(
      (id) =>
        direct.has(id) ||
        Object.values(links?.[id] ?? {}).some((linkedId) => subjects.has(linkedId)),
    );
    if (held.length > 0)
      await this.sql().execute(
        // raw-sql: one log row per refused record
        `insert into ${REFUSALS} (scope_id, model, record_id, disposal, at) values ` +
          held.map(() => `(${PARTITION}, ?, ?, ?, now())`).join(", "),
        held.flatMap((id) => [model.name, id, disposal]),
      );
    return new Set(held);
  }

  /** The running transaction's entity manager, as raw SQL. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
