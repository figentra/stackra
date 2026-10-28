/**
 * Stackra file contract:
 * Purpose: `EnvValue<T>`, one environment value parser from `env` (`env.str()`, `env.url()`, `env.enum([...])`):
 *          chainable (`.optional()`, `.default(v)`, `.allowEmpty()`) and finished by `.parse(value, name?)`. Generated
 *          build-time files (the Expo `app.config.ts`) read their variables through it.
 * Boundary: a type only. Each chain call returns a new parser; none mutates. An empty string counts as unset unless
 *           `.allowEmpty()` is called.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 and 4); ADR 0127 2026-10-24 note (the old `./env` entry folds into `.`).
 */

/** A parser of one environment value of type `T`. */
export interface EnvValue<T> {
  /** The same parser, returning undefined for an unset value instead of failing. */
  optional: () => EnvValue<T | undefined>;

  /** The same parser, returning `value` for an unset value instead of failing. */
  default: (value: NonNullable<T>) => EnvValue<NonNullable<T>>;

  /** The same parser, keeping an empty string as a value instead of treating it as unset. */
  allowEmpty: () => EnvValue<T>;

  /**
   * Parses one raw value.
   *
   * @param value - the raw value, usually `process.env.X`.
   * @param name - the variable name, for the error message.
   * @throws ConfigInvalidError when the value is unset (and neither optional nor defaulted) or invalid; the message
   *         names `name`, never the value.
   */
  parse: (value: unknown, name?: string) => T;
}
