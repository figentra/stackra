/**
 * Stackra file contract:
 * Purpose: `warehousePath`, the file key of a warehouse batch in the Hive layout BI tools and query engines read as
 *          partitions: `<prefix>/scope=<scope id>/model=<model>/dt=<day>/<first position>-<last position>.parquet`.
 * Boundary: a pure function. A platform write (no scope) goes under `scope=_platform`. Each segment is URI-encoded, so
 *           an opaque position cannot add a path level. The key depends only on the batch, so writing a batch again
 *           replaces its file.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the warehouse sink); ADR 0323 (scope, not tenant,
 *                     names the partition).
 */
import type { WarehouseBatch } from "#contracts/types/warehouse-batch.type";

/**
 * The file key of `batch` under `prefix`.
 *
 * @throws TypeError when the batch has no records.
 * @example
 * warehousePath("warehouse", batch); // "warehouse/scope=scp_1/model=Product/dt=2026-10-29/7-42.parquet"
 */
export function warehousePath(prefix: string, batch: WarehouseBatch): string {
  const first = batch.records[0];
  const last = batch.records.at(-1);
  if (first === undefined || last === undefined)
    throw new TypeError(`A warehouse batch of ${batch.model} has no records`);
  const segments = [
    `scope=${encodeURIComponent(batch.scope?.id ?? "_platform")}`,
    `model=${encodeURIComponent(batch.model)}`,
    `dt=${encodeURIComponent(batch.day)}`,
    `${encodeURIComponent(first.position)}-${encodeURIComponent(last.position)}.parquet`,
  ];
  const root = prefix.replace(/\/+$/u, "");
  return root === "" ? segments.join("/") : `${root}/${segments.join("/")}`;
}
