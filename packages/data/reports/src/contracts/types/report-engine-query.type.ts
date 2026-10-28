/**
 * Stackra file contract:
 * Purpose: `ReportEngineQuery`, one run handed to a `ReportEngine`: the report's declaration, its source model, the
 *          caller's request and the time zone time grains bucket in.
 * Boundary: a type only. `ReportRunner` builds it from the report class (its `report` kind record), the source model
 *           generated wiring registers, and the running call (UTC outside a call). An engine maps the source to its own
 *           store (a table through the generated metadata, a warehouse table of the same model).
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 3 and 8); ADR 0305 (rule 5: the partner is the type argument).
 */
import type { AnyClass } from "@stackra/container";

import type { ReportEngineDeclaration } from "#contracts/types/report-engine-declaration.type";
import type { ReportEngineRequest } from "#contracts/types/report-engine-request.type";

/** One report run. */
export interface ReportEngineQuery {
  /** The report's checked declaration. */
  readonly declaration: ReportEngineDeclaration;

  /** The source model class. */
  readonly source: AnyClass;

  /** What the caller asks for. */
  readonly request: ReportEngineRequest;

  /** The call's IANA time zone. */
  readonly timeZone: string;
}
