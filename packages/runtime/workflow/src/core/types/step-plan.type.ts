/**
 * Stackra file contract:
 * Purpose: `StepPlan`, one step as the engine runs it: its name, its checked options with durations in milliseconds,
 *          the key of the signal it waits for, its retry budget and its undo's method name.
 * Boundary: a type only, internal; `planOf` builds it once per class.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 18).
 */
import type { AnyClass } from "@stackra/container";
import type { Backoff } from "@stackra/queue";

import type { Signal } from "#core/bases/signal.base";

/** One step of a plan. */
export interface StepPlan {
  /** The method name. */
  readonly name: string;

  /** The steps that must be done first. */
  readonly after: readonly string[];

  /** Its condition. */
  readonly when?: (run: never) => boolean;

  /** The longest gap between two heartbeats, in milliseconds. */
  readonly heartbeat?: number;

  /** Attempts in all. */
  readonly attempts: number;

  /** The wait between two attempts. */
  readonly backoff: Backoff;

  /** The signal class it waits for. */
  readonly waitFor?: AnyClass<Signal>;

  /** That signal's key. */
  readonly signal?: string;

  /** Its correlation, from the run. */
  readonly correlate?: (run: never) => string | object;

  /** The wait's (or one attempt's) limit, in milliseconds. */
  readonly timeout?: number;

  /** The method that undoes it. */
  readonly undo?: string;
}
