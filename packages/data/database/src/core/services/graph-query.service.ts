/**
 * Stackra file contract:
 * Purpose: `GraphQuery`, the graph reader a query injects to follow a relation from its own rows: across a module
 *          boundary through the link's generated read (never the other module's table), inside a module through the
 *          reference.
 * Boundary: a platform service with no dependencies. Limits per ADR 0268 R10: 20 source rows by default, 100 at most,
 *           one relation per call (depth and fan-out stay within the limits). The listed fields are checked against
 *           each loaded row; rows are returned whole. The source rows carry the bound `VisibilityFilter`'s conditions;
 *           a related row is the related model's own read (its link resolver or its reference).
 *           Related rows are batched: links through `Link.loadMany` (one read per target model by id set, through the
 *           batch resolver when installed), references through one ORM `populate` (one `in` query), so a call runs
 *           a fixed number of statements, not one per row.
 * Runtime: node
 * Governing contract: ADR 0104 (decision 2: the query graph); ADR 0268 (R10); ADR 0294 (decision 28: links); ADR 0333
 *                     (decision 4); ADR 0097 (decision 4: batched link loading), data-layer gap model-orm 12 (STA-1400).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Link } from "@stackra/model";

import { visibleFilter } from "#core/functions/visible-filter.function";
import { Database } from "#core/ports/database.port";
import type { GraphOptions } from "#core/types/graph-options.type";
import type { GraphRow } from "#core/types/graph-row.type";
import type { Where } from "#contracts/types/where.type";

/** The most source rows one call reads. */
const MAX_LIMIT = 100;

/** Refuses a field list that names a field the row does not have. */
function checkFields(row: object, fields: readonly string[], key: string): void {
  for (const field of fields)
    if (!(field in row)) throw new TypeError(`GraphQuery: ${key} has no field ${field}`);
}

/**
 * The graph reader.
 *
 * @example
 * const rows = await this.graph.through(OrderLine, "variant", {
 *   where: { order },
 *   fields: { line: ["variant", "quantity"], variant: ["sku", "trackInventory"] },
 *   limit: 100,
 * });
 * rows[0].variant.sku;
 */
export class GraphQuery extends Service {
  /**
   * The rows of `model` matching `options.where`, each with the row its `relation` points to.
   *
   * @throws RangeError for a limit outside 1 to 100.
   * @throws TypeError when `fields` does not hold the relation and one source key, or names a missing field.
   */
  async through<
    M extends object,
    R extends Extract<keyof M, string>,
    const F extends Readonly<Record<string, readonly string[]>>,
  >(model: AnyClass<M>, relation: R, options: GraphOptions<M, F>): Promise<GraphRow<M, R, F>[]> {
    const limit = options.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
      throw new RangeError(
        `GraphQuery: limit is a whole number from 1 to ${MAX_LIMIT}, got ${limit}`,
      );
    const keys = Object.keys(options.fields);
    const source = keys.find((key) => key !== relation);
    if (keys.length !== 2 || source === undefined || !keys.includes(relation))
      throw new TypeError(`GraphQuery: fields names the source and "${relation}", nothing else`);
    const em = Database.current().em();
    const rows = await em.find(
      model,
      await visibleFilter(model, options.where ?? ({} as Where<M>)),
      {
        limit,
      },
    );
    for (const row of rows) checkFields(row, options.fields[source] ?? [], source);
    const values = rows.map((row) => (row as Record<string, unknown>)[relation]);
    // Batched like a DataLoader: one read per linked model, one populate for references, then `load()` reads nothing.
    const links = values.filter((value): value is Link<{ id: string }> => value instanceof Link);
    if (links.length > 0) await Link.loadMany(links);
    const referencing = rows.filter(
      (_, index) =>
        values[index] !== null && values[index] !== undefined && !(values[index] instanceof Link),
    );
    if (referencing.length > 0) await em.populate(referencing, [relation] as never);
    return Promise.all(
      rows.map(async (row, index) => {
        const value = values[index] as { load: () => Promise<object> } | null | undefined;
        const related = value === null || value === undefined ? null : await value.load();
        if (related !== null) checkFields(related, options.fields[relation] ?? [], relation);
        return { [source]: row, [relation]: related } as GraphRow<M, R, F>;
      }),
    );
  }
}
