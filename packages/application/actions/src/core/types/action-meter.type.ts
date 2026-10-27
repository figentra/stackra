/**
 * Stackra file contract:
 * Purpose: `ActionMeter`, an action's `meter` option: the meter its applied calls feed, how they aggregate, and the
 *          input field the value comes from.
 * Boundary: a type only. The pipeline writes one `usage.recorded` event per applied call through the outbox, in the
 *           action's unit of work, so a metered call cannot commit without its usage (ADR 0216 decision 4). The field
 *           holds a number of units or a Money (`minor` is read) for `sum`, `max` and `last`, and any string or number
 *           for `unique`; `count` needs none. Quotas and prices per meter are data in the usage service, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 1, 2 and 4).
 */
import type { MeterKind } from "@stackra/contracts";

/** A metered action's meter. */
export interface ActionMeter {
  /** The meter's name, dotted snake_case (`messages.sent`). */
  readonly name: string;

  /** How the usage aggregates. */
  readonly kind: MeterKind;

  /** The input field the value is read from; required for every kind but `count`. */
  readonly field?: string;
}
