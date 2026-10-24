/**
 * Stackra file contract:
 * Purpose: `LeaderFlag`, what a method needs of the participant's leader signal: read it and set it. `electLeader`
 *          hands each method its @stackra/state signal, which has this shape.
 * Boundary: a type only, internal to the methods, so they stay plain functions a test can drive with any flag.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 6); ADR 0084 (the coordinator row).
 */

/** The participant's leader flag as a method sees it. */
export interface LeaderFlag {
  /** Whether the participant leads now. */
  get(): boolean;

  /** Records whether the participant leads. */
  set(leads: boolean): void;
}
