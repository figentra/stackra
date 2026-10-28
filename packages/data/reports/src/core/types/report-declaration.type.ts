/**
 * Stackra file contract:
 * Purpose: `ReportDeclaration`, the checked, frozen options a `Report` class records in the kind registry, which
 *          `ReportBase.declaration` returns and the report compiler reads.
 * Boundary: a type only; the shape `Report({...})` returns from its option reader. Named "declaration" because a
 *           user-saved `ReportDefinition` (ADR 0470 decision 5) is a different, later thing.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 1 and 2).
 */
import type { Json } from "@stackra/contracts";

import type { ReportDimension } from "#core/types/report-dimension.type";
import type { ReportMeasure } from "#core/types/report-measure.type";

/** A report's checked options. */
export interface ReportDeclaration {
  /** The written key. */
  readonly key: string;

  /** The dimensions by name. */
  readonly dimensions: Readonly<Record<string, ReportDimension>>;

  /** The measures by name. */
  readonly measures: Readonly<Record<string, ReportMeasure>>;

  /** The default filter; `{}` when none. */
  readonly defaultFilter: Readonly<Record<string, Json>>;

  /** The permission as written; absent when none. */
  readonly permission?: unknown;
}
