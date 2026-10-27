/**
 * Stackra file contract:
 * Purpose: `MemoryPersonalDataStoreDriver`, the `memory` driver of `PersonalDataStore`: rows of each model kept in a
 *          map, for tests, previews and `store: "memory"`.
 * Boundary: holds plain row objects with a string `id`; `put` seeds them. Copies only the asked fields on `find`, so
 *           it behaves like the repository driver. Not durable.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver ships with the production one); ADR 0294 (decision 16);
 *                     STA-1375.
 */
import type { AnyClass } from "@stackra/container";
import { Driver } from "@stackra/container";

import { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import type { SubjectRecord } from "#contracts/types/subject-record.type";

/** A stored row: an id and any fields. */
type Row = { id: string } & Record<string, unknown>;

/**
 * Keeps rows in memory.
 *
 * @example
 * const store = new MemoryPersonalDataStoreDriver();
 * store.put(Customer, [{ id: "cus_1", userId: "usr_1", name: "Lina" }]);
 */
export class MemoryPersonalDataStoreDriver extends Driver(PersonalDataStore) {
  /** The rows of each model. */
  private readonly rows = new Map<AnyClass, Row[]>();

  /** Adds `rows` to `model`'s table. */
  put(model: AnyClass, rows: readonly Row[]): void {
    this.rows.set(model, [...this.table(model), ...rows.map((row) => ({ ...row }))]);
  }

  /** A copy of `model`'s rows, for assertions. */
  all(model: AnyClass): Row[] {
    return this.table(model).map((row) => ({ ...row }));
  }

  /** The subject's rows of `model`, with only `fields` copied. */
  async find(
    model: AnyClass,
    subjectField: string,
    subject: string,
    fields: readonly string[],
  ): Promise<SubjectRecord[]> {
    return this.table(model)
      .filter((row) => row[subjectField] === subject)
      .map((row) => ({
        id: row.id,
        fields: Object.fromEntries(fields.map((field) => [field, row[field] ?? null])),
      }));
  }

  /** Deletes the rows with these ids. */
  async remove(model: AnyClass, ids: readonly string[]): Promise<number> {
    const before = this.table(model);
    const kept = before.filter((row) => !ids.includes(row.id));
    this.rows.set(model, kept);
    return before.length - kept.length;
  }

  /** Sets `fields` to null on the rows with these ids. */
  async anonymise(
    model: AnyClass,
    ids: readonly string[],
    fields: readonly string[],
  ): Promise<number> {
    let changed = 0;
    for (const row of this.table(model))
      if (ids.includes(row.id)) {
        for (const field of fields) row[field] = null;
        changed += 1;
      }
    return changed;
  }

  /** The live table of `model`. */
  private table(model: AnyClass): Row[] {
    return this.rows.get(model) ?? [];
  }
}
