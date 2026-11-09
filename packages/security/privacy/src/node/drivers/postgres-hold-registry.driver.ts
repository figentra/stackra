/**
 * Stackra file contract:
 * Purpose: `PostgresHoldRegistryDriver`, the `HoldRegistry` of a product outside Figentra OS: it answers from the
 *          `privacy.legal_holds` store that `PlaceHoldAction` and `ReleaseHoldAction` keep, so the product's deletes,
 *          purges, retention jobs and frozen edits skip held records with no compliance service.
 * Boundary: a driver of @stackra/database's `HoldRegistry` port. A record is held when a live hold names its model and
 *           id, or names a public id one of its subject links holds (`registerHoldLinks`). It runs in the caller's
 *           transaction. In a tenant's call it reads that tenant's holds, naming the owner as well as the policy
 *           enforcing it, so a hold stays inside its tenant. A system run (no tenant, as `maintainPartitions` runs)
 *           sees only the platform's holds directly, so it claims the live holds on its records across tenants through
 *           `privacy.claim_live_holds` (ids and owners only), then checks and logs each owner's in that owner through
 *           the `CallIsolation` the container binds, if any. A claimed hold that does not load in its owner throws
 *           `ClaimNotLoadedError`, and a tenant's hold with no isolation bound `RowIsolationMissingError`: a held
 *           record is never let go by a skip. Each refused disposal is logged to `privacy.legal_hold_refusals` in the
 *           hold's owner, as the port asks. Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: a `HoldRegistry` port); ADR 0189 (decision 4); ADR 0239
 *                     (2026-11-07 amendment, gaps A and C); ADR 0495 (decisions 1 and 2); ADR 0263 (ports and
 *                     drivers); data-layer gap gov20 (stackra-332).
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { AnyClass, Container } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { HoldRegistry } from "@stackra/database/contracts";
import type { Disposal, HoldLinks } from "@stackra/database/contracts";
import { boundIsolation, ClaimNotLoadedError, RowIsolationMissingError } from "@stackra/outbox";

/** The holds table. */
const HOLDS = '"privacy"."legal_holds"';

/** The refusal log. */
const REFUSALS = '"privacy"."legal_hold_refusals"';

/** The running call's own rows: its tenant's, or the platform's outside a tenant, as the policies write them. */
const OWN = "tenant_id is not distinct from nullif(current_setting('app.tenant_id', true), '')";

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/** A live hold and its target. */
type HoldRow = { readonly id: string; readonly model: string; readonly record_id: string };

/** A live hold claimed across tenants: its id and owner. */
type HoldClaim = { readonly id: string; readonly owner_id: PublicId<"scp"> | null };

/**
 * Runs `work` in `ownerId` (the platform's when undefined) as the hold registry's system actor, for claimed hold `id`.
 *
 * @throws RowIsolationMissingError when the hold has an owner and no isolation is bound.
 */
function inHoldOwner<T>(
  isolation: CallIsolation | undefined,
  ownerId: PublicId<"scp"> | undefined,
  id: string,
  work: () => Promise<T>,
): Promise<T> {
  if (isolation !== undefined) {
    const actor = Object.freeze({
      kind: ActorKind.System,
      id: "sys_privacy_holds",
      ...(ownerId === undefined ? {} : { scopeId: ownerId }),
    });
    return isolation.run(actor, undefined, () => work(), { readOnly: false });
  }
  if (ownerId !== undefined) return Promise.reject(RowIsolationMissingError.create({ id }));
  return work();
}

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

  /** The container, asked for the bound `CallIsolation` at call time. */
  private readonly container: Container;

  /**
   * @param database - the connected database.
   * @param container - the container, whose `CallIsolation` (when bound) runs each owner's check.
   */
  constructor(database: Database, container: Container) {
    super();
    this.database = database;
    this.container = container;
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
    const [session] = (await this.sql().execute(
      // raw-sql: whether the call runs in a tenant, as the policies read it
      "select nullif(current_setting('app.tenant_id', true), '') as owner",
      [],
    )) as readonly { readonly owner: string | null }[];
    if ((session?.owner ?? null) !== null)
      return this.heldHere(model, ids, targets, disposal, links, []);
    const claims = (await this.sql().execute(
      // raw-sql: the audited system function: the live holds on these records of every tenant, ids and owners only
      'select id, tenant_id as owner_id from "privacy"."claim_live_holds"(?::jsonb)',
      [JSON.stringify(targets)],
    )) as readonly HoldClaim[];
    const owners = new Map<PublicId<"scp"> | null, string[]>();
    for (const claim of claims)
      owners.set(claim.owner_id, [...(owners.get(claim.owner_id) ?? []), claim.id]);
    const isolation = boundIsolation(this.container);
    const held = new Set<string>();
    for (const [owner, claimed] of owners) {
      const found = await inHoldOwner(isolation, owner ?? undefined, claimed[0] ?? "", () =>
        this.heldHere(model, ids, targets, disposal, links, claimed),
      );
      for (const id of found) held.add(id);
    }
    return held;
  }

  /**
   * The ids among `ids` the running call's own live holds keep, each refusal logged there.
   *
   * @throws ClaimNotLoadedError when a hold of `claimed` does not load in this call's owner.
   */
  private async heldHere<M extends object>(
    model: AnyClass<M>,
    ids: readonly string[],
    targets: readonly string[],
    disposal: Disposal,
    links: HoldLinks | undefined,
    claimed: readonly string[],
  ): Promise<ReadonlySet<string>> {
    const rows = (await this.sql().execute(
      // raw-sql: the live holds on the records or their linked subjects, in the call's own owner
      `select id, model, record_id from ${HOLDS} where ${OWN} and released_at is null ` +
        `and record_id in (${placeholders(targets.length)})`,
      targets,
    )) as readonly HoldRow[];
    const loaded = new Set(rows.map((row) => row.id));
    const missing = claimed.find((id) => !loaded.has(id));
    if (missing !== undefined) throw ClaimNotLoadedError.create({ id: missing });
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
        // raw-sql: one log row per refused record, in the call's owner (the column's default)
        `insert into ${REFUSALS} (model, record_id, disposal, at) values ` +
          held.map(() => "(?, ?, ?, now())").join(", "),
        held.flatMap((id) => [model.name, id, disposal]),
      );
    return new Set(held);
  }

  /** The running transaction's entity manager, as raw SQL. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
