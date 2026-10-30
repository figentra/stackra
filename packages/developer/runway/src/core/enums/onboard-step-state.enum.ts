/**
 * Stackra file contract:
 * Purpose: `OnboardStepState`, where one mobile onboarding step stands: done, planned (a dry run would make the call,
 *          or a later build does it), manual (an owner step in a store portal is pending) or blocked (an earlier step
 *          is not done).
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 1), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per state. */
export const OnboardStepState = Enum.of({
  /** Nothing left to do. */
  Done: "done",
  /** A dry run would make the call, or EAS does it on the first build. */
  Planned: "planned",
  /** An owner step in a store portal is pending. */
  Manual: "manual",
  /** An earlier step is not done. */
  Blocked: "blocked",
});

/** One of the codes above. */
export type OnboardStepState = Enum.Value<typeof OnboardStepState>;
