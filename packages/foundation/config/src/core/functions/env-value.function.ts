/**
 * Stackra file contract:
 * Purpose: `envValue`, which builds the `EnvValue<T>` parsers `env` hands out: a zod schema for a set value plus the
 *          chain state (optional, default, empty allowed).
 * Boundary: every chain call returns a new parser; a failure throws `ConfigInvalidError` naming the variable, never
 *           the value. Internal: `env` is the public face.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 and 4).
 */
import type { ZodType } from "zod";

import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import type { EnvValue } from "#core/types/env-value.type";

/** The chain state of one parser. */
interface EnvValueState {
  readonly isOptional: boolean;
  readonly allowsEmpty: boolean;
  readonly fallback?: { readonly value: unknown };
}

/**
 * A parser that checks a set value with `schema`.
 *
 * @example
 * envValue<string>(z.string()).default("dev").parse(process.env.STACKRA_ENVIRONMENT, "STACKRA_ENVIRONMENT");
 */
export function envValue<T>(
  schema: ZodType,
  state: EnvValueState = { isOptional: false, allowsEmpty: false },
): EnvValue<T> {
  return {
    optional: () => envValue<T | undefined>(schema, { ...state, isOptional: true }),
    default: (value) => envValue<NonNullable<T>>(schema, { ...state, fallback: { value } }),
    allowEmpty: () => envValue<T>(schema, { ...state, allowsEmpty: true }),
    parse(value: unknown, name = "value"): T {
      const given = value === "" && !state.allowsEmpty ? undefined : value;
      if (given === undefined) {
        if (state.fallback !== undefined) return state.fallback.value as T;
        if (state.isOptional) return undefined as T;
        throw new ConfigInvalidError("env", [{ path: name, message: "is not set" }]);
      }
      const result = schema.safeParse(given);
      if (!result.success)
        throw new ConfigInvalidError(
          "env",
          result.error.issues.map((issue) => ({ path: name, message: issue.message })),
        );
      return result.data as T;
    },
  };
}
