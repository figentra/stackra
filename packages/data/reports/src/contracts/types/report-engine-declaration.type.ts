/**
 * Stackra file contract:
 * Purpose: `ReportEngineDeclaration`, a report's checked declaration as an engine reads it: the written key, the
 *          dimensions and measures by name, and the default filter.
 * Boundary: a type only, engine-neutral; a core `ReportDeclaration` is assignable to it. Nothing outside it can be
 *           grouped, filtered or measured (ADR 0470 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 2 and 8); ADR 0294 (decision 15: the leaf entry).
 */
import type { Json } from "@stackra/contracts";

import type { ReportEngineDimension } from "#contracts/types/report-engine-dimension.type";
import type { ReportEngineMeasure } from "#contracts/types/report-engine-measure.type";

/** What a report declares. */
export interface ReportEngineDeclaration {
  /** The written key (`order_sales`). */
  readonly key: string;

  /** The dimensions by name. */
  readonly dimensions: Readonly<Record<string, ReportEngineDimension>>;

  /** The measures by name. */
  readonly measures: Readonly<Record<string, ReportEngineMeasure>>;

  /** Source path to a table filter value, always applied; `{}` when none. */
  readonly defaultFilter: Readonly<Record<string, Json>>;
}
