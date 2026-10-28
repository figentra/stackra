/**
 * Stackra file contract:
 * Purpose: `ReportOptions<S>`, what `Report<S>({...})` takes: the written key, the named dimensions and measures, an
 *          optional default filter applied to every run, and the permission that reads it.
 * Boundary: a type only. Names are camelCase; the key is snake_case words joined by dots (the manifest key is
 *           `<module>.<key>`). The default filter is constant field-to-value data, never an expression.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 1 and 2); ADR 0154 (no tenant code or SQL).
 */
import type { Json } from "@stackra/contracts";

import type { ReportDimension } from "#core/types/report-dimension.type";
import type { ReportMeasure } from "#core/types/report-measure.type";
import type { ReportPath } from "#core/types/report-path.type";

/** The options of a report. */
export interface ReportOptions<S = Record<string, unknown>> {
  /** The written key (`order_sales`): snake_case words joined by dots. */
  readonly key: string;

  /** The dimensions by name; at least one. */
  readonly dimensions: Readonly<Record<string, ReportDimension<S>>>;

  /** The measures by name; at least one. */
  readonly measures: Readonly<Record<string, ReportMeasure<S>>>;

  /** Field path to value, applied to every run before the caller's filters (`{ status: "paid" }`). */
  readonly defaultFilter?: Readonly<Partial<Record<ReportPath<S>, Json>>>;

  /** A `Permissions` static (`OrderPermissions.report`) that reads the report; gen records its key. */
  readonly permission?: unknown;
}
