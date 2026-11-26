/**
 * Stackra file contract:
 * Purpose: `BackfillClass`, the class `extends Backfill({ ... })` produces, and what `runBackfill` and `backfill` take.
 * Boundary: a type only; a concrete backfill has no constructor parameters.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 25: kind bases); ADR 0159 (decision 3).
 */
import type { BackfillBase } from "#core/bases/backfill-base.base";

/** A backfill class. */
export type BackfillClass = new () => BackfillBase;
