/**
 * Stackra file contract:
 * Purpose: `RepositoryPersonalDataStoreDriver`, the `repository` driver of `PersonalDataStore` and the default: reads
 *          and disposes of a subject's rows through the database's `repositoryOf(model)` service, inside the running
 *          step's or action's unit of work.
 * Boundary: works on any registered model without per-model code: the repository token of `repositoryOf` is a plain
 *           `CrudService` with no dependencies, so it is built here per call. `remove` goes through `purge`, which
 *           consults the `HoldRegistry` once more; `anonymise` changes each row with `update`, written when the
 *           caller's unit of work commits. Row-level security keeps every read inside the running scope. Rows are keyed
 *           by `id`, the house primary key.
 * Runtime: node
 * Governing contract: ADR 0189 (decisions 1, 2 and 4); ADR 0134 (legal holds); ADR 0294 (decision 16); STA-1375.
 */
import type { AnyClass } from "@stackra/container";
import { Driver } from "@stackra/container";
import type { CrudService } from "@stackra/database";
import { repositoryOf } from "@stackra/database";
import type { Where } from "@stackra/database/contracts";

import { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import type { SubjectRecord } from "#contracts/types/subject-record.type";

/** A row as the driver reads it. */
type Row = Record<string, unknown>;

/** The repository of `model`, typed loosely: the driver handles every declared model alike. */
function rowsOf(model: AnyClass): CrudService<Row> {
  const Token = repositoryOf(model as AnyClass<Row>) as unknown as new () => CrudService<Row>;
  return new Token();
}

/**
 * Reads and disposes of rows through the database.
 *
 * @example
 * // config/privacy.ts: store: "repository" (the default)
 */
export class RepositoryPersonalDataStoreDriver extends Driver(PersonalDataStore) {
  /** The subject's rows of `model`, with only `fields` copied. */
  async find(
    model: AnyClass,
    subjectField: string,
    subject: string,
    fields: readonly string[],
  ): Promise<SubjectRecord[]> {
    const rows = await rowsOf(model).find({ [subjectField]: subject } as Where<Row>);
    return rows.map((row: Row) => ({
      id: String(row["id"]),
      fields: Object.fromEntries(fields.map((field) => [field, row[field] ?? null])),
    }));
  }

  /** Deletes the rows with these ids that no legal hold covers. */
  async remove(model: AnyClass, ids: readonly string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return rowsOf(model).purge({ id: { $in: [...ids] } } as Where<Row>);
  }

  /** Sets `fields` to null on each row with these ids, written when the caller's unit of work commits. */
  async anonymise(
    model: AnyClass,
    ids: readonly string[],
    fields: readonly string[],
  ): Promise<number> {
    const rows = rowsOf(model);
    const blank = Object.fromEntries(fields.map((field) => [field, null]));
    for (const id of ids) await rows.update({ id } as Where<Row>, blank);
    return ids.length;
  }
}
