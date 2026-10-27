/**
 * Stackra file contract:
 * Purpose: `MeterKind`, how usage aggregates, for a metered action (`meter` on `Action`) and a metered model
 *          (`@Meter`): `count` (one per call or row), `sum`, `max` and `last` (of a numeric field), and `unique`
 *          (distinct values of a field).
 * Boundary: an `Enum.of` value plus the type of the same name; the code is what the `usage.recorded` event carries.
 *           Windows, rollups and quotas are the usage service's (ADR 0216 decisions 3 and 5). One home here, so
 *           actions and model share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 2: meter kinds); ADR 0231 (snake_case codes); STA-1383 (one home for
 *                     duplicated value types).
 */
import { Enum } from "#core/bases/enum.base";

/**
 * The meter kinds.
 *
 * @example
 * Action({ key: "message.send", actors, meter: { name: "messages.sent", kind: MeterKind.Count } });
 */
export const MeterKind = Enum.of({
  /** One per applied call, or one per row. */
  Count: "count",
  /** The total of a numeric field. */
  Sum: "sum",
  /** The largest value of a numeric field. */
  Max: "max",
  /** The latest value of a field. */
  Last: "last",
  /** The distinct values of a field. */
  Unique: "unique",
});

/** One of the codes above. */
export type MeterKind = Enum.Value<typeof MeterKind>;
