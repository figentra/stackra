/**
 * Stackra file contract:
 * Purpose: `pruneRecords(model, now)`, the retention step of one model in the running scope: rows whose `Retention`
 *          `basis` date is older than `keep` are archived, soft-deleted or deleted for good by its policy, and rows of a
 *          `SoftDeletes` model soft-deleted more than 30 days ago are deleted for good (ADR 0189 decision 4).
 * Boundary: runs on the running context's entity manager, so row-level security limits it to the session's scope (the
 *           `record.prune` job runs once per scope). Deletes go in keyset chunks by primary key; each chunk asks the
 *           connected `HoldRegistry` with `Disposal.Retention` and the rows' registered subject links, and a held row
 *           stays. Archiving and soft-deleting keep the row, so they ask no hold. Every statement goes through
 *           `watchedNativeWrite`, so the outbox change feed sees the rows.
 * Runtime: node
 * Governing contract: ADR 0134 (decisions 3 and 4, and its 2026-10-24 amendment: every disposal path asks the
 *                     registry); ADR 0189 (decision 4); data-layer gaps gov4 and mo27.
 */
import type { AnyClass } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { traitsOf } from "@stackra/model";
import type { RetentionOptions } from "@stackra/model";

import { HOLD_LINK_FIELDS } from "#core/constants/hold-link-fields.constant";
import { SOFT_DELETE_RETENTION } from "#core/constants/soft-delete-retention.constant";
import { disposableIds } from "#core/functions/disposable-ids.function";
import { holdLinksOf } from "#core/functions/hold-links-of.function";
import { stampFields } from "#core/functions/stamp-fields.function";
import { watchedNativeWrite } from "#core/functions/watched-native-write.function";
import { Database } from "#core/ports/database.port";
import type { PruneReport } from "#core/types/prune-report.type";
import { Disposal } from "#contracts/enums/disposal.enum";

/** Rows one delete chunk reads. */
const CHUNK = 500;

/** A delete reaches soft-deleted and archived rows too. */
const ALL_ROWS = Object.freeze({ deleted: false, archived: false });

/** The field and trait each keeping policy writes. */
const KEPT = Object.freeze({
  soft: { field: "deletedAt", trait: "soft_deletes", filter: "deleted" },
  archive: { field: "archivedAt", trait: "archivable", filter: "archived" },
});

/** The instant `keep` before `now`. */
function before(now: Date, keep: Duration): Date {
  return new Date(now.getTime() - Duration.toMilliseconds(keep));
}

/** Deletes the rows of `model` matching `where` in keyset chunks, held rows kept. */
async function purgeChunked(
  model: AnyClass,
  where: object,
  chunk: number,
): Promise<{ readonly purged: number; readonly held: number }> {
  const em = Database.current().em();
  const [key = "id"] = em.getMetadata(model).primaryKeys;
  const fields = [key, ...(HOLD_LINK_FIELDS.get(model) ?? [])];
  let after: string | undefined;
  let purged = 0;
  let held = 0;
  for (;;) {
    const page = after === undefined ? where : { $and: [where, { [key]: { $gt: after } }] };
    const rows = (await em.find(model, page as never, {
      fields: fields as never,
      orderBy: { [key]: "asc" } as never,
      limit: chunk,
      filters: ALL_ROWS,
    })) as Record<string, unknown>[];
    if (rows.length === 0) break;
    const ids = rows.map((row) => String(row[key]));
    const free = await disposableIds(model, ids, Disposal.Retention, holdLinksOf(model, rows, key));
    held += ids.length - free.length;
    if (free.length > 0)
      purged += await watchedNativeWrite(
        {
          em,
          model,
          kind: "deleted",
          fields: [],
          filter: { [key]: { $in: free } },
          filters: ALL_ROWS,
        },
        (filter) => em.nativeDelete(model, filter as never, { filters: ALL_ROWS }),
      );
    after = ids.at(-1);
    if (rows.length < chunk) break;
  }
  return { purged, held };
}

/**
 * Applies `model`'s retention at `now` in the running scope.
 *
 * @throws TypeError when a `soft` or `archive` policy lacks the `SoftDeletes` or `Archivable` trait it writes.
 * @example
 * const report = await pruneRecords(AiThread, new Date());
 */
export async function pruneRecords(
  model: AnyClass,
  now: Date,
  options: { readonly chunk?: number } = {},
): Promise<PruneReport> {
  const chunk = options.chunk ?? CHUNK;
  const traits = traitsOf(model);
  const names = new Set(traits.map((trait) => trait.name));
  const retention = traits.find((trait) => trait.name === "retention")?.options as
    | RetentionOptions
    | undefined;
  let expired = 0;
  let purged = 0;
  let held = 0;
  if (retention !== undefined) {
    const where = { [retention.basis]: { $lt: before(now, retention.keep) } };
    if (retention.policy === "hard") {
      const result = await purgeChunked(model, where, chunk);
      purged += result.purged;
      held += result.held;
    } else {
      const kept = KEPT[retention.policy];
      if (!names.has(kept.trait))
        throw new TypeError(
          `${model.name} keeps expired rows by "${retention.policy}" but lacks the ${kept.trait} trait`,
        );
      const em = Database.current().em();
      const filters = { [kept.filter]: false };
      expired += await watchedNativeWrite(
        {
          em,
          model,
          kind: "updated",
          fields: [kept.field],
          filter: { $and: [where, { [kept.field]: null }] },
          filters,
        },
        (filter) =>
          em.nativeUpdate(
            model,
            filter as never,
            { ...stampFields(model, "update"), [kept.field]: now } as never,
            { filters },
          ),
      );
    }
  }
  if (names.has("soft_deletes")) {
    const result = await purgeChunked(
      model,
      { deletedAt: { $lt: before(now, SOFT_DELETE_RETENTION) } },
      chunk,
    );
    purged += result.purged;
    held += result.held;
  }
  return { model: model.name, expired, purged, held };
}
