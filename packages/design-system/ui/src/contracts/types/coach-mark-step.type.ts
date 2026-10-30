/**
 * Stackra file contract:
 * Purpose: `CoachMarkStep`, one stop of a `CoachMark` tour: the element it spotlights and the words of its callout.
 * Boundary: a type only. `TTarget` is the runtime's element: an `Element` on web, a `View` on native.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 39 (owner decision 2026-10-28).
 */
import type { ReactNode, RefObject } from "react";

/** One step of a tour. */
export interface CoachMarkStep<TTarget> {
  /** A stable id, unique in the tour. */
  readonly id: string;
  /** The element the spotlight cuts out and the callout points at. */
  readonly target: RefObject<TTarget | null>;
  /** The callout's heading, which also names it for assistive technology. */
  readonly title: string;
  /** One or two sentences: what the element does. */
  readonly description?: ReactNode;
}
