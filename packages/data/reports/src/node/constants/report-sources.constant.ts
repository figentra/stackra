/**
 * Stackra file contract:
 * Purpose: `REPORT_SOURCES`, each report class's source model, since the `Report<Source>` type argument is gone at
 *          run time.
 * Boundary: internal; written only by `registerReportSources` (called by generated wiring) and read by the report
 *           runner, which walks a class's ancestors so an override keeps its base's source.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 5: partners by type argument); ADR 0470 (decision 1).
 */
import type { AnyClass } from "@stackra/container";

/** Report class to source model. */
export const REPORT_SOURCES = new WeakMap<object, AnyClass>();
