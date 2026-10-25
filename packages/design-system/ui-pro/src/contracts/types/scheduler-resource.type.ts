/**
 * Stackra file contract:
 * Purpose: one column owner of a `ResourceScheduler`: a member of staff, a room or a chair, with its label.
 * Boundary: types only; the caller's records.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { ReactNode } from "react";

/** A bookable resource. */
export interface SchedulerResource {
  /** The resource's id. */
  readonly id: string;
  /** Its name. */
  readonly label: ReactNode;
  /** Its name as text, for screen readers. */
  readonly labelText: string;
}
