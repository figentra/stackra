/**
 * Stackra file contract:
 * Purpose: `ReportPath<S>`, a field path of a report's source: a field of `S` (`"placedAt"`), or a path that follows
 *          one of its relations or `Link<T>` fields into the target (`"customer.country"`).
 * Boundary: a type only. The first segment is checked against `S` here; the rest of a relation path is checked by gen
 *           against the target model (`report_dimension_unknown`, `report_measure_unknown`).
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: a dimension is a declared field path, optionally across a `Link<T>`).
 */

/** A field of `S`, or a dotted path that starts at one. */
export type ReportPath<S> = (keyof S & string) | `${keyof S & string}.${string}`;
