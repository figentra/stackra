/**
 * Stackra file contract:
 * Purpose: `PlanSnapshotWire`, the plan service's answer to `snapshot.get` as it travels: grants and seats in their
 *          wire form (`null` is no limit, dates as ISO text), and how long the answer may be cached.
 * Boundary: a type only; the fields `ServicePlanSnapshotsDriver` reads. `decodePlanGrants` turns a grant map into the
 *           port form.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 5); ADR 0260 (decision 3: JSON is the wire).
 */

/** One scope's plan, as the plan service sends it. */
export interface PlanSnapshotWire {
  /** Rises with every change of the plan; 0 is a scope with no plan. */
  readonly version: number;

  /** Seconds the answer may be served from a cache. */
  readonly maxAgeSeconds: number;

  /** The scope the answer is for. */
  readonly scopeId: string | null;

  /** Entitlement key to its wire grant. */
  readonly grants: Readonly<Record<string, unknown>>;

  /** Seat kind key to its wire allowance. */
  readonly seats: Readonly<Record<string, unknown>>;

  /** When the scope's paid plan began, as ISO text; null on a free plan or a trial. */
  readonly paidSince: string | null;
}
