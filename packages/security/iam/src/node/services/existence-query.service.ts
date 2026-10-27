/**
 * Stackra file contract:
 * Purpose: `ExistenceQueryService`, the existence-only query: which records of a model match a check (a conflict
 *          check's party names, a duplicate search) among those the running call's principal may see or only learn
 *          exist, answered as existence-only hits (id and model key) and nothing else.
 * Boundary: reads one column, the primary key, through the ORM's query builder, so no other field of a matching record
 *           is loaded, returned or held in the unit of work. Gives no count: at most `limit` hits (a setting the caller
 *           passes; no default here), so the answer never measures a walled set. The filter is the caller's `where`
 *           ANDed with `IamVisibilityFilterDriver.existenceConditionsFor` (`see` or `exists`, relations followed), on
 *           top of row-level security; it only narrows. A model with no `registerVisibility` row has no model key to
 *           answer with and is refused, as is a `$raw` fragment (match on fields). Showing a hit in full stays
 *           `existenceHit`'s and the caller's normal read.
 * Runtime: node
 * Governing contract: ADR 0333 (decision 2 and the existence capability, decisions 4 and 5); ADR 0160 (parameterised
 *                     SQL); STA-933; Juristra conflict checks (juristra-23, juristra-24).
 */
import type { ExtensionContext } from "@stackra/actions";
import type { ContextStorage } from "@stackra/actions/contracts";
import { type AnyClass, Service } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { Database } from "@stackra/database";
import type { Where } from "@stackra/database/contracts";

import type { SearchHit } from "#core/index";
import { VISIBILITY_REGISTRY } from "#node/constants/visibility-registry.constant";
import type { IamVisibilityFilterDriver } from "#node/drivers/iam-visibility-filter.driver";

/** An existence-only hit: the record's id and model key, nothing else. */
type ExistenceHit = Extract<SearchHit<never>, { readonly kind: "exists" }>;

/**
 * Answers whether records match without revealing them.
 *
 * @example
 * const hits = await existence.matching(Party, { normalizedName: name }, { limit: settings.conflictHitLimit });
 * if (hits.length > 0) raiseConflict(hits); // [{ kind: "exists", id: "mat_…", model: "practice.matter" }]
 */
export class ExistenceQueryService extends Service {
  /** The visibility conditions of the `see` and `exists` capabilities. */
  private readonly filter: IamVisibilityFilterDriver;

  /** The running call: its principal. */
  private readonly context: ContextStorage;

  /**
   * @param filter - the visibility filter driver.
   * @param context - the running call's context.
   */
  constructor(filter: IamVisibilityFilterDriver, context: ContextStorage) {
    super();
    this.filter = filter;
    this.context = context;
  }

  /**
   * The existence-only hits of the records of `model` matching `where`, at most `options.limit` of them.
   *
   * @throws TypeError when `model` has no `registerVisibility` row, `where` carries `$raw`, or `limit` is not a
   *         positive integer.
   * @throws Error as `IamVisibilityFilterDriver.conditionsFor` does (a cycle of follows, an unreachable source).
   */
  async matching<M extends object>(
    model: AnyClass<M>,
    where: Where<M>,
    options: { readonly limit: number },
  ): Promise<readonly ExistenceHit[]> {
    const entry = VISIBILITY_REGISTRY.get(model);
    if (entry === undefined)
      throw new TypeError(`existence query: registerVisibility has no row for ${model.name}`);
    if (typeof where === "object" && where !== null && "$raw" in where)
      throw new TypeError("existence query: match on fields, not a $raw fragment");
    if (!Number.isInteger(options.limit) || options.limit < 1)
      throw new TypeError("existence query: limit must be a positive integer");
    const call = this.context.current() as ExtensionContext | undefined;
    const visible = await this.filter.existenceConditionsFor(model, call?.actor);
    const em = Database.current().em();
    const [key = "id"] = em.getMetadata(model).primaryKeys;
    const filter = Reflect.ownKeys(visible).length === 0 ? where : { $and: [where, visible] };
    const rows = (await em
      .createQueryBuilder(model, "hit")
      .select(key as never)
      .where(filter as never)
      .limit(options.limit)
      .execute("all")) as readonly Record<string, unknown>[];
    return rows.map((row) => ({ kind: "exists", id: row[key] as PublicId, model: entry.row.key }));
  }
}
