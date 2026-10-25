/**
 * Stackra file contract:
 * Purpose: `RouteRequest`, one model call to route: the task type, the tenant's region, the data class it carries, the
 *          tenant's strict in-region choice and opt-ins, and the tenant's own rows tried first.
 * Boundary: a type only; the region is the tenant's, fixed at sign-up, never request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 14 and 15); ADR 0156 (decision 2: tenant overrides and own keys).
 */
import type { ModelRoute } from "#core/types/model-route.type";

/** One call to route. */
export interface RouteRequest {
  /** The task type (`chat`). */
  readonly task: string;

  /** The tenant's data region. */
  readonly region: string;

  /** The most restricted data class in the call's context, if any. */
  readonly dataClass?: string;

  /** Whether the tenant chose strict in-region routing. */
  readonly strictInRegion?: boolean;

  /** The fallback jurisdictions the tenant opted in to. */
  readonly optIns?: readonly string[];

  /** The tenant's own rows (its keys), tried before the product's. */
  readonly overrides?: readonly ModelRoute[];
}
