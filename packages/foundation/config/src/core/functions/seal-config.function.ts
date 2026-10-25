/**
 * Stackra file contract:
 * Purpose: `sealConfig`, the validated half of building a configuration: resolve each `@Secret` field by name, check
 *          every value with the schema's generated `X$`, copy the parsed values back and freeze the instance.
 * Boundary: a secret is held in a non-enumerable getter, so `JSON.stringify`, `Object.keys`, spreads and `console.log`
 *           never show it, and errors name it, never print it. A schema with no registered `X$` throws (gen did not
 *           run, or a test did not register it). Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0146 (validated, frozen; secrets masked); ADR 0173.
 */
import { schemaOf } from "@stackra/validation";

import { Secret } from "#core/decorators/secret.decorator";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { configOptionsOf } from "#core/functions/config-options-of.function";
import { issuesOf } from "#core/functions/issues-of.function";

/**
 * Validates and freezes `instance`, a layered configuration of `type`.
 *
 * @param resolveSecret - resolves a secret name to its value; every secret is missing when absent.
 * @throws ConfigInvalidError when a value breaks its rule or a required secret is missing.
 * @throws TypeError when the schema has no registered generated schema.
 * @example
 * const config = sealConfig(CommerceConfig, layerConfig(CommerceConfig, process.env, undefined), (name) => store.get(name));
 */
export function sealConfig(
  type: new () => object,
  instance: Record<string, unknown>,
  resolveSecret?: (name: string) => string | undefined,
): object {
  const { schema, env } = configOptionsOf(type);
  const secrets = Secret.members(schema);
  const input: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(instance))
    if (value !== undefined) input[field] = value;
  for (const [field, name] of secrets) {
    const value = resolveSecret?.(name);
    if (value !== undefined) input[field as string] = value;
  }
  const result = schemaOf(schema).safeParse(input);
  if (!result.success)
    throw new ConfigInvalidError(type.name, issuesOf(result.error, env, secrets));
  const data = { ...(result.data as Record<string, unknown>) };
  for (const field of secrets.keys()) {
    const value = data[field as string];
    Reflect.deleteProperty(data, field);
    Object.defineProperty(instance, field, {
      get: () => value,
      enumerable: false,
      configurable: false,
    });
  }
  return Object.freeze(Object.assign(instance, data));
}
