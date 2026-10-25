/**
 * Stackra file contract:
 * Purpose: `DrillNode`, where a click on a KPI goes: a resource's list, filtered or in one of its views.
 * Boundary: a type only; built by `Drill.resource`. A filter value may be a bind (`Bind.range()`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: the display adds a drill-down).
 */
import type { AnyClass } from "@stackra/container";

/** A drill-down target. */
export interface DrillNode {
  /** A resource's list. */
  readonly kind: "resource";

  /** The resource class. */
  readonly resource: AnyClass;

  /** The preset view to open. */
  readonly view?: string;

  /** The filter values by row path. */
  readonly filter?: Readonly<Record<string, unknown>>;
}
