/**
 * Stackra file contract:
 * Purpose: `tierPlan`, the plan a scope on one tier of a catalogue holds, as `PlanSnapshot` grants and seats: the
 *          tier's features and modules granted `true`, its limits as counts, its seats per kind, plus the add-on
 *          modules bought on top and the seats added per kind.
 * Boundary: pure; the plan service versions the result (`MemoryPlanSnapshotsDriver.load`, the OS projection). An
 *           add-on module the catalogue does not sell, or seats of a kind it does not have, is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); ADR 0215 (decisions 1, 3 and 5); ADR 0242 (decision 2).
 */
import type { PlanSnapshot } from "#contracts/types/plan-snapshot.type";
import type { PlanCatalogue } from "#core/types/plan-catalogue.type";

/**
 * The plan of `tierKey` in `catalogue`, with `addOns` modules and `extraSeats` per kind.
 *
 * @throws RangeError when the tier, an add-on module or a seat kind is not in the catalogue.
 * @example
 * snapshots.load(venue.id, tierPlan(catalogue, "pro", ["payroll"], { provider: 2 }));
 */
export function tierPlan(
  catalogue: PlanCatalogue,
  tierKey: string,
  addOns: readonly string[] = [],
  extraSeats: Readonly<Record<string, number>> = {},
): Omit<PlanSnapshot, "version"> {
  const tier = catalogue.tiers.find((held) => held.key === tierKey);
  if (tier === undefined) throw new RangeError(`tierPlan: no tier ${tierKey} in the catalogue`);
  const sold = new Set(catalogue.modules.map((module) => module.key));
  const kinds = new Set(catalogue.seatKinds.map((kind) => kind.key));
  const grants: Record<string, boolean | number> = {};
  for (const feature of tier.features) grants[feature] = true;
  for (const [key, limit] of Object.entries(tier.limits)) grants[key] = limit;
  for (const module of [...tier.modules, ...addOns]) {
    if (!sold.has(module))
      throw new RangeError(`tierPlan: module ${module} is not in the catalogue`);
    grants[module] = true;
  }
  const seats: Record<string, number> = { ...tier.seats };
  for (const [kind, extra] of Object.entries(extraSeats)) {
    if (!kinds.has(kind))
      throw new RangeError(`tierPlan: seat kind ${kind} is not in the catalogue`);
    seats[kind] = (seats[kind] ?? 0) + extra;
  }
  return Object.freeze({ grants: Object.freeze(grants), seats: Object.freeze(seats) });
}
