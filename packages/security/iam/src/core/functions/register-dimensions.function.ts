/**
 * Stackra file contract:
 * Purpose: `registerDimensions`, how gen's generated entry tells the decision point which model fields carry a
 *          dimension another service owns, so a condition on them is checked against the event-fed projection.
 * Boundary: writes the process-wide registry; a later row for the same model and field replaces the earlier one.
 *           Checks each row so a wrong row fails at boot: a model key, a field under `record`, a dimension key.
 * Runtime: isomorphic
 * Governing contract: ADR 0351 (decisions 1 to 4); ADR 0294 (decisions 10 and 22).
 */
import { DIMENSION_REGISTRY } from "#core/constants/dimension-registry.constant";
import type { DimensionRegistration } from "#core/types/dimension-registration.type";

/** A model or dimension key: a module key, a dot, a snake_case name. */
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** A field under the `record` fact source. */
const FIELD = /^record\.[a-z][a-z0-9_]*$/;

/**
 * Registers dimension-typed fields.
 *
 * @throws TypeError when a row's model or dimension is not a key, or its field is not under `record`.
 * @example
 * registerDimensions([{ model: "orders.order", field: "record.channel_id", dimension: "sales.channel" }]);
 */
export function registerDimensions(rows: readonly DimensionRegistration[]): void {
  for (const row of rows) {
    if (!KEY.test(row.model) || !KEY.test(row.dimension))
      throw new TypeError(`registerDimensions: "${row.model}" or "${row.dimension}" is not a key`);
    if (!FIELD.test(row.field))
      throw new TypeError(`registerDimensions: "${row.field}" is not a field under record`);
    const others = (DIMENSION_REGISTRY.get(row.model) ?? []).filter(
      (held) => held.field !== row.field,
    );
    DIMENSION_REGISTRY.set(row.model, Object.freeze([...others, Object.freeze({ ...row })]));
  }
}
