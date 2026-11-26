/**
 * Stackra file contract:
 * Purpose: `MemoryEntries`, the memory repository the `Journal` tests share: the entries of one model in memory, unique
 *          on the model's (account, reference) index as Postgres keeps it, answering the filters the journal sends
 *          (equality, `$lt`, `$in`, `$or`) and its `find`, `findOne`, `count`, `sum` and `insert` calls.
 * Boundary: test fixture only; nothing here reaches a database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0220 (decisions 4 and 5).
 */
import { UniqueViolation } from "@stackra/database";

/** A stored row. */
type Row = Record<string, unknown>;

/** Whether `row` matches `filter`: equality, `$lt`, `$in` and `$or`, the filters the journal sends. */
function matches(row: Row, filter: Row): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return (expected as Row[]).some((branch) => matches(row, branch));
    const actual = row[key];
    if (expected !== null && typeof expected === "object" && !(expected instanceof Date)) {
      const operator = expected as { readonly $lt?: Date; readonly $in?: readonly unknown[] };
      if (operator.$lt !== undefined) return (actual as Date).getTime() < operator.$lt.getTime();
      if (operator.$in !== undefined) return operator.$in.includes(actual);
    }
    return actual === expected;
  });
}

/** A sortable form of a stored value. */
function rankOf(value: unknown): number | string {
  return value instanceof Date ? value.getTime() : String(value);
}

/** The entries of one model in memory, unique on (account field, reference field) as the model's index is. */
export class MemoryEntries {
  readonly rows: Row[] = [];

  /** The account and reference fields of the unique index. */
  private readonly unique: readonly [string, string];

  constructor(account: string, reference = "reference") {
    this.unique = [account, reference];
  }

  async find(where: Row, options?: { readonly orderBy?: Row }): Promise<Row[]> {
    const keys = Object.keys(options?.orderBy ?? {});
    return this.rows
      .filter((row) => matches(row, where))
      .sort((a, b) => {
        for (const key of keys) {
          const [left, right] = [rankOf(a[key]), rankOf(b[key])];
          if (left !== right) return left < right ? -1 : 1;
        }
        return 0;
      });
  }

  async findOne(where: Row): Promise<Row | null> {
    return this.rows.find((row) => matches(row, where)) ?? null;
  }

  async count(where: Row): Promise<number> {
    return this.rows.filter((row) => matches(row, where)).length;
  }

  async sum(field: string, where: Row): Promise<number> {
    return this.rows
      .filter((row) => matches(row, where))
      .reduce((total, row) => total + Number(row[field]), 0);
  }

  async insert(data: Row): Promise<Row> {
    const [account, reference] = this.unique;
    if (
      this.rows.some((row) => row[account] === data[account] && row[reference] === data[reference])
    )
      throw new UniqueViolation(new Error("duplicate key value violates unique constraint"));
    this.rows.push(data);
    return data;
  }
}
