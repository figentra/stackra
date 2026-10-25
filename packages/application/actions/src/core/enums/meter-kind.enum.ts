/**
 * Stackra file contract:
 * Purpose: `MeterKind`, how a metered action's usage aggregates: `count` (one per call), `sum`, `max` and `last` (of a
 *          numeric input field), and `unique` (distinct values of an input field).
 * Boundary: an `Enum.of` value plus the type of the same name. The pipeline only emits one usage event per applied
 *           call; windows, rollups and quotas are the usage service's (ADR 0216 decisions 3 and 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 2: meter kinds); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The meter kinds.
 *
 * @example
 * Action({ key: "message.send", actors, meter: { name: "messages.sent", kind: MeterKind.Count } });
 */
export const MeterKind = Enum.of({
  /** One per applied call. */
  Count: "count",
  /** The total of a numeric input field. */
  Sum: "sum",
  /** The largest value of a numeric input field. */
  Max: "max",
  /** The latest value of a numeric input field. */
  Last: "last",
  /** The distinct values of an input field. */
  Unique: "unique",
});

/** One of the codes above. */
export type MeterKind = Enum.Value<typeof MeterKind>;
