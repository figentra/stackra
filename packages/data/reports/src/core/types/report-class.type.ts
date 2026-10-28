/**
 * Stackra file contract:
 * Purpose: `ReportClass<S>`, the class a `Report<S>({...})` call returns and a report extends: what the runner and
 *          the generated query take to name a report.
 * Boundary: a type only; the source type is gone at runtime (gen reads it from the heritage clause).
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 1); ADR 0305 (rule 5: the partner is the type argument).
 */
import type { ReportBase } from "#core/bases/report-base.base";

/** A report class. */
export type ReportClass<S extends object = object> = abstract new () => ReportBase<S>;
