/**
 * Stackra file contract:
 * Purpose: `visibleRequest(request, hidden)`, a report request without the columns its caller may not see:
 *          hidden dimensions, measures, sort keys and pivot axes are dropped, and a filter on a hidden dimension is
 *          refused, since a filtered total would measure what the caller may not read.
 * Boundary: pure. Dropping a dimension merges its groups, so nothing about its values is returned; a pivot left
 *           without dimensions is dropped. A request whose every measure is hidden is refused like any permission
 *           refusal (`ForbiddenError`, no reason). The default filter is the report's own and stays.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 6: the compiler drops what the caller may not see); ADR 0333 (amendment:
 *                     counts and aggregates over hidden fields).
 */
import { ForbiddenError } from "@stackra/errors";

import type { ReportRequest } from "#core/types/report-request.type";

/**
 * `request` without the names in `hidden`.
 *
 * @throws ForbiddenError when it filters on a hidden dimension or every measure it names is hidden.
 * @example
 * visibleRequest(request, hiddenReportColumns(declaration, held));
 */
export function visibleRequest(request: ReportRequest, hidden: ReadonlySet<string>): ReportRequest {
  if (hidden.size === 0) return request;
  if (Object.keys(request.filters ?? {}).some((name) => hidden.has(name)))
    throw ForbiddenError.create();
  const shown = (name: string): boolean => !hidden.has(name);
  const measures = request.measures.filter(shown);
  if (measures.length === 0 && request.measures.length > 0) throw ForbiddenError.create();
  const dimensions = request.dimensions.filter((dimension) => shown(dimension.name));
  const { sort, pivot, ...rest } = request;
  return {
    ...rest,
    dimensions,
    measures,
    ...(sort === undefined ? {} : { sort: sort.filter((key) => shown(key.key)) }),
    ...(pivot === undefined || dimensions.length === 0
      ? {}
      : { pivot: { rows: pivot.rows.filter(shown), columns: pivot.columns.filter(shown) } }),
  };
}
