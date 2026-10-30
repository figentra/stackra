/**
 * Stackra file contract:
 * Purpose: `ResourceSize`, the named sizes a resource or a workload picks per environment; each kind's catalogue maps a
 *          size to AWS classes, capacity and a monthly estimate. An environment a block does not size runs `small`.
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3).
 */
import { Enum } from "@stackra/contracts";

/** One case per size, smallest first. */
export const ResourceSize = Enum.of({
  /** The default; dev runs it unless a block says otherwise. */
  Small: "small",
  /** Staging-sized. */
  Medium: "medium",
  /** Production-sized. */
  Large: "large",
});

/** One of the codes above. */
export type ResourceSize = Enum.Value<typeof ResourceSize>;
