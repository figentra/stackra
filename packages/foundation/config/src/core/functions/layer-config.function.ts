/**
 * Stackra file contract:
 * Purpose: `layerConfig`, the unvalidated half of building a configuration: construct it (schema defaults, then a
 *          host override's initializers), then the environment through the class's `env` map, then the values layer.
 * Boundary: returns a mutable, unfrozen instance for `sealConfig`. A string from the environment is coerced to the type
 *           of the value it replaces (number, boolean, JSON object or array); anything else is kept for the schema to
 *           judge. A `@Secret` field set by `env` or the values layer is refused: secrets come from the store only.
 *           Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19: layers apply after construction); ADR 0296 (decision 1); ADR 0173.
 */
import { Secret } from "#core/decorators/secret.decorator";
import { configOptionsOf } from "#core/functions/config-options-of.function";

/** An environment string as the type of the value it replaces. */
function coerce(raw: unknown, current: unknown): unknown {
  if (typeof raw !== "string") return raw;
  if (typeof current === "number") return raw.trim() === "" ? Number.NaN : Number(raw);
  if (typeof current === "boolean")
    return raw === "true" || raw === "1" ? true : raw === "false" || raw === "0" ? false : raw;
  if (typeof current === "object" && current !== null) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw; // the schema reports the malformed value by its path
    }
  }
  return raw;
}

/**
 * A new instance of `type` with the environment and the values layered on it.
 *
 * @throws TypeError when `type` is not a configuration, or a layer sets a `@Secret` field.
 * @example
 * const draft = layerConfig(LoyaltyKitConfig, process.env, { maxRedeemPercent: 30 });
 */
export function layerConfig(
  type: new () => object,
  env: Readonly<Record<string, unknown>> | undefined,
  values: object | undefined,
): Record<string, unknown> {
  const { schema, env: variables } = configOptionsOf(type);
  const secrets = Secret.members(schema);
  const instance = Reflect.construct(type, []) as Record<string, unknown>;
  for (const [field, variable] of Object.entries(variables)) {
    if (secrets.has(field))
      throw new TypeError(
        `${type.name}.${field} is @Secret("${secrets.get(field)}"): it is resolved by its secret name, never read from ${variable}`,
      );
    const raw = env?.[variable];
    if (raw !== undefined) instance[field] = coerce(raw, instance[field]);
  }
  for (const [field, value] of Object.entries(values ?? {})) {
    if (secrets.has(field))
      throw new TypeError(
        `${type.name}.${field} is @Secret("${secrets.get(field)}"): set it in the secret store, never as a value`,
      );
    instance[field] = value;
  }
  return instance;
}
