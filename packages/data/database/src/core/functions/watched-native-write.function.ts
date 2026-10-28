/**
 * Stackra file contract:
 * Purpose: `watchedNativeWrite`, how every native write of a model (a `CrudService` verb, the retention job) reaches
 *          the connected `NativeWriteWatcher`: when the watcher watches the model, it reads the matching ids first,
 *          narrows the statement to them (so a row inserted after the read is never written unreported) and reports
 *          them after it; otherwise it runs the statement on the filter alone, with no read.
 * Boundary: runs on `em`, inside its transaction; the watcher writes on the same entity manager. `filters` are the
 *           ORM filter switches the statement itself uses, so the read sees the same rows.
 * Runtime: node
 * Governing contract: data-layer gap mo10 (native writes reach the change feed); ADR 0078 (decision 4).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import type { AnyClass } from "@stackra/container";

import { NATIVE_WRITE_HOST } from "#core/constants/native-write-host.constant";
import type { NativeWrite } from "#core/types/native-write.type";

/** One native write to run. */
interface WatchedWrite {
  /** The entity manager whose transaction runs it. */
  readonly em: EntityManager;
  /** The written model. */
  readonly model: AnyClass;
  /** How the rows change. */
  readonly kind: NativeWrite["kind"];
  /** The fields it sets; none for a delete. */
  readonly fields: readonly string[];
  /** The rows it reaches. */
  readonly filter: object;
  /** The ORM filter switches of the statement. */
  readonly filters?: Readonly<Record<string, boolean>>;
}

/**
 * Runs `write` over `filter`, reporting the rows when the model is watched.
 *
 * @returns the statement's count; 0 without running it when a watched read matched nothing.
 * @example
 * await watchedNativeWrite({ em, model, kind: "updated", fields: ["hits"], filter }, (narrowed) =>
 *   em.nativeUpdate(model, narrowed, data),
 * );
 */
export async function watchedNativeWrite(
  target: WatchedWrite,
  write: (filter: object) => Promise<number>,
): Promise<number> {
  const { em, model, filter, filters } = target;
  const watcher = NATIVE_WRITE_HOST.watcher;
  if (watcher === undefined || !watcher.watches(model)) return write(filter);
  const [key = "id"] = em.getMetadata(model).primaryKeys;
  const rows = (await em.find(model, filter as never, {
    fields: [key] as never,
    ...(filters === undefined ? {} : { filters }),
  })) as Record<string, unknown>[];
  const ids = rows.map((row) => String(row[key]));
  if (ids.length === 0) return 0;
  const count = await write({ $and: [filter, { [key]: { $in: ids } }] });
  await watcher.written({ em, model, kind: target.kind, ids, fields: target.fields });
  return count;
}
