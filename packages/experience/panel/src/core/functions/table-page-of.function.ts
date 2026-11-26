/**
 * Stackra file contract:
 * Purpose: `tablePageOf(data)`, one answer of a resource's list query (`CrudService.table`'s page) as a table reads it:
 *          the rows with their ids, the cursor of the next page when there is one, and the count when it carries one.
 * Boundary: internal: pure; the web and native resource tables hand it to the collection engine. A row without an id
 *           takes its place as its id.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 2); ADR 0505 (one data family).
 */
import type { TableRow } from "#core/types/table-row.type";

/**
 * The page `data` holds.
 *
 * @example
 * tablePageOf({ items: [{ id: "ord_1" }], hasMore: true, nextCursor: "c2" }).nextCursor; // "c2"
 */
export function tablePageOf(data: unknown): {
  readonly rows: TableRow[];
  readonly nextCursor: string | null;
  readonly count?: { readonly value: number; readonly capped: boolean } | undefined;
} {
  const page = (data ?? {}) as {
    readonly items?: readonly Readonly<Record<string, unknown>>[];
    readonly nextCursor?: string;
    readonly hasMore?: boolean;
    readonly count?: { readonly value: number; readonly capped: boolean };
  };
  return {
    rows: (page.items ?? []).map((item, index) => ({ ...item, id: String(item["id"] ?? index) })),
    nextCursor: page.hasMore === true ? (page.nextCursor ?? null) : null,
    count: page.count,
  };
}
