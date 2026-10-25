/**
 * Stackra file contract:
 * Purpose: `MeterOptions`, what `@Meter` declares: the meter's key, its kind, the field it reads and its window.
 * Boundary: a type only. The key is a machine code the plan catalogue prices and the entitlements limit; a window
 *           is an ISO 8601 duration the usage service rolls up over. Which plan pays for which meter is data, never
 *           this declaration.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 1, 2 and 6).
 */
import type { Duration } from "@stackra/contracts";

import type { MeterKind } from "#core/enums/meter-kind.enum";

/** One meter a model declares. */
export interface MeterOptions {
  /** The meter's key, snake_case segments joined by dots (`matters.active`). */
  readonly key: string;

  /** How rows become usage. */
  readonly kind: MeterKind;

  /** The camelCase field a `sum`, `max`, `last` or `unique` meter reads; a `count` reads none. */
  readonly field?: string;

  /** The rolling window the usage service aggregates over (`P30D`); none for a lifetime total. */
  readonly window?: Duration;
}
