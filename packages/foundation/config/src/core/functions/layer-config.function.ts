/**
 * Stackra file contract:
 * Purpose: `layerConfig`, the unvalidated half of building a configuration: construct it (schema defaults, then a
 *          host override's initializers), then the environment through the class's `env` map, then the values layer.
 * Boundary: returns a mutable, unfrozen instance for `sealConfig`. A string from the environment is coerced to the type
 *           of the value it replaces (number, boolean, JSON object or array); anything else is kept for the schema to
 *           judge. A `@Secret` field set by `env` or the values layer is refused: secrets come from the store only.
 *           A field mapped to a safety-critical variable (`SAFETY_CRITICAL_VARIABLES`: `STACKRA_ENVIRONMENT`) is
 *           runtime-only: a value for it is refused (`ConfigInvalidError`), and a set `STACKRA_ENVIRONMENT` must name a
 *           Stackra environment (`readEnvironment`), so a typo fails boot instead of reading as some environment
 *           (STA-2844). Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19: layers apply after construction); ADR 0296 (decision 1, and its amendment
 *                     of 2026-11-26: safety-critical keys come from the runtime only); ADR 0173; STA-2844.
 */
import { ENVIRONMENT_VARIABLE } from "#core/constants/environment-variable.constant";
import { SAFETY_CRITICAL_VARIABLES } from "#core/constants/safety-critical-variables.constant";
import { Secret } from "#core/decorators/secret.decorator";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { configOptionsOf } from "#core/functions/config-options-of.function";
import { readEnvironment } from "#core/functions/read-environment.function";

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

/** Refuses a `STACKRA_ENVIRONMENT` that names no Stackra environment, as the issue of `field` of `name`. */
function environmentOf(name: string, field: string, raw: unknown): void {
  try {
    readEnvironment({ [ENVIRONMENT_VARIABLE]: raw });
  } catch (error) {
    if (!(error instanceof ConfigInvalidError)) throw error;
    throw new ConfigInvalidError(
      name,
      error.issues.map((issue) => ({ path: field, message: `${issue.message} (${issue.path})` })),
    );
  }
}

/**
 * A new instance of `type` with the environment and the values layered on it.
 *
 * @throws TypeError when `type` is not a configuration, or a layer sets a `@Secret` field.
 * @throws ConfigInvalidError when the values set a field mapped to a safety-critical variable, or `STACKRA_ENVIRONMENT`
 *         names no Stackra environment.
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
    if (raw === undefined) continue;
    // The closed list: a typo fails here, named by the field, never read as some environment.
    if (variable === ENVIRONMENT_VARIABLE) environmentOf(type.name, field, raw);
    instance[field] = coerce(raw, instance[field]);
  }
  const runtimeOnly = new Map(
    Object.entries(variables).filter(([, variable]) =>
      SAFETY_CRITICAL_VARIABLES.includes(variable as string),
    ),
  );
  for (const [field, value] of Object.entries(values ?? {})) {
    if (secrets.has(field))
      throw new TypeError(
        `${type.name}.${field} is @Secret("${secrets.get(field)}"): set it in the secret store, never as a value`,
      );
    const variable = runtimeOnly.get(field);
    if (variable !== undefined)
      throw new ConfigInvalidError(type.name, [
        {
          path: field,
          message:
            `is safety-critical: it is read from ${variable as string} in the runtime environment only, never set ` +
            "as a value (a runway `config` block or a test's values); set the variable instead",
        },
      ]);
    instance[field] = value;
  }
  return instance;
}
