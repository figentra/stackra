/**
 * Stackra file contract:
 * Purpose: `GoogleProjectState`, what Google answers for a project id: ours (the federated identity can use it),
 *          missing (free to create) or taken (it exists under someone else, so another id must be chosen).
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 5).
 */
import { Enum } from "@stackra/contracts";

/** One case per answer. */
export const GoogleProjectState = Enum.of({
  /** The project exists and Runway can use it. */
  Ours: "ours",
  /** No project has the id. */
  Missing: "missing",
  /** Another owner holds the id. */
  Taken: "taken",
});

/** One of the codes above. */
export type GoogleProjectState = Enum.Value<typeof GoogleProjectState>;
