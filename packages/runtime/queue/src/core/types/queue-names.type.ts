/**
 * Stackra file contract:
 * Purpose: `QueueNames<N>`, what `queues(names)` returns for a tuple of queue names: an enum whose case names are the
 *          names in PascalCase (`bulk_import` is `BulkImport`) and whose codes are the names.
 * Boundary: a type only, built on `Enum.Of`, so `Enum.values(Queues)` and `Enum.Value<typeof Queues>` work on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 28: the job's queue is typed, `Queues.*`); ADR 0294 (decision 16: enums).
 */
import type { Enum } from "@stackra/contracts";

/** A snake_case name in PascalCase. */
type PascalCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Capitalize<Head>}${PascalCase<Tail>}`
  : Capitalize<S>;

/** The queue enum of the names `N`. */
export type QueueNames<N extends readonly string[]> = Enum.Of<{
  readonly [Name in N[number] as PascalCase<Name>]: Name;
}>;
